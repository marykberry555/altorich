-- Sprint 1: Storage buckets, RLS hardening, notification insert policy

-- Tighten deposit visibility — members only see their own deposits
DROP POLICY IF EXISTS deposits_select ON public.deposits;
CREATE POLICY deposits_select ON public.deposits FOR SELECT
  USING (user_id = auth.uid() OR public.has_admin_role());

-- Allow system to insert notifications via service role (RLS bypass)
-- Members can mark their own notifications read (existing policy)

-- Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('deposit-proofs', 'deposit-proofs', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Avatars: users upload to own folder, public read
DROP POLICY IF EXISTS storage_avatars_insert ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_update ON storage.objects;
DROP POLICY IF EXISTS storage_avatars_select ON storage.objects;

CREATE POLICY storage_avatars_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY storage_avatars_update ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY storage_avatars_select ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Deposit proofs: users upload to own folder, admins can read all
DROP POLICY IF EXISTS storage_deposit_proofs_insert ON storage.objects;
DROP POLICY IF EXISTS storage_deposit_proofs_select ON storage.objects;

CREATE POLICY storage_deposit_proofs_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'deposit-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY storage_deposit_proofs_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'deposit-proofs'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_admin_role()
    )
  );

-- KYC documents: users upload to own folder, admins read
DROP POLICY IF EXISTS storage_kyc_insert ON storage.objects;
DROP POLICY IF EXISTS storage_kyc_select ON storage.objects;

CREATE POLICY storage_kyc_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY storage_kyc_select ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_admin_role()
    )
  );
