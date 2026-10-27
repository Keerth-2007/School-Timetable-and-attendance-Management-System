import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="app-root">
      <NavBar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
