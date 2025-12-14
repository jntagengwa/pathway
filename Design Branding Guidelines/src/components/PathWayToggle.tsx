import React, { useState } from 'react';
import { motion } from 'motion/react';

interface PathWayToggleProps {
  label?: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function PathWayToggle({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  className = ''
}: PathWayToggleProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    if (disabled) return;
    const newValue = !isChecked;
    setIsChecked(newValue);
    onChange?.(newValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {label && (
            <label 
              className="block cursor-pointer"
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                color: disabled ? '#999999' : '#333333'
              }}
              onClick={handleToggle}
            >
              {label}
            </label>
          )}
          {description && (
            <p 
              className="mt-1"
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: 400,
                fontSize: '14px',
                color: disabled ? '#CCCCCC' : '#666666'
              }}
            >
              {description}
            </p>
          )}
        </div>
        
        {/* Toggle Switch */}
        <button
          type="button"
          className="relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            padding: '8px', // Extra padding for 44px touch target
          }}
          onClick={handleToggle}
          disabled={disabled}
        >
          <div
            className={`
              relative
              inline-flex
              h-6
              w-11
              items-center
              rounded-full
              transition-colors
              duration-300
              ease-in-out
            `}
            style={{
              backgroundColor: isChecked ? '#76D7C4' : '#D1D5DB'
            }}
          >
            <motion.div
              animate={{
                x: isChecked ? 22 : 2,
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
              className={`
                inline-block
                h-5
                w-5
                rounded-full
                bg-white
                shadow-lg
                ring-0
                transition
                ease-in-out
                duration-300
              `}
              style={{
                boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.2)'
              }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}