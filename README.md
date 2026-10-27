# School Timetable and Attendance Management System — Full Stack

A comprehensive, production-grade K-12 school timetable automation and biometric attendance tracking system developed in strict compliance with the IEEE 830 Software Requirements Specification (SRS).

---

## 1. System Architecture & Tech Stack

| Component | Technology | Configuration / Port |
|---|---|---|
| **Frontend** | React 18, Vite, React Router DOM v6, Axios | Runs on **`http://localhost:8081`** |
| **Backend** | Java 17, Spring Boot 3.2.5, Spring Data JPA | Runs on **`http://localhost:8080`** |
| **Database** | MySQL 8.0+ | `school_db` on port 3306 |
| **Build Tools** | Maven 3.x, npm | Automated dependency resolution |

---

## 2. Default Demo Login Credentials

The system seeds sample accounts across all 6 SRS user roles upon initial database initialization:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **ADMIN** | `admin@school.com` | `Admin@123` | Complete system access, timetable generator, device & room master setup |
| **PRINCIPAL** | `principal@school.com` | `Principal@123` | Full school schedule, leave approvals & substitution confirmation, UDISE reports |
| **TEACHER** | `ravi.teacher@school.com` | `Teacher@123` | Personal timetable, daily class attendance marking, leave application |
| **CLASS TEACHER** | `suresh.classteacher@school.com` | `Teacher@123` | Class 8A attendance marking with audited override capability |
| **STUDENT** | `arjun.student@school.com` | `Student@123` | Personal class schedule, cumulative attendance percentage, session logs |
| **PARENT** | `rajesh.parent@school.com` | `Parent@123` | Enrolled child attendance calendar, absence notifications, academic progress |

> **Tip**: The Login page features **One-Click Quick Login** buttons for each role to facilitate instant live evaluation and viva demonstrations.

---

## 3. How to Run the System

### Prerequisites
- **Java 17+** (JDK installed)
- **Node.js 18+** & npm
- **MySQL 8.0+** running locally on port 3306

### Quick Start (Double-Click Scripts on Windows)
1. Run `start-backend.bat` to launch the Spring Boot REST API server on port 8080.
2. Run `start-frontend.bat` to launch the React Vite frontend on port 8081.
3. Open your browser and navigate to: **`http://localhost:8081`**

---

### Manual Terminal Instructions

#### 1. Start the Backend (`school-system`)
```bash
cd school-system
mvn spring-boot:run
```
*(Or open the `school-system` folder in IntelliJ IDEA and run `SchoolAttendanceApplication.java`)*.

#### 2. Start the Frontend (`school-frontend`)
```bash
cd school-frontend
npm install
npm run dev
```

---

## 4. Key SRS Features & Verification Guide

### 1. Automated Constraint-Based Timetable Generation (FR4)
- Navigate to **Timetable** (`/timetable`).
- Switch between **Class Schedule** (Class 8A) and **Teacher Schedule**.
- Click **"Add Timetable Slot"** to schedule a period.
- **Clash Detection Demonstration**: Try assigning teacher *Ravi Kumar* to *MON Period 1*. The backend constraint validator immediately blocks the conflict and returns HTTP `409 Conflict` with the alert:  
  `"Teacher already assigned at this time slot — cannot double-book"`.
- Click **"Print Wall Display"** for classroom wall timetable printing.

### 2. Biometric Attendance & Audited Overrides (FR5 & FR10)
- Navigate to **Attendance** (`/attendance`).
- View the class attendance register for any date or class section.
- Click **"Override..."** next to an attendance entry.
- **Mandatory Reason Demonstration (FR10)**: Attempting to submit an override without providing an explanation is rejected with HTTP `400 Bad Request`:  
  `"Reason is required for attendance modification"`.

### 3. Below-75% Attendance Compliance Alert (FR8)
- On the Attendance page, click the **"⚠️ Below 75% Risk List"** tab.
- Displays students currently breaching the statutory 75% threshold (such as *Meera Iyer*), complete with parent phone numbers for immediate regulatory notification.

### 4. Staff Leave & Automated Substitution Engine (FR6)
- Log in as Teacher (`ravi.teacher@school.com`) and apply for leave (`/leave`).
- Log in as Principal (`principal@school.com`) and open **Leave** (`/leave`).
- Click **"Suggest Substitute & Approve"**. The substitution engine dynamically analyzes timetable schedules across the entire school to suggest teachers who are **100% free** during all periods taught by the absent teacher.
- Confirm substitute assignment and approve the leave with a single click.

### 5. Biometric Fleet Monitoring (FR5 & FR11)
- Navigate to **Devices** (`/devices`).
- View real-time statuses (ONLINE/OFFLINE), battery levels, and last sync timestamps of RFID, Fingerprint, and Facial recognition terminals.
- Click **"Simulate Real-Time Tap Sync"** to emulate live offline buffer flushing.

### 6. Statutory MIS & Government Compliance (FR8)
- Navigate to **Reports** (`/reports`).
- Review the **Student-Teacher Ratio** (verified against the Right to Education Act mandate of ≤ 30:1).
- Click **"Export UDISE XML Report"** to download the official government submission XML document.

---

## 5. Automated Tests

Run backend unit and MockMvc tests:
```bash
cd school-system
mvn test
```
All 11 controller and service tests (`TimetableControllerTest`, `AttendanceControllerTest`, `AuthControllerTest`) pass with 0 errors and 0 failures.
