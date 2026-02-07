import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, Command } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
    const location = useLocation();

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 h-16 bg-white/40 backdrop-blur-xl border-b border-white/50 z-40 flex items-center justify-between px-6"
            style={{ boxShadow: '0 4px 16px rgba(31, 38, 135, 0.05)' }}
        >
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-lg">G</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-gray-800">Glassbox</span>
                </Link>

                <div className="hidden md:flex items-center gap-1 bg-white/30 rounded-lg p-1 border border-white/40">
                    <NavLink to="/" current={location.pathname === '/'}>Dashboard</NavLink>
                    <NavLink to="/activity" current={location.pathname === '/activity'}>Activity</NavLink>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search cases..."
                        className="bg-white/40 border border-white/50 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 placeholder:text-gray-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-xs text-gray-400 border border-white/40 rounded px-1.5 bg-white/30">
                        <Command className="w-3 h-3" />
                        <span>K</span>
                    </div>
                </div>

                <div className="w-px h-6 bg-white/50"></div>

                <button className="p-2 rounded-full hover:bg-white/40 transition-colors relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 border border-white shadow-inner"></div>
            </div>
        </motion.nav>
    );
};

const NavLink = ({ to, children, current }) => (
    <Link
        to={to}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${current ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'}`}
    >
        {children}
    </Link>
);

export default Navbar;
