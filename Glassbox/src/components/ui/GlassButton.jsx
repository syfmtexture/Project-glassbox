import React from 'react';
import { motion } from 'framer-motion';

const GlassButton = ({ children, className = '', variant = 'primary', onClick, disabled = false, type = 'button', ...props }) => {
    const variants = {
        primary: 'bg-white/50 border-white/70 text-gray-800',
        accent: 'bg-blue-500/10 border-blue-500/30 text-blue-600 font-semibold hover:bg-blue-500/20',
        danger: 'bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20',
        ghost: 'bg-transparent border-transparent hover:bg-white/30',
    };

    return (
        <motion.button
            type={type}
            className={`glass-button ${variants[variant] || variants.primary} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled}
            whileHover={disabled ? {} : { scale: 1.02, y: -2 }}
            whileTap={disabled ? {} : { scale: 0.96 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default GlassButton;
