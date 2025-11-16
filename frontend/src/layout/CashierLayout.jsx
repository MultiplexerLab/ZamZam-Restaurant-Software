import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";

export default function CashierLayout({ children, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/", label: "🏠 Dashboard" },
    // { to: "order", label: "📊 Order" },
    // { to: "order-detail", label: "📊 Order Details" },
    { to: "payment", label: "📊 Payment" },
    { to: "payment-history", label: "📊 Payment History" },
  ];

  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div
        className="position-fixed h-100 p-3 shadow-sm sidebar-transition"
        style={{
          width: "220px",
          zIndex: 1000,
          background: "linear-gradient(180deg, #1e3c72 0%, #2a5298 100%)",
          color: "#fff",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-220px)",
          transition: "transform 0.3s ease",
        }}
      >
        <h5 className="fw-bold mb-4 text-white">Cashier Panel</h5>
        <ul className="nav flex-column">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to} className="nav-item mb-2">
                <Link
                  to={link.to}
                  className={`nav-link fw-medium ${
                    isActive ? "active-link" : "text-white"
                  }`}
                  style={{
                    borderRadius: "4px",
                    color: "#fff",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Main content */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: sidebarOpen ? "220px" : "0",
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Navbar */}
        <nav
          className="navbar navbar-expand navbar-dark sticky-top px-3 shadow-sm"
          style={{ backgroundColor: "#2a5298" }}
        >
          {/* Sidebar toggle */}
          <button
            className="btn btn-outline-light me-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          <span className="navbar-brand fw-bold"></span>

          {/* Profile Dropdown */}
          <div className="ms-auto">
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                className="d-flex align-items-center"
                id="dropdown-profile"
              >
                {/*<img*/}
                {/*  src="https://i.pravatar.cc/40"*/}
                {/*  alt="Profile"*/}
                {/*  className="rounded-circle me-2"*/}
                {/*  width="32"*/}
                {/*  height="32"*/}
                {/*/>*/}
                <span className="d-none d-md-inline fw-medium">Cashier</span>
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={logout}>🚪 Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </nav>

        {/* Page content */}
        <main
          className="p-4"
          style={{ minHeight: "100vh", background: "#f5f7fa" }}
        >
          {children || <Outlet />}
        </main>
      </div>

      {/* Styles */}
      <style>{`
        .nav-link:hover {
          background-color: rgba(255,255,255,0.2);
          text-decoration: none;
          color: #fff !important;
        }
        .active-link {
          background-color: rgba(255,255,255,0.3);
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
