-- Admin notification center: clearer insert copy + status-change events.

CREATE OR REPLACE FUNCTION public.notify_admin_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_event TEXT;
  v_priority TEXT;
  v_metadata JSONB;
  v_member_name TEXT;
  v_username TEXT;
  v_plan_name TEXT;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    v_event := 'member.registered';
    v_priority := 'success';
    v_member_name := COALESCE(NEW.full_name, 'New member');
    v_username := COALESCE(NEW.username, '');
    v_title := 'New member registered';
    v_body := v_member_name || ' has created an Alto Rich account.' ||
      CASE WHEN v_username <> '' THEN E'\n@' || v_username ELSE '' END;
    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'username', v_username,
      'user_id', NEW.id,
      'registered_at', NEW.created_at,
      'action_label', 'View Member'
    );

  ELSIF TG_TABLE_NAME = 'investments' THEN
    v_event := 'investment.created';
    v_priority := 'financial';
    SELECT full_name, username INTO v_member_name, v_username
    FROM public.profiles WHERE id = NEW.user_id;
    SELECT name INTO v_plan_name
    FROM public.investment_plans WHERE id = NEW.plan_id;
    v_member_name := COALESCE(v_member_name, 'Member');
    v_plan_name := COALESCE(v_plan_name, 'Investment package');
    v_title := 'New investment';
    v_body := v_member_name || E'\n' || v_plan_name || E'\n₦' || COALESCE(NEW.amount::text, '0');
    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'username', v_username,
      'user_id', NEW.user_id,
      'package_name', v_plan_name,
      'amount', NEW.amount,
      'reference', COALESCE(NEW.reference, NEW.id::text),
      'status', COALESCE(NEW.status::text, '')
    );

  ELSIF TG_TABLE_NAME = 'withdrawals' THEN
    v_event := 'withdrawal.requested';
    v_priority := 'high';
    SELECT full_name, username INTO v_member_name, v_username
    FROM public.profiles WHERE id = NEW.user_id;
    v_member_name := COALESCE(v_member_name, 'Member');
    v_title := 'Withdrawal requested';
    v_body := 'Member: ' || v_member_name || E'\nAmount: ₦' || COALESCE(NEW.amount::text, '0') ||
      E'\n' || COALESCE(NEW.bank_name, 'Bank') || ' · ' || COALESCE(NEW.account_number, '');
    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'username', v_username,
      'user_id', NEW.user_id,
      'amount', NEW.amount,
      'bank_name', NEW.bank_name,
      'account_number', NEW.account_number,
      'reference', NEW.id::text,
      'status', COALESCE(NEW.status::text, ''),
      'action_label', 'Review Withdrawal'
    );

  ELSIF TG_TABLE_NAME = 'deposits' THEN
    v_event := 'deposit.submitted';
    v_priority := 'financial';
    v_member_name := COALESCE(NEW.member_name, 'Member');
    v_title := 'Deposit submitted';
    v_body := 'Member: ' || v_member_name ||
      E'\nAmount: ₦' || COALESCE(NEW.amount::text, '0') ||
      E'\nReference: ' || COALESCE(NEW.reference, NEW.id::text);
    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'amount', NEW.amount,
      'reference', NEW.reference,
      'user_id', NEW.user_id,
      'status', COALESCE(NEW.status::text, ''),
      'action_label', 'Review Deposit'
    );

  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (event_type, title, body, entity_type, entity_id, metadata)
  VALUES (v_event, v_title, v_body, TG_TABLE_NAME, NEW.id, v_metadata);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_event TEXT;
  v_priority TEXT;
  v_metadata JSONB;
  v_member_name TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'deposits' THEN
    SELECT COALESCE(NEW.member_name, p.full_name, 'Member') INTO v_member_name
    FROM public.profiles p WHERE p.id = NEW.user_id;
    v_member_name := COALESCE(v_member_name, NEW.member_name, 'Member');

    IF NEW.status::text = 'approved' THEN
      v_event := 'deposit.approved';
      v_priority := 'success';
      v_title := 'Deposit approved';
      v_body := 'Member: ' || v_member_name || E'\nAmount: ₦' || COALESCE(NEW.amount::text, '0');
    ELSIF NEW.status::text = 'rejected' THEN
      v_event := 'deposit.rejected';
      v_priority := 'high';
      v_title := 'Deposit rejected';
      v_body := 'Member: ' || v_member_name || E'\nAmount: ₦' || COALESCE(NEW.amount::text, '0');
    ELSE
      RETURN NEW;
    END IF;

    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'amount', NEW.amount,
      'reference', NEW.reference,
      'user_id', NEW.user_id,
      'status', NEW.status::text
    );

  ELSIF TG_TABLE_NAME = 'withdrawals' THEN
    SELECT COALESCE(p.full_name, 'Member') INTO v_member_name
    FROM public.profiles p WHERE p.id = NEW.user_id;
    v_member_name := COALESCE(v_member_name, 'Member');

    IF NEW.status::text IN ('approved', 'paid') THEN
      v_event := 'withdrawal.completed';
      v_priority := 'success';
      v_title := 'Withdrawal completed';
      v_body := 'Member: ' || v_member_name || E'\nAmount: ₦' || COALESCE(NEW.amount::text, '0');
    ELSIF NEW.status::text = 'rejected' THEN
      v_event := 'withdrawal.rejected';
      v_priority := 'high';
      v_title := 'Withdrawal rejected';
      v_body := 'Member: ' || v_member_name || E'\nAmount: ₦' || COALESCE(NEW.amount::text, '0');
    ELSE
      RETURN NEW;
    END IF;

    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'amount', NEW.amount,
      'user_id', NEW.user_id,
      'status', NEW.status::text,
      'reference', NEW.id::text
    );

  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (event_type, title, body, entity_type, entity_id, metadata)
  VALUES (v_event, v_title, v_body, TG_TABLE_NAME, NEW.id, v_metadata);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deposits_admin_status_notify ON public.deposits;
CREATE TRIGGER deposits_admin_status_notify
  AFTER UPDATE OF status ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_status_change();

DROP TRIGGER IF EXISTS withdrawals_admin_status_notify ON public.withdrawals;
CREATE TRIGGER withdrawals_admin_status_notify
  AFTER UPDATE OF status ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_status_change();

REVOKE ALL ON FUNCTION public.notify_admin_on_status_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.notify_admin_on_status_change() FROM anon;
REVOKE ALL ON FUNCTION public.notify_admin_on_status_change() FROM authenticated;
