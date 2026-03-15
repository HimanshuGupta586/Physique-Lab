import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../store/authSlice';
import { Dumbbell, LogIn, LogOut, User as UserIcon, Activity, Scale, Apple, LayoutDashboard, Menu, X, BarChart3 } from 'lucide-react';

const Header = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/');
        setIsMenuOpen(false);
    };

    const handleLinkClick = () => setIsMenuOpen(false);

    return (
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                        <Dumbbell className="text-teal-400 w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-accent">
                        PhysiqueLab
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:block">
                    <ul className="flex items-center gap-4">
                        {user ? (
                            <>
                                <li>
                                    <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/weights" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        <Scale className="w-4 h-4" /> Weight
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/workouts" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        <Activity className="w-4 h-4" /> Workouts
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/workout-analytics" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        <BarChart3 className="w-4 h-4" /> Analytics
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/diet" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                        <Apple className="w-4 h-4" /> Diet
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/profile" className="flex items-center gap-2 pl-4 border-l border-slate-700 text-slate-300 hover:text-white transition-colors">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-400 to-accent flex items-center justify-center text-xs font-black text-white">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        onClick={onLogout}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link
                                        to="/login"
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        Login
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/register"
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors shadow-lg shadow-teal-500/20"
                                    >
                                        <UserIcon className="w-4 h-4" />
                                        Register
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </nav>

                {/* Mobile Hamburger Toggle */}
                <button
                    className="md:hidden text-slate-300 hover:text-white transition-colors p-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-xl overflow-hidden animate-fade-in origin-top z-40">
                    <ul className="flex flex-col py-2 px-4 space-y-2">
                        {user ? (
                            <>
                                <li className="text-slate-300 flex items-center gap-2 py-3 mb-2 border-b border-slate-800 text-sm font-medium">
                                    <UserIcon className="w-4 h-4 text-teal-500" />
                                    <span>Welcome, {user.name}</span>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/dashboard" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/weights" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <Scale className="w-5 h-5" /> Weight
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/workouts" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <Activity className="w-5 h-5" /> Workouts
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/workout-analytics" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <BarChart3 className="w-5 h-5" /> Analytics
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/diet" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <Apple className="w-5 h-5" /> Diet
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/profile" className="flex items-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <UserIcon className="w-5 h-5" /> Profile
                                    </Link>
                                </li>
                                <li>
                                    <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-3 mt-2 text-base font-medium text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition-colors">
                                        <LogOut className="w-5 h-5" /> Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link onClick={handleLinkClick} to="/login" className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                                        <LogIn className="w-5 h-5" /> Login
                                    </Link>
                                </li>
                                <li>
                                    <Link onClick={handleLinkClick} to="/register" className="flex items-center justify-center gap-2 px-4 py-3 text-base font-medium bg-teal-500 hover:bg-teal-400 text-white rounded-xl transition-colors">
                                        <UserIcon className="w-5 h-5" /> Register
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </header>
    );
};

export default Header;
