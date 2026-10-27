package com.examly.springapp.config;

import com.examly.springapp.entity.*;
import com.examly.springapp.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Runs once automatically when the app starts and inserts a handful of
 * demo records (users, subjects, rooms, a timetable, attendance, a leave
 * application, a device). This means you can start the server and
 * immediately test every API in Postman without manually creating data first.
 */
@Component
public class DataLoader implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final RoomRepository roomRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveApplicationRepository leaveApplicationRepository;
    private final BiometricDeviceRepository biometricDeviceRepository;

    public DataLoader(UserRepository userRepository,
                       SubjectRepository subjectRepository,
                       RoomRepository roomRepository,
                       TimetableRepository timetableRepository,
                       AttendanceRepository attendanceRepository,
                       LeaveApplicationRepository leaveApplicationRepository,
                       BiometricDeviceRepository biometricDeviceRepository) {
        this.userRepository = userRepository;
        this.subjectRepository = subjectRepository;
        this.roomRepository = roomRepository;
        this.timetableRepository = timetableRepository;
        this.attendanceRepository = attendanceRepository;
        this.leaveApplicationRepository = leaveApplicationRepository;
        this.biometricDeviceRepository = biometricDeviceRepository;
    }

    @Override
    public void run(String... args) {

        // With MySQL, data persists between restarts (unlike the old H2 setup).
        // Without this check, restarting the app would try to insert the same
        // demo emails again and crash on the unique-email constraint.
        if (userRepository.count() > 0) {
            System.out.println("Demo data already present - skipping seed.");
            return;
        }

        // ---------- Users ----------
        User admin = new User("Admin User", "admin@school.com", "Admin@123", "9000000001", User.Role.ADMIN);
        User principal = new User("Priya Principal", "principal@school.com", "Principal@123", "9000000002", User.Role.PRINCIPAL);

        User teacher1 = new User("Ravi Kumar", "ravi.teacher@school.com", "Teacher@123", "9000000003", User.Role.TEACHER);
        teacher1.setEmployeeId("EMP001");

        User teacher2 = new User("Anita Sharma", "anita.teacher@school.com", "Teacher@123", "9000000004", User.Role.TEACHER);
        teacher2.setEmployeeId("EMP002");

        User classTeacher = new User("Suresh Nair", "suresh.classteacher@school.com", "Teacher@123", "9000000005", User.Role.CLASS_TEACHER);
        classTeacher.setEmployeeId("EMP003");
        classTeacher.setClassSection("8A");

        User student1 = new User("Arjun Singh", "arjun.student@school.com", "Student@123", "9000000006", User.Role.STUDENT);
        student1.setAdmissionNumber("ADM2024001");
        student1.setClassSection("8A");
        student1.setParentMobile("9111111111");

        User student2 = new User("Meera Iyer", "meera.student@school.com", "Student@123", "9000000007", User.Role.STUDENT);
        student2.setAdmissionNumber("ADM2024002");
        student2.setClassSection("8A");
        student2.setParentMobile("9222222222");

        User parent = new User("Rajesh Singh", "rajesh.parent@school.com", "Parent@123", "9111111111", User.Role.PARENT);

        userRepository.save(admin);
        userRepository.save(principal);
        userRepository.save(teacher1);
        userRepository.save(teacher2);
        userRepository.save(classTeacher);
        userRepository.save(student1);
        userRepository.save(student2);
        parent.getChildren().add(student1);
        userRepository.save(parent);

        // ---------- Subjects & Rooms ----------
        Subject maths = subjectRepository.save(new Subject("Mathematics", "MATH101"));
        Subject science = subjectRepository.save(new Subject("Science", "SCI101"));

        Room room101 = roomRepository.save(new Room("Room 101", 40, "CLASSROOM"));
        Room labA = roomRepository.save(new Room("Lab A", 30, "LAB"));

        // ---------- Timetable (class 8A, Monday) ----------
        Timetable slot1 = new Timetable();
        slot1.setClassSection("8A");
        slot1.setDay(Timetable.Day.MON);
        slot1.setPeriod(1);
        slot1.setSubject(maths);
        slot1.setTeacher(teacher1);
        slot1.setRoom(room101);
        slot1.setEffectiveFrom(LocalDate.now());
        slot1.setIsActive(true);
        timetableRepository.save(slot1);

        Timetable slot2 = new Timetable();
        slot2.setClassSection("8A");
        slot2.setDay(Timetable.Day.MON);
        slot2.setPeriod(2);
        slot2.setSubject(science);
        slot2.setTeacher(teacher2);
        slot2.setRoom(labA);
        slot2.setEffectiveFrom(LocalDate.now());
        slot2.setIsActive(true);
        timetableRepository.save(slot2);

        // ---------- Attendance ----------
        Attendance a1 = new Attendance();
        a1.setStudent(student1);
        a1.setDate(LocalDate.now());
        a1.setStatus(Attendance.Status.PRESENT);
        a1.setCapturedBy(Attendance.CapturedBy.BIOMETRIC);
        a1.setRecordedBy(teacher1);
        attendanceRepository.save(a1);

        Attendance a2 = new Attendance();
        a2.setStudent(student2);
        a2.setDate(LocalDate.now());
        a2.setStatus(Attendance.Status.ABSENT);
        a2.setCapturedBy(Attendance.CapturedBy.BIOMETRIC);
        a2.setRecordedBy(teacher1);
        attendanceRepository.save(a2);

        // ---------- Leave application ----------
        LeaveApplication leave = new LeaveApplication();
        leave.setTeacher(teacher2);
        leave.setLeaveType(LeaveApplication.LeaveType.CL);
        leave.setFromDate(LocalDate.now().plusDays(2));
        leave.setToDate(LocalDate.now().plusDays(2));
        leave.setReason("Personal work");
        leaveApplicationRepository.save(leave);

        // ---------- Biometric device ----------
        BiometricDevice device = new BiometricDevice();
        device.setDeviceName("Main Gate Scanner");
        device.setLocation("Main Entrance");
        device.setDeviceType(BiometricDevice.DeviceType.RFID);
        device.setLastSync(LocalDateTime.now());
        device.setBatteryLevel(85);
        device.setStatus(BiometricDevice.Status.ONLINE);
        biometricDeviceRepository.save(device);

        System.out.println("========================================================");
        System.out.println(" Demo data loaded. Try these logins at POST /api/auth/login");
        System.out.println("   admin@school.com / Admin@123");
        System.out.println("   principal@school.com / Principal@123");
        System.out.println("   ravi.teacher@school.com / Teacher@123");
        System.out.println("   arjun.student@school.com / Student@123");
        System.out.println("========================================================");
    }
}
