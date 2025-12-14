import React from 'react';
import { motion } from 'motion/react';

interface PathWayCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function PathWayCard({ 
  children, 
  className = '',
  hoverable = false,
  onClick 
}: PathWayCardProps) {
  const MotionDiv = motion.div;

  return (
    <MotionDiv
      whileHover={hoverable ? { y: -4, scale: 1.02 } : undefined}
      whileTap={hoverable ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`
        bg-white
        rounded-xl sm:rounded-2xl
        shadow-lg
        hover:shadow-xl
        transition-all
        duration-300
        p-4 sm:p-6 md:p-8
        ${hoverable ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(51, 51, 51, 0.05)'
      }}
      onClick={onClick}
    >
      {children}
    </MotionDiv>
  );
}