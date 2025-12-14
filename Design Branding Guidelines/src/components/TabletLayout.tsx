import React from 'react';
import { useIsTablet } from './MobileFirst';

interface TabletLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function TabletLayout({ children, className = '' }: TabletLayoutProps) {
  const isTablet = useIsTablet();
  
  return (
    <div className={`
      ${isTablet ? 'tablet-optimized' : ''}
      ${className}
    `}>
      {children}
      
      <style jsx>{`
        .tablet-optimized {
          --tablet-spacing: 1.5rem;
          --tablet-border-radius: 1rem;
          --tablet-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
        
        .tablet-optimized .pathway-button {
          min-width: 140px;
          padding: 0.75rem 1.5rem;
        }
        
        .tablet-optimized .pathway-card {
          padding: 2rem;
          border-radius: var(--tablet-border-radius);
          box-shadow: var(--tablet-shadow);
        }
        
        .tablet-optimized .button-group {
          gap: var(--tablet-spacing);
          justify-content: center;
        }
        
        .tablet-optimized h2 {
          margin-bottom: 2rem;
        }
        
        .tablet-optimized .grid {
          gap: var(--tablet-spacing);
        }
      `}</style>
    </div>
  );
}

interface TabletButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function TabletButtonGroup({ children, className = '' }: TabletButtonGroupProps) {
  return (
    <div className={`
      flex flex-col sm:flex-row 
      space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6 
      sm:justify-center md:justify-center
      ${className}
    `}>
      {children}
    </div>
  );
}

interface TabletGridProps {
  children: React.ReactNode;
  cols?: {
    mobile: number;
    tablet: number;
    desktop?: number;
  };
  className?: string;
}

export function TabletGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  className = '' 
}: TabletGridProps) {
  return (
    <div className={`
      grid 
      grid-cols-${cols.mobile} 
      sm:grid-cols-${cols.tablet} 
      ${cols.desktop ? `lg:grid-cols-${cols.desktop}` : ''}
      gap-4 sm:gap-6 md:gap-8
      ${className}
    `}>
      {children}
    </div>
  );
}