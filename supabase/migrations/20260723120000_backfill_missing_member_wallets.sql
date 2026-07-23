-- Ensure every profile has NGN + REF wallets (legacy rows may only have REF).
INSERT INTO public.wallets (user_id, currency)
SELECT p.id, 'NGN'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = p.id AND w.currency = 'NGN'
);

INSERT INTO public.wallets (user_id, currency)
SELECT p.id, 'REF'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = p.id AND w.currency = 'REF'
);
