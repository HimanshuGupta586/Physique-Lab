import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WeightTracker from './pages/WeightTracker';
import WorkoutTracker from './pages/WorkoutTracker';
import DietTracker from './pages/DietTracker';
import WorkoutAnalytics from './pages/WorkoutAnalytics';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import { Toaster } from 'react-hot-toast';

function App() {
    return (
        <Router>
            <Toaster position="top-right" toastOptions={{ className: 'bg-slate-800 text-white border border-slate-700' }} />
            <div className="min-h-screen bg-slate-900 bg-grid-pattern overflow-x-hidden">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/weights" element={<WeightTracker />} />
                        <Route path="/workouts" element={<WorkoutTracker />} />
                        <Route path="/workout-analytics" element={<WorkoutAnalytics />} />
                        <Route path="/diet" element={<DietTracker />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
