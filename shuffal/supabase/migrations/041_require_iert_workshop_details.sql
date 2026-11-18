ALTER TABLE public.workshop_registrations
  ADD CONSTRAINT workshop_iert_required_details
  CHECK (
    participant_category <> 'iert'
    OR (
      length(btrim(full_name)) > 0
      AND length(btrim(email)) > 0
      AND aktu_roll_number IS NOT NULL
      AND length(btrim(aktu_roll_number)) > 0
      AND branch IS NOT NULL
      AND length(btrim(branch)) > 0
      AND year IS NOT NULL
      AND year BETWEEN 1 AND 4
      AND whatsapp_phone IS NOT NULL
      AND length(btrim(whatsapp_phone)) > 0
      AND payment_transaction_id IS NOT NULL
      AND length(btrim(payment_transaction_id)) > 0
      AND fee_amount = 149
    )
  ) NOT VALID;

NOTIFY pgrst, 'reload schema';
