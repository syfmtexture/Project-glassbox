import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ children, className = '', onClick, hoverEffect = false, ...props }) => {
    return (
        <motion.div
            className={`glass-panel p-6 ${hoverEffect ? 'hover:bg-white/55 transition-colors duration-300 cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
