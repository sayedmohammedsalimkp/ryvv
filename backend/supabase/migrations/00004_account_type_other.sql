-- Allow 'other' account type (cash kept for legacy rows only)

ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'other';
