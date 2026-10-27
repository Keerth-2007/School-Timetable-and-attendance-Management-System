DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='subject_id') THEN
        ALTER TABLE attendance ADD COLUMN subject_id BIGINT REFERENCES subjects(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='period') THEN
        ALTER TABLE attendance ADD COLUMN period INT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance' AND column_name='timetable_id') THEN
        ALTER TABLE attendance ADD COLUMN timetable_id BIGINT REFERENCES timetable(id);
    END IF;
END $$;

ALTER TABLE attendance DROP CONSTRAINT IF EXISTS ukfh0r5sfdt16udyw5quf5syvwh;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_date_period_key;

-- If there are any duplicate (student_id, date, period) rows before adding constraint, clean them
DELETE FROM attendance a USING attendance b
WHERE a.id < b.id 
  AND a.student_id = b.student_id 
  AND a.date = b.date 
  AND ((a.period IS NULL AND b.period IS NULL) OR a.period = b.period);

ALTER TABLE attendance ADD CONSTRAINT attendance_student_date_period_key UNIQUE (student_id, date, period);
