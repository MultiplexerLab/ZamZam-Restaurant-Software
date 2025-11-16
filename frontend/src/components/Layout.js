import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const handleLogout = async () => {
        await logout();
    };

    // handle window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { to: '/branch', label: 'Branch', icon: '🏢' },
        { to: '/category', label: 'Category', icon: '📂' },
        { to: '/food', label: 'Food', icon: '🍔' },
        { to: '/employee', label: 'Employee', icon: '👥' },
        { to: '/purchase', label: 'Purchase', icon: '🛒' },
    ];

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <div style={{
                position: isMobile ? 'fixed' : 'relative',
                left: isMobile ? (mobileSidebarOpen ? 0 : '-240px') : 0,
                top: 0,
                height: '100%',
                width: sidebarOpen ? '220px' : '60px',
                background: '#343a40',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 10px',
                transition: 'all 0.3s',
                zIndex: 1000
            }}>
                <div style={{
                    marginBottom: '30px',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    textAlign: 'center'
                }}>
                    {sidebarOpen ? 'MyApp' : 'M'}
                </div>

                {menuItems.map((item, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>
                        <SidebarLink
                            to={item.to}
                            active={location.pathname === item.to}
                            icon={item.icon}
                            open={sidebarOpen}
                            label={item.label}
                        />
                    </div>
                ))}

                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{
                        marginTop: 'auto',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        padding: '10px',
                        width: '100%',
                        display: isMobile ? 'none' : 'block'
                    }}
                >
                    {sidebarOpen ? '⬅️ Collapse' : '➡️'}
                </button>
            </div>

            {/* Overlay for mobile */}
            {isMobile && mobileSidebarOpen && (
                <div
                    onClick={() => setMobileSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        zIndex: 999
                    }}
                />
            )}

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : sidebarOpen ? '220px' : '60px', transition: 'margin 0.3s' }}>
                {/* Top Bar */}
                <div style={{
                    height: '60px',
                    background: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 20px',
                    borderBottom: '1px solid #dee2e6',
                    position: 'relative'
                }}>
                    {isMobile && (
                        <button
                            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                            style={{
                                fontSize: '1.5rem',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer'
                            }}
                        >
                            ☰
                        </button>
                    )}

                    {user && (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setProfileOpen(!profileOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #ced4da',
                                    background: '#e9ecef',
                                    cursor: 'pointer'
                                }}
                            >
                                {user.name} ▼
                            </button>

                            {profileOpen && (
                                <div style={{
                                    position: 'absolute',
                                    right: 0,
                                    top: '100%',
                                    background: 'white',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    marginTop: '5px',
                                    zIndex: 1000
                                }}>
                                    <Link to="/profile" style={dropdownLinkStyle}>Profile</Link>
                                    <button onClick={handleLogout} style={dropdownLinkStyle}>Logout</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Page Content */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Sidebar link with tooltip
const SidebarLink = ({ to, active, icon, open, label }) => (
    <Link
        to={to}
        style={{
            color: 'white',
            textDecoration: 'none',
            padding: '10px',
            borderRadius: '4px',
            background: active ? '#495057' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            whiteSpace: 'nowrap',
            position: 'relative'
        }}
        data-tooltip-id={label}
        data-tooltip-content={label}
    >
        <span>{icon}</span>
        {open && <span>{label}</span>}
        {!open && <Tooltip id={label} place="right" />}
    </Link>
);

const dropdownLinkStyle = {
    display: 'block',
    padding: '10px 15px',
    textDecoration: 'none',
    color: '#343a40',
    background: 'white',
    borderBottom: '1px solid #ced4da',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer'
};

export default Layout;
