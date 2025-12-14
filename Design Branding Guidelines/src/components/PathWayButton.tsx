import React from 'react';
import { motion } from 'motion/react';

interface PathWayButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'white';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function PathWayButton({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  disabled = false,
  className = '',
  type = 'button',
  ...ariaProps
}: PathWayButtonProps) {
  // Check if children contains multiple elements (like icon + text)
  const childrenArray = React.Children.toArray(children);
  const hasMultipleChildren = childrenArray.length > 1;
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#76D7C4',
          color: '#333333',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: '#FFD166',
          color: '#333333',
          border: 'none',
        };
      case 'white':
        return {
          backgroundColor: '#FFFFFF',
          color: '#333333',
          border: '2px solid #76D7C4',
        };
      default:
        return {
          backgroundColor: '#76D7C4',
          color: '#333333',
          border: 'none',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 min-h-[48px] sm:min-h-[40px] md:min-h-[44px] min-w-[48px] sm:min-w-auto text-sm sm:text-sm md:text-base';
      case 'medium':
        return 'px-4 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 min-h-[52px] sm:min-h-[44px] md:min-h-[48px] min-w-[52px] sm:min-w-auto text-base sm:text-base md:text-lg';
      case 'large':
        return 'px-6 py-4 sm:px-8 sm:py-4 md:px-10 md:py-5 min-h-[56px] sm:min-h-[48px] md:min-h-[52px] min-w-[56px] sm:min-w-auto text-base sm:text-lg md:text-xl';
      default:
        return 'px-4 py-3 sm:px-6 sm:py-3 md:px-8 md:py-4 min-h-[52px] sm:min-h-[44px] md:min-h-[48px] min-w-[52px] sm:min-w-auto text-base sm:text-base md:text-lg';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`
        ${getSizeStyles()}
        rounded-2xl
        shadow-lg
        transition-all
        duration-300
        hover:shadow-xl
        active:shadow-md
        disabled:opacity-50
        disabled:cursor-not-allowed
        font-nunito
        font-bold
        ${hasMultipleChildren ? 'flex items-center justify-center gap-2' : ''}
        ${className}
      `}
      style={{
        ...getVariantStyles(),
        fontFamily: 'Nunito, sans-serif',
        fontWeight: 700,
        ...(disabled && { 
          backgroundColor: '#F5F5F5',
          color: '#999999',
          border: 'none'
        })
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}