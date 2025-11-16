import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <nav style={{ 
            background: '#343a40', 
            padding: '1rem 0',
            marginBottom: '20px'
        }}>
            <div style={{ 
                maxWidth: '1200px', 
                margin: '0 auto', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0 20px'
            }}>
                <Link to="/" style={{ 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold' 
                }}>
                    Zamzam
                </Link>

                <div>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ color: 'white' }}>Hello, {user.name}</span>
                            <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
                                Dashboard
                            </Link>
                            <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>
                                Profile
                            </Link>
                            <Link to="/branch" style={{ color: 'white', textDecoration: 'none' }}>
                                Branch
                            </Link>
                            <Link to="/category" style={{ color: 'white', textDecoration: 'none' }}>
                                Category
                            </Link>

                            <Link to="/food" style={{ color: 'white', textDecoration: 'none' }}>
                                Food
                            </Link>

                            <Link to="/employee" style={{ color: 'white', textDecoration: 'none' }}>
                                Exployee
                            </Link>
                            <Link to="/purchase" style={{ color: 'white', textDecoration: 'none' }}>
                                Purchase
                            </Link>
                            <button 
                                onClick={handleLogout}
                                style={{ 
                                    background: '#dc3545', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '5px 10px', 
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link 
                                to="/login" 
                                style={{ 
                                    color: 'white', 
                                    textDecoration: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    background: location.pathname === '/login' ? '#495057' : 'transparent'
                                }}
                            >
                                Login
                            </Link>
                            <Link 
                                to="/register" 
                                style={{ 
                                    color: 'white', 
                                    textDecoration: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    background: location.pathname === '/register' ? '#495057' : 'transparent'
                                }}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;