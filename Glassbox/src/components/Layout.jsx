import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-liquid-gradient text-glass-text font-sans antialiased overflow-x-hidden selection:bg-accent-blue/30 selection:text-accent-blue-dark">
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-50 mix-blend-overlay"></div>

            <Navbar />

            <main className="container mx-auto px-4 py-8 pt-24 max-w-7xl relative z-10">
                {children}
            </main>
        </div>
    );
};

export default Layout;
