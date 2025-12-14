import React from 'react';
import { PathWayMotif } from './PathWayMotif';
import { usePathWayTheme } from './PathWayTheme';
import { PathWayButton } from './PathWayButton';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  variant?: 'stepping-stones' | 'curved-path';
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  variant = 'stepping-stones',
  className = ''
}: EmptyStateProps) {
  const theme = usePathWayTheme();

  return (
    <div className={`text-center py-16 px-6 ${className}`}>
      {/* Visual Motif */}
      <div className="mb-8">
        <PathWayMotif 
          variant={variant}
          context={theme.context}
          size="large"
          animated
        />
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto space-y-4">
        <h3 
          className="mb-3"
          style={{
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '1.5rem',
            color: theme.colors.text
          }}
        >
          {title}
        </h3>
        
        <p 
          className="mb-6"
          style={{
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 400,
            fontSize: '1rem',
            color: theme.colors.text,
            opacity: 0.7
          }}
        >
          {description}
        </p>

        {actionText && onAction && (
          <PathWayButton 
            variant="primary" 
            onClick={onAction}
            style={{ backgroundColor: theme.colors.accent }}
          >
            {actionText}
          </PathWayButton>
        )}
      </div>

      {/* Context indicator */}
      <div className="mt-8 flex justify-center">
        <div 
          className="px-4 py-2 rounded-full text-sm"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.text,
            opacity: 0.8,
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 500
          }}
        >
          {theme.context === 'family' ? 'Family Space' : 'Serve Space'}
        </div>
      </div>
    </div>
  );
}