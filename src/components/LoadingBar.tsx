import React from 'react';
import { motion } from 'framer-motion';

interface LoadingBarProps {
  isVisible: boolean;
}

export const LoadingBar: React.FC<LoadingBarProps> = ({ isVisible }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
    >
      <motion.div
        initial={{ scaleX: 0, transformOrigin: "0%" }}
        animate={isVisible ? {
          scaleX: [0, 0.5, 0.8, 0.9, 1],
          transition: {
            duration: 1.5,
            ease: "easeInOut",
            times: [0, 0.4, 0.7, 0.9, 1]
          }
        } : {
          scaleX: 0,
          transition: { duration: 0.3 }
        }}
        className="h-full w-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 animate-shimmer"
      />
    </motion.div>
  );
};