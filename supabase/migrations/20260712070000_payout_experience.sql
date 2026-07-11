-- Payout experience (part 1): enum value must commit before use in same migration batch.
ALTER TYPE public.withdrawal_status ADD VALUE IF NOT EXISTS 'scheduled';
