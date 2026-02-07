import React from 'react';
import { motion } from 'framer-motion';

const GlassButton = ({ children, className = '', variant = 'primary', onClick, ...props }) => {
    const variants = {
        primary: 'bg-white/50 border-white/70 text-glass-text',
        accent: 'bg-accent-blue/10 border-accent-blue/30 text-accent-blue font-semibold hover:bg-accent-blue/20',
        danger: 'bg-priority-critical/10 border-priority-critical/30 text-priority-critical hover:bg-priority-critical/20',
        ghost: 'bg-transparent border-transparent hover:bg-white/30',
    };

    return (
        <motion.button
            className={`glass-button ${variants[variant]} ${className}`}
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.96 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default GlassButton;
