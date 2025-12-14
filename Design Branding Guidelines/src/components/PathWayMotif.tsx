import React from 'react';
import { motion } from 'motion/react';

interface PathWayMotifProps {
  variant?: 'stepping-stones' | 'curved-path';
  context?: 'family' | 'serve';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  animated?: boolean;
}

export function PathWayMotif({ 
  variant = 'stepping-stones',
  context = 'family',
  size = 'medium',
  className = '',
  animated = true
}: PathWayMotifProps) {
  const contextColors = {
    family: {
      primary: '#76D7C4', // mint
      accent: '#FFD166'   // yellow
    },
    serve: {
      primary: '#76D7C4', // mint  
      accent: '#4DA9E5'   // blue
    }
  };

  const sizes = {
    small: { width: 120, height: 60 },
    medium: { width: 200, height: 100 },
    large: { width: 300, height: 150 }
  };

  const colors = contextColors[context];
  const { width, height } = sizes[size];

  if (variant === 'curved-path') {
    return (
      <div className={`flex justify-center ${className}`}>
        <svg 
          width={width} 
          height={height/2} 
          viewBox={`0 0 ${width} ${height/2}`} 
          className="opacity-30"
        >
          <motion.path
            d={`M 10 ${height/4} Q ${width/2} 5 ${width-10} ${height/4}`}
            stroke={colors.primary}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: animated ? 1 : 1, 
              opacity: animated ? 0.6 : 0.3 
            }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d={`M 20 ${height/3} Q ${width/2} ${height/6} ${width-20} ${height/3}`}
            stroke={colors.accent}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: animated ? 1 : 1, 
              opacity: animated ? 0.4 : 0.2 
            }}
            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          />
        </svg>
      </div>
    );
  }

  // Stepping stones variant
  const stoneCount = size === 'small' ? 3 : size === 'medium' ? 4 : 5;
  const stones = Array.from({ length: stoneCount }, (_, i) => i);

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className="flex items-center justify-center space-x-3"
        style={{ width, height: height/2 }}
      >
        {stones.map((index) => (
          <motion.div
            key={index}
            className="rounded-full shadow-sm"
            style={{
              width: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
              height: size === 'small' ? 16 : size === 'medium' ? 20 : 24,
              backgroundColor: index % 2 === 0 ? colors.primary : colors.accent,
              opacity: 0.4
            }}
            initial={{ 
              scale: 0, 
              opacity: 0,
              y: index % 2 === 0 ? -5 : 5 
            }}
            animate={{ 
              scale: 1, 
              opacity: animated ? 0.6 : 0.4,
              y: 0 
            }}
            transition={{ 
              duration: 0.6, 
              delay: animated ? index * 0.2 : 0,
              type: "spring",
              bounce: 0.4
            }}
          />
        ))}
      </div>
    </div>
  );
}