import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const login = async (userId, password) => {
        try {
            const response = await axios.post(`${API_BASE}/auth/login`, { userId, password });
            const { token, user: userData } = response.data;
            
            localStorage.setItem('gb_token', token);
            localStorage.setItem('gb_user', JSON.stringify(userData));
            
            setUser(userData);
            return userData;
        } catch (error) {
            const message = error.response?.data?.error || error.message || 'Login failed';
            throw new Error(message);
        }
    };

    const logout = useCallback(async () => {
        try {
            const token = localStorage.getItem('gb_token');
            if (token && user) {
                await axios.post(`${API_BASE}/auth/logout`, { userId: user.userId });
            }
        } catch (err) {
            console.error('Logout log failed', err);
        } finally {
            localStorage.removeItem('gb_token');
            localStorage.removeItem('gb_user');
            setUser(null);
            window.location.href = '/login';
        }
    }, [user, API_BASE]);

    useEffect(() => {
        const storedUser = localStorage.getItem('gb_user');
        const token = localStorage.getItem('gb_token');
        
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const value = {
        user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
