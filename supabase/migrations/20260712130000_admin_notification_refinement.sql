-- Refine admin notification payloads for live operations feed

CREATE OR REPLACE FUNCTION public.notify_admin_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    v_title := '🎉 New Member Registration';
    v_body := v_member_name ||
      CASE WHEN v_username <> '' THEN ' (@' || v_username || ')' ELSE '' END ||
      E'\nRegistered successfully.';
    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', v_member_name,
      'username', v_username,
      'user_id', NEW.id,
      'registered_at', NEW.created_at
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
    v_title := '💰 New Investment';
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
    v_title := '⚠️ Payout Request';
    v_body := v_member_name || E'\n₦' || COALESCE(NEW.amount::text, '0') ||
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
      'action_label', 'Review Request'
    );

  ELSIF TG_TABLE_NAME = 'deposits' THEN
    v_event := 'deposit.requested';
    v_priority := 'financial';
    v_title := 'New funding request';
    v_body := COALESCE(NEW.member_name, 'Member') || E'\n₦' || COALESCE(NEW.amount::text, '0');
    v_metadata := jsonb_build_object(
      'priority', v_priority,
      'member_name', NEW.member_name,
      'amount', NEW.amount,
      'reference', NEW.reference,
      'status', COALESCE(NEW.status::text, '')
    );

  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (event_type, title, body, entity_type, entity_id, metadata)
  VALUES (v_event, v_title, v_body, TG_TABLE_NAME, NEW.id, v_metadata);

  RETURN NEW;
END;
$$;
