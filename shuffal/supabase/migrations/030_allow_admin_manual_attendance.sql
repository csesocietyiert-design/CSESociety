ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_marked_by_role_check;

ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_marked_by_role_check
  CHECK (
    marked_by_role IN (
      'general_secretary',
      'cultural_secretary',
      'technical_secretary',
      'admin'
    )
  );
