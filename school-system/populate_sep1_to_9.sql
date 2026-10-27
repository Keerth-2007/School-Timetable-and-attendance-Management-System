-- Clean up legacy rows with NULL period or future dates (> 2026-09-09)
DELETE FROM attendance WHERE period IS NULL;
DELETE FROM attendance WHERE date > '2026-09-09';
DELETE FROM attendance WHERE date >= '2026-09-01' AND date <= '2026-09-09';

-- Ensure user 31 is Keerthana in 8A
UPDATE users SET class_section = '8A', admission_number = '123456' WHERE id = 31;
-- Also ensure user 10 (if accessed) has class 8A
UPDATE users SET class_section = '8A', admission_number = '123456' WHERE id = 10;

-- Function to insert attendance for students 31, 10, 6, 7
DO $$
DECLARE
    st_id BIGINT;
    r_by BIGINT := 3; -- Ravi Kumar (default recordedBy)
BEGIN
    -- Loop through students in class 8A: 31 (Keerthana), 10 (Keerthana alias), 6 (Arjun), 7 (Meera)
    FOR st_id IN SELECT unnest(ARRAY[31, 10, 6, 7]::BIGINT[]) LOOP

        -- ========================================================
        -- SEP 1, 2026 (Tuesday)
        -- ========================================================
        -- P1: English (subj 5, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-01', 1, 5, CASE WHEN st_id IN (31, 10) THEN 'PRESENT' ELSE 'PRESENT' END, 'RFID', 5, NULL);
        
        -- P2: Mathematics (subj 1, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-01', 2, 1, 'PRESENT', 'BIOMETRIC', 3, NULL);

        -- P3: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-01', 3, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P4: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-01', 4, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P5: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-01', 5, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P6: Yoga & Physical Education (subj 6, teacher 3) -> Keerthana Absent
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-01', 6, 6, CASE WHEN st_id IN (31, 10) THEN 'ABSENT' ELSE 'PRESENT' END, 'MANUAL', 3, CASE WHEN st_id IN (31, 10) THEN 'Exemption note - ankle sprain' ELSE NULL END);

        -- ========================================================
        -- SEP 2, 2026 (Wednesday)
        -- ========================================================
        -- P1: Physics (subj 3, teacher 3) -> Keerthana Late
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-02', 1, 3, CASE WHEN st_id IN (31, 10) THEN 'LATE' ELSE 'PRESENT' END, 'MANUAL', 3, CASE WHEN st_id IN (31, 10) THEN 'Transit delay at traffic intersection' ELSE NULL END);

        -- P2: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-02', 2, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P3: English (subj 5, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-02', 3, 5, 'PRESENT', 'RFID', 5, NULL);

        -- P4: Mathematics (subj 1, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-02', 4, 1, 'PRESENT', 'BIOMETRIC', 3, NULL);

        -- P5: Computer Science (subj 7, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-02', 5, 7, 'PRESENT', 'RFID', 5, NULL);

        -- P6: Biology (subj 8, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-02', 6, 8, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- ========================================================
        -- SEP 3, 2026 (Thursday)
        -- ========================================================
        -- P1: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-03', 1, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P2: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-03', 2, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P3: Mathematics (subj 1, teacher 3) -> Keerthana Absent
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-03', 3, 1, CASE WHEN st_id IN (31, 10) THEN 'ABSENT' ELSE 'PRESENT' END, 'MANUAL', 3, CASE WHEN st_id IN (31, 10) THEN 'Medical Leave - Viral Fever' ELSE NULL END);

        -- P4: English (subj 5, teacher 5) -> Keerthana Absent
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-03', 4, 5, CASE WHEN st_id IN (31, 10) THEN 'ABSENT' ELSE 'PRESENT' END, 'MANUAL', 5, CASE WHEN st_id IN (31, 10) THEN 'Medical Leave - Viral Fever' ELSE NULL END);

        -- P5: Biology (subj 8, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-03', 5, 8, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P6: Computer Science (subj 7, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-03', 6, 7, 'PRESENT', 'RFID', 5, NULL);

        -- ========================================================
        -- SEP 4, 2026 (Friday)
        -- ========================================================
        -- P1: Yoga & Physical Education (subj 6, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-04', 1, 6, 'PRESENT', 'RFID', 3, NULL);

        -- P2: English (subj 5, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-04', 2, 5, 'PRESENT', 'RFID', 5, NULL);

        -- P3: Mathematics (subj 1, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-04', 3, 1, 'PRESENT', 'BIOMETRIC', 3, NULL);

        -- P4: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-04', 4, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P5: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-04', 5, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P6: Computer Science (subj 7, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-04', 6, 7, 'PRESENT', 'RFID', 5, NULL);

        -- ========================================================
        -- SEP 5, 2026 (Saturday)
        -- ========================================================
        -- P1: English (subj 5, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-05', 1, 5, 'PRESENT', 'RFID', 5, NULL);

        -- P2: Physics (subj 3, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-05', 2, 3, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P3: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-05', 3, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P4: Yoga & Physical Education (subj 6, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-05', 4, 6, 'PRESENT', 'RFID', 4, NULL);

        -- P5: Mathematics (subj 1, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-05', 5, 1, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P6: Computer Science (subj 7, teacher 5) -> Keerthana Excused
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-05', 6, 7, CASE WHEN st_id IN (31, 10) THEN 'EXCUSED' ELSE 'PRESENT' END, 'MANUAL', 5, CASE WHEN st_id IN (31, 10) THEN 'Inter-school debate tournament' ELSE NULL END);

        -- ========================================================
        -- SEP 6, 2026 (Sunday - Weekend Remedial / Special Sessions)
        -- ========================================================
        -- P1: Mathematics (subj 1, teacher 3) -> Keerthana Absent
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-06', 1, 1, CASE WHEN st_id IN (31, 10) THEN 'ABSENT' ELSE 'PRESENT' END, 'MANUAL', 3, CASE WHEN st_id IN (31, 10) THEN 'Weekend family travel' ELSE NULL END);

        -- P2: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-06', 2, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P3: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-06', 3, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P4: English (subj 5, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-06', 4, 5, 'PRESENT', 'RFID', 5, NULL);

        -- ========================================================
        -- SEP 7, 2026 (Monday)
        -- ========================================================
        -- P1: Mathematics (subj 1, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-07', 1, 1, 'PRESENT', 'BIOMETRIC', 3, NULL);

        -- P2: English (subj 5, teacher 5) -> Keerthana Absent
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-07', 2, 5, CASE WHEN st_id IN (31, 10) THEN 'ABSENT' ELSE 'PRESENT' END, 'MANUAL', 5, CASE WHEN st_id IN (31, 10) THEN 'Dentist appointment leave' ELSE NULL END);

        -- P3: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-07', 3, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P4: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-07', 4, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P5: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-07', 5, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P6: Computer Science (subj 7, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-07', 6, 7, 'PRESENT', 'RFID', 5, NULL);

        -- ========================================================
        -- SEP 8, 2026 (Tuesday)
        -- ========================================================
        -- P1: English (subj 5, teacher 5) -> Keerthana Late
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-08', 1, 5, CASE WHEN st_id IN (31, 10) THEN 'LATE' ELSE 'PRESENT' END, 'MANUAL', 5, CASE WHEN st_id IN (31, 10) THEN 'Late bus arrival pass' ELSE NULL END);

        -- P2: Mathematics (subj 1, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-08', 2, 1, 'PRESENT', 'BIOMETRIC', 3, NULL);

        -- P3: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-08', 3, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P4: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-08', 4, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P5: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-08', 5, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P6: Yoga & Physical Education (subj 6, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-08', 6, 6, 'PRESENT', 'RFID', 3, NULL);

        -- ========================================================
        -- SEP 9, 2026 (Wednesday - Current Day)
        -- ========================================================
        -- P1: Physics (subj 3, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-09', 1, 3, 'PRESENT', 'RFID', 3, NULL);

        -- P2: Chemistry (subj 4, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-09', 2, 4, 'PRESENT', 'BIOMETRIC', 4, NULL);

        -- P3: English (subj 5, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-09', 3, 5, 'PRESENT', 'RFID', 5, NULL);

        -- P4: Mathematics (subj 1, teacher 3)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-09', 4, 1, 'PRESENT', 'BIOMETRIC', 3, NULL);

        -- P5: Computer Science (subj 7, teacher 5)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-09', 5, 7, 'PRESENT', 'RFID', 5, NULL);

        -- P6: Biology (subj 8, teacher 4)
        INSERT INTO attendance (student_id, date, period, subject_id, status, captured_by, recorded_by, modification_reason)
        VALUES (st_id, '2026-09-09', 6, 8, 'PRESENT', 'BIOMETRIC', 4, NULL);

    END LOOP;
END $$;
