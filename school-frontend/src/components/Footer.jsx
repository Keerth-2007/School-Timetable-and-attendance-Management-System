import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div>
          <p>© 2024 School Timetable and Attendance Management System. All rights reserved.</p>
        </div>
        <div className="footer-links">
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a href="#compliance" onClick={(e) => e.preventDefault()}>RTE / UDISE Compliance</a>
          <a href="#support" onClick={(e) => e.preventDefault()}>Support</a>
        </div>
      </div>
    </footer>
  );
}
