import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import {
  FaHamburger,
  FaBuilding,
  FaListAlt,
  FaUser,
  FaMoneyBill,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { name: "Branch", path: "branch", icon: <FaBuilding /> },
    { name: "Category", path: "category", icon: <FaListAlt /> },
    { name: "Food", path: "food", icon: <FaHamburger /> },
    { name: "Setmenu", path: "setmenu", icon: <FaListAlt /> },
    { name: "Purchase", path: "purchase", icon: <FaMoneyBill /> },
    { name: "Employee", path: "employee", icon: <FaUser /> },
  ];

  const isActive = (path) => location.pathname.endsWith(path);

  return (
      <div className="d-flex">
        {/* Sidebar */}
        <div
            className={`bg-dark text-white p-3 vh-100 position-fixed ${
                sidebarOpen ? "d-block" : "d-none d-md-block"
            }`}
            style={{ width: "220px", zIndex: 1000 }}
        >
          <h5 className="mb-4">Admin Panel</h5>
          <ul className="nav flex-column">
            {menuItems.map((item) => (
                <li key={item.path} className="nav-item mb-2">
                  <Link
                      to={item.path}
                      className={`nav-link d-flex align-items-center ${
                          isActive(item.path)
                              ? "bg-secondary text-white rounded"
                              : "text-white"
                      }`}
                  >
                    <span className="me-2">{item.icon}</span> {item.name}
                  </Link>
                </li>
            ))}
          </ul>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
            <div
                className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
                style={{ zIndex: 500 }}
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Main content */}
        <div className="flex-grow-1" style={{ marginLeft: "220px" }}>
          {/* Top Navbar */}
          <nav className="navbar navbar-expand navbar-light bg-light border-bottom sticky-top px-3">
            <button
                className="btn btn-outline-secondary d-md-none me-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <span className="navbar-brand fw-semibold">Admin Dashboard</span>

            {/* Profile Dropdown */}
            <div className="ms-auto">
              <Dropdown align="end">
                <Dropdown.Toggle
                    variant="light"
                    className="d-flex align-items-center"
                    id="admin-dropdown"
                >
                  {/*<img*/}
                  {/*    src="https://i.pravatar.cc/40"*/}
                  {/*    alt="Profile"*/}
                  {/*    className="rounded-circle me-2"*/}
                  {/*    width="32"*/}
                  {/*    height="32"*/}
                  {/*/>*/}
                  <span className="d-none d-md-inline fw-medium">
                  {user?.name || "Admin"}
                </span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {/*<Dropdown.Item as={Link} to="/admin/profile">*/}
                  {/*  👤 Profile*/}
                  {/*</Dropdown.Item>*/}
                  {/*<Dropdown.Divider />*/}
                  <Dropdown.Item onClick={logout}>🚪 Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </nav>

          {/* Page content */}
          <main className="p-4">
            <Outlet />
          </main>
        </div>
      </div>
  );
}
