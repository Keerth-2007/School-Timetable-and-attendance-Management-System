import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT auth token
api.interceptors.request.use(
  (config) => {
    try {
      const userJson = localStorage.getItem('school_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      }
    } catch (e) {
      console.error('Error attaching auth token', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let msg = 'An unexpected error occurred';
    if (error.response && error.response.data) {
      msg = error.response.data.message || error.response.data.error || msg;
    } else if (error.message) {
      msg = error.message;
    }
    return Promise.reject(new Error(msg));
  }
);

// Auth APIs
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  checkEmail: (email) => api.get(`/auth/check-email?email=${encodeURIComponent(email)}`),
  logout: () => api.post('/auth/logout'),
};

// Users APIs
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/profile/${id}`),
  getByRole: (role) => api.get(`/users/role/${role}`),
  update: (id, user) => api.put(`/users/${id}`, user),
  delete: (id) => api.delete(`/users/${id}`),
};

// Subjects APIs
export const subjectsApi = {
  getAll: () => api.get('/subjects'),
  create: (subjectData) => api.post('/subjects', subjectData),
  delete: (id) => api.delete(`/subjects/${id}`),
};

// Timetable APIs
export const timetableApi = {
  getByClass: (classSection) => api.get(`/timetable/class/${classSection}`),
  getByClassAndDate: (classSection, date) => api.get(`/timetable/class/${classSection}/date/${date}`),
  getByTeacher: (teacherId) => api.get(`/timetable/teacher/${teacherId}`),
  createSlot: (slotData) => api.post('/timetable/generate', slotData),
  updateSlot: (id, slotData) => api.put(`/timetable/${id}`, slotData),
  deleteSlot: (id) => api.delete(`/timetable/${id}`),
  getAll: () => api.get('/timetable'),
  getClashes: () => api.get('/timetable/clashes'),
};

// Attendance APIs
export const attendanceApi = {
  mark: (attendanceData) => api.post('/attendance', attendanceData),
  saveSession: (sessionData) => api.post('/attendance/session', sessionData),
  getSession: (classSection, date, period) =>
    api.get('/attendance/session', { params: { classSection, date, period } }),
  getByClassAndDate: (classSection, date) => api.get(`/attendance/class/${classSection}/date/${date}`),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  getStudentMonth: (studentId, year, month) =>
    api.get(`/attendance/student/${studentId}/month`, { params: { year, month } }),
  getTeacherMonthlySummary: (classSection, year, month) =>
    api.get('/attendance/summary/monthly', { params: { classSection, year, month } }),
  getPercentage: (studentId) => api.get(`/attendance/student/${studentId}/percentage`),
  override: (id, status, reason) => api.put(`/attendance/${id}/override`, { status, reason }),
  getBelow75: () => api.get('/attendance/below75'),
};

// Leave APIs
export const leaveApi = {
  apply: (leaveData) => api.post('/leave', leaveData),
  getPending: () => api.get('/leave/pending'),
  suggestSubstitutes: (teacherId) => api.get(`/leave/suggest-substitute/${teacherId}`),
  approve: (id, approvedById, substituteTeacherId) => api.put(`/leave/${id}/approve`, { approvedById, substituteTeacherId }),
  reject: (id, approvedById, reason) => api.put(`/leave/${id}/reject`, { approvedById, reason }),
  getBalance: (teacherId) => api.get(`/leave/balance/${teacherId}`),
  getHistory: (teacherId) => api.get(`/leave/history/${teacherId}`),
};

// Devices APIs
export const devicesApi = {
  getAll: () => api.get('/devices'),
  getById: (id) => api.get(`/devices/${id}`),
  create: (deviceData) => api.post('/devices', deviceData),
  update: (id, deviceData) => api.put(`/devices/${id}`, deviceData),
  delete: (id) => api.delete(`/devices/${id}`),
  simulateTap: (deviceId, studentId) => api.post(`/devices/${deviceId}/tap`, { studentId }),
};

// Parent Portal APIs (FR7)
export const parentApi = {
  getChildren: (parentId) => api.get(`/parent/${parentId}/children`),
  getChildAttendance: (parentId, studentId) => api.get(`/parent/${parentId}/child/${studentId}/attendance`),
  getChildPercentage: (parentId, studentId) => api.get(`/parent/${parentId}/child/${studentId}/attendance/percentage`),
  getChildAssignments: (parentId, studentId) => api.get(`/parent/${parentId}/child/${studentId}/assignments`),
  getChildReportCard: (parentId, studentId, examName, academicYear) =>
    api.get(`/parent/${parentId}/child/${studentId}/report-card`, { params: { examName, academicYear } }),
  getChildExams: (parentId, studentId) => api.get(`/parent/${parentId}/child/${studentId}/exams`),
  getNotifications: (parentId) => api.get(`/parent/${parentId}/notifications`),
};

// Notification APIs
export const notificationsApi = {
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// Analytics & Reports APIs (FR8, FR9, FR17)
export const analyticsApi = {
  getTrends: () => api.get('/analytics/trends'),
  getEarlyWarning: () => api.get('/analytics/early-warning'),
  getWorkload: () => api.get('/analytics/workload'),
  getSchoolInfo: () => api.get('/school/info'),
  downloadUdiseXmlUrl: `${API_BASE_URL}/reports/udise/xml`,
};

// Subjects & Rooms APIs
export const metadataApi = {
  getSubjects: () => api.get('/subjects'),
  createSubject: (subject) => api.post('/subjects', subject),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  getRooms: () => api.get('/rooms'),
  createRoom: (room) => api.post('/rooms', room),
  deleteRoom: (id) => api.delete(`/rooms/${id}`),
};

// Academic Calendar APIs (FR12)
export const calendarApi = {
  getEvents: (params) => api.get('/calendar/events', { params }),
  getById: (id) => api.get(`/calendar/events/${id}`),
  createEvent: (data) => api.post('/calendar/events', data),
  updateEvent: (id, data) => api.put(`/calendar/events/${id}`, data),
  cancelEvent: (id) => api.put(`/calendar/events/${id}/cancel`),
  publishEvent: (id) => api.put(`/calendar/events/${id}/publish`),
  deleteEvent: (id) => api.delete(`/calendar/events/${id}`),
  getUpcoming: (limit = 5) => api.get('/calendar/upcoming', { params: { limit } }),
  getWorkingDays: (academicYear, year, month) =>
    api.get('/calendar/working-days', { params: { academicYear, year, month } }),
};

// Transport Management APIs
export const transportApi = {
  getMyTransport: () => api.get('/transport/my-transport'),
  getStudentTransport: (studentId) => api.get(`/transport/student/${studentId}`),
  getRoutes: () => api.get('/transport/routes'),
  getVehicles: () => api.get('/transport/vehicles'),
  getStopsByRoute: (routeId) => api.get(`/transport/stops/route/${routeId}`),
  getAssignments: () => api.get('/transport/assignments'),
  assignStudent: (data) => api.post('/transport/assign', data),
  updateAssignment: (id, data) => api.put(`/transport/assignment/${id}`, data),
  deleteAssignment: (id) => api.delete(`/transport/assignment/${id}`),
};

// Assignment Management APIs
export const assignmentApi = {
  getAll: (params) => api.get('/assignments', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (formData) => api.post('/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  getTeacherAssignments: (teacherId) => api.get(`/assignments/teacher/${teacherId}`),
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  gradeSubmission: (submissionId, gradeData) => api.post(`/assignments/submissions/${submissionId}/grade`, gradeData),

  // Student endpoints
  getMyAssignments: () => api.get('/assignments/my-assignments'),
  getStudentAssignments: (studentId) => api.get(`/assignments/student/${studentId}`),
  submitAssignment: (assignmentId, formData) => api.post(`/assignments/${assignmentId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMySubmission: (assignmentId) => api.get(`/assignments/${assignmentId}/my-submission`),

  // File download helper URL and binary methods
  downloadSubmissionUrl: (submissionId) => `${API_BASE_URL}/assignments/submissions/${submissionId}/download`,
  downloadAttachmentUrl: (assignmentId) => `${API_BASE_URL}/assignments/${assignmentId}/attachment/download`,
  downloadSubmissionBlob: (submissionId) => api.get(`/assignments/submissions/${submissionId}/download`, { responseType: 'blob' }),
  downloadAttachmentBlob: (assignmentId) => api.get(`/assignments/${assignmentId}/attachment/download`, { responseType: 'blob' }),
};

// Report Card & Academic Results APIs
export const reportCardApi = {
  getStudentReportCard: (studentId, examName, academicYear) =>
    api.get(`/report-cards/student/${studentId}`, { params: { examName, academicYear } }),
  getStudentExams: (studentId) => api.get(`/report-cards/student/${studentId}/exams`),
  getAllExams: () => api.get('/report-cards/exams'),
  saveMarks: (marksData) => api.post('/report-cards/marks', marksData),
  publishReportCard: (publishData) => api.post('/report-cards/publish', publishData),
};

// Fees Management APIs
export const feesApi = {
  getSummary: (academicYear) => api.get('/fees/summary', { params: { academicYear } }),
  getStructures: (params) => api.get('/fees/structures', { params }),
  getStructureById: (id) => api.get(`/fees/structures/${id}`),
  createStructure: (data) => api.post('/fees/structures', data),
  updateStructure: (id, data) => api.put(`/fees/structures/${id}`, data),
  deleteStructure: (id) => api.delete(`/fees/structures/${id}`),
  assignFee: (data) => api.post('/fees/assign', data),
  getAllFees: (params) => api.get('/fees', { params }),
  getPendingFees: (params) => api.get('/fees/pending', { params }),
  getMyFees: () => api.get('/fees/my'),
  getStudentFees: (studentId) => api.get(`/fees/student/${studentId}`),
  getTeacherClassFees: (classSection) => api.get(`/fees/teacher/class/${classSection}`),
  recordPayment: (data) => api.post('/fees/payments', data),
  getPayments: (params) => api.get('/fees/payments', { params }),
  getMyPayments: () => api.get('/fees/payments/my'),
  getStudentPayments: (studentId) => api.get(`/fees/payments/student/${studentId}`),
  getReceiptByNumber: (receiptNumber) => api.get(`/fees/receipts/${receiptNumber}`),
  getReceiptByPaymentId: (paymentId) => api.get(`/fees/receipts/payment/${paymentId}`),
};

export default api;
