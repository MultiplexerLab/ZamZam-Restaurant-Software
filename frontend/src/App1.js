import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import NotFound from './components/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import Branch from './components/admin/Branch';
import Category from './components/admin/Cetegory';
import Employee from './components/admin/Employee';
import Food from './components/admin/Food';
import Purchase from './components/admin/Purchase';
import SetMenu from './components/admin/SetMenu';
import Layout from './components/Layout';
import FoodMenu from './components/FoodMenu';
import OrderDashboard from './components/admin/OrderDashboard';
import AppRouter from './layout/AppRouter';
// import FoodMenu1 from './components/dining/FooodMenu';

function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

export default App;