# School Timetable and Attendance Management System - Corrected Backend

Spring Boot 3.2.5 + Java 17 + MySQL 8 + Spring Security + JWT + JPA.

## Run
1. Start MySQL.
2. Check `src/main/resources/application.properties`.
3. Default local credentials are `root/root`. If yours differ, change them or set `DB_USERNAME` and `DB_PASSWORD` and update the properties.
4. Set `JWT_SECRET` to a random string of at least 32 characters for production. A development fallback is included so the project can start immediately.
5. Run:
   `mvn spring-boot:run`

## Database
The application uses:
`jdbc:mysql://localhost:3306/school_db?createDatabaseIfNotExist=true`

Hibernate uses `ddl-auto=update`, so the required tables are created/updated automatically.

## Authentication
- `POST /api/auth/register` - public
- `POST /api/auth/login` - public, returns JWT
- `POST /api/auth/logout` - authenticated client-side logout response
- `GET /api/users/profile` - authenticated current profile

Send the token on protected APIs:
`Authorization: Bearer <JWT>`

Demo accounts:
- admin@school.com / Admin@123
- principal@school.com / Principal@123
- ravi.teacher@school.com / Teacher@123
- arjun.student@school.com / Student@123
- rajesh.parent@school.com / Parent@123

Old demo passwords are automatically upgraded to BCrypt on successful login.

## Parent APIs
- `GET /api/parent/{parentId}/children`
- `GET /api/parent/{parentId}/child/{studentId}/attendance`
- `GET /api/parent/{parentId}/child/{studentId}/attendance/percentage`
- `GET /api/parent/{parentId}/notifications`
- `POST /api/parent/{parentId}/children/{studentId}` (ADMIN only)

When a linked child is marked ABSENT, an in-app parent notification is stored automatically. Real SMS/push delivery requires an external provider configuration and is intentionally represented as an in-app notification until credentials are supplied.

## Swagger
After startup: `/swagger-ui.html`
OpenAPI JSON: `/v3/api-docs`

## Important scope note
The SRS includes real biometric SDK integration, SMS/push providers, Google SSO, UDISE export, advanced ML analytics, fee ERP integration, CCTV integration and mobile apps. This backend supplies the core REST/JPA foundation and parent notification storage, but those third-party integrations require provider/device credentials and are not falsely claimed as fully connected.
