-- Remove hardcoded backfill amounts that overwrote real Razorpay payment values.
-- Historical rows without a verified amount are left unchanged; new payments
-- are written from Razorpay API amounts in application code.

-- No-op if the backfill never ran. Safe to apply multiple times.
