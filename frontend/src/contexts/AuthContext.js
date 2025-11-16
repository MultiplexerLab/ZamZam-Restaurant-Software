import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                const response = await API.get('/user');
                setUser(response.data);
            }
        } catch (error) {
            localStorage.removeItem('auth_token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, table = '') => {
        const response = await API.post('/login', { email, password, table });
        const { user, token } = response.data;
        
        localStorage.setItem('auth_token', token);
        setUser(user);
        
        return user;
    };

    const register = async (name, email, password, password_confirmation) => {
        const response = await API.post('/register', {
            name,
            email,
            password,
            password_confirmation
        });
        const { user, token } = response.data;
        
        localStorage.setItem('auth_token', token);
        setUser(user);
        
        return user;
    };

    const logout = async () => {
        try {
            await API.post('/logout'); // call backend logout
        } catch (err) {
            if (err.response?.status !== 401) {
                console.error("Logout error:", err);
            }
            // ignore 401 → means already logged out
        } finally {
            setUser(null);
            localStorage.removeItem('auth_token');
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};