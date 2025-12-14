import React from 'react';
import { motion } from 'motion/react';

interface PathWayBadgeProps {
  status: 'offline' | 'unsynced' | 'synced' | 'online';
  size?: 'small' | 'medium';
  showLabel?: boolean;
  className?: string;
}

export function PathWayBadge({ 
  status, 
  size = 'medium',
  showLabel = false,
  className = '' 
}: PathWayBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'offline':
        return {
          color: '#FF6B6B',
          label: 'Offline',
          icon: '○'
        };
      case 'unsynced':
        return {
          color: '#FFD166',
          label: 'Unsynced',
          icon: '⟲'
        };
      case 'synced':
        return {
          color: '#76D7C4',
          label: 'Synced',
          icon: '✓'
        };
      case 'online':
        return {
          color: '#4DA9E5',
          label: 'Online',
          icon: '●'
        };
      default:
        return {
          color: '#F5F5F5',
          label: 'Unknown',
          icon: '?'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClass = size === 'small' ? 'w-3 h-3' : 'w-4 h-4';
  const iconSize = size === 'small' ? '8px' : '10px';

  if (showLabel) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`flex items-center space-x-2 ${className}`}
      >
        <div
          className={`${sizeClass} rounded-full flex items-center justify-center`}
          style={{ 
            backgroundColor: config.color,
            fontSize: iconSize,
            color: '#FFFFFF'
          }}
        >
          {config.icon}
        </div>
        {showLabel && (
          <span 
            className="text-sm"
            style={{
              fontFamily: 'Quicksand, sans-serif',
              fontWeight: 500,
              color: '#333333'
            }}
          >
            {config.label}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.2 }}
      className={`${sizeClass} rounded-full flex items-center justify-center ${className}`}
      style={{ 
        backgroundColor: config.color,
        fontSize: iconSize,
        color: '#FFFFFF'
      }}
    >
      {config.icon}
    </motion.div>
  );
}