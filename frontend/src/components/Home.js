import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const { user } = useAuth();

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Welcome to Our Application</h1>
            {user ? (
                <div>
                    <p>Hello, {user.name}! You are logged in.</p>
                    <Link to="/dashboard">
                        <button>Go to Dashboard</button>
                    </Link>
                </div>
            ) : (
                <div>
                    <p>Please log in or register to access the dashboard.</p>
                    <div style={{ marginTop: '20px' }}>
                        <Link to="/login" style={{ marginRight: '10px' }}>
                            <button>Login</button>
                        </Link>
                        <Link to="/register">
                            <button>Register</button>
                        </Link>
                    </div>
                </div>
            )}
            
            <div style={{ marginTop: '40px' }}>
                <h2>About This App</h2>
                <p>This is a single page application built with React and Laravel.</p>
            </div>
        </div>
    );
};

export default Home;