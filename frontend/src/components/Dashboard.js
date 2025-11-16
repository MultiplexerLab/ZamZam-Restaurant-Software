import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Dashboard</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Logout
                </button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <h2>Welcome, {user?.name}!</h2>
                <p>Email: {user?.email}</p>
                <p>Account created: {new Date(user?.created_at).toLocaleDateString()}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                    <h3>Profile</h3>
                    <p>View and edit your profile information</p>
                    <Link to="/profile">
                        <button style={{ width: '100%', padding: '8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Go to Profile
                        </button>
                    </Link>
                </div>

                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                    <h3>Settings</h3>
                    <p>Configure your account settings</p>
                    <button style={{ width: '100%', padding: '8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Settings (Coming Soon)
                    </button>
                </div>

                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                    <h3>Home</h3>
                    <p>Return to the home page</p>
                    <Link to="/">
                        <button style={{ width: '100%', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>
                            Go Home
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;