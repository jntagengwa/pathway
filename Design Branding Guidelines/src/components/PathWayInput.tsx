import React from 'react';

interface PathWayInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number';
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function PathWayInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  className = '',
  error
}: PathWayInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          className="block"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 500,
            fontSize: '14px',
            color: '#333333'
          }}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={`
          w-full
          px-4
          py-3
          min-h-[44px]
          rounded-xl
          border
          border-gray-200
          transition-all
          duration-300
          focus:outline-none
          focus:ring-2
          focus:border-transparent
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${error ? 'border-red-300 ring-red-100' : 'focus:ring-blue-100'}
        `}
        style={{
          backgroundColor: disabled ? '#F5F5F5' : '#FFFFFF',
          fontFamily: 'Quicksand, sans-serif',
          fontWeight: 400,
          fontSize: '16px',
          color: '#333333',
          ...(error ? {
            borderColor: '#FF6B6B',
            backgroundColor: '#FFF5F5'
          } : {
            borderColor: 'rgba(51, 51, 51, 0.1)',
            focusRingColor: '#4DA9E5'
          })
        }}
      />
      {error && (
        <p 
          className="text-sm"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 400,
            color: '#FF6B6B'
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}