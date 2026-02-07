import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen text-gray-800 font-sans antialiased overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-800">
            {/* Noise texture overlay */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50 mix-blend-overlay"></div>

            <Navbar />

            <main className="container mx-auto px-4 py-8 pt-24 max-w-7xl relative z-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;
