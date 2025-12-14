import { useState, useEffect } from 'react';

// Mobile-first breakpoints with tablet optimization
export const breakpoints = {
  sm: 640,   // Large phones
  md: 768,   // Tablets
  lg: 1024,  // Small laptops
  xl: 1280,  // Large screens
} as const;

// Tablet-specific breakpoint helpers
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
};

// Hook to detect screen size
export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<keyof typeof breakpoints | 'xs'>('xs');

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width >= breakpoints.xl) setScreenSize('xl');
      else if (width >= breakpoints.lg) setScreenSize('lg');
      else if (width >= breakpoints.md) setScreenSize('md');
      else if (width >= breakpoints.sm) setScreenSize('sm');
      else setScreenSize('xs');
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  return screenSize;
}

// Hook to detect if device is mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md);
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  return isMobile;
}

// Hook to detect if device is tablet
export function useIsTablet() {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateIsTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= breakpoints.md && width < breakpoints.lg);
    };

    updateIsTablet();
    window.addEventListener('resize', updateIsTablet);
    return () => window.removeEventListener('resize', updateIsTablet);
  }, []);

  return isTablet;
}

// Mobile-first container component
interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function MobileContainer({ children, className = '', maxWidth = 'lg' }: MobileContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <div className={`
      w-full mx-auto px-4 sm:px-6 md:px-8 
      ${maxWidthClasses[maxWidth]} 
      ${className}
    `}>
      {children}
    </div>
  );
}

// Mobile-first grid component
interface MobileGridProps {
  children: React.ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MobileGrid({ 
  children, 
  cols = { default: 1, sm: 2, md: 3 },
  gap = 'md',
  className = '' 
}: MobileGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  const gridClasses = [
    `grid grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    gapClasses[gap]
  ].filter(Boolean).join(' ');

  return (
    <div className={`${gridClasses} ${className}`}>
      {children}
    </div>
  );
}

// Mobile-first spacing utilities with tablet optimization
export const mobileSpacing = {
  section: 'space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12',
  card: 'space-y-4 sm:space-y-5 md:space-y-6',
  list: 'space-y-3 sm:space-y-4 md:space-y-4',
  form: 'space-y-4 sm:space-y-5 md:space-y-6',
  buttons: 'space-y-3 sm:space-y-0 sm:space-x-4 sm:flex md:justify-center',
  padding: {
    container: 'p-4 sm:p-6 md:p-8 lg:p-10',
    card: 'p-4 sm:p-5 md:p-6 lg:p-8',
    section: 'py-6 sm:py-8 md:py-10 lg:py-12',
    small: 'p-3 sm:p-4 md:p-5'
  }
} as const;

// Mobile-first typography utilities with tablet optimization
export const mobileTypography = {
  display: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold',
  heading: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold',
  subheading: 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold',
  body: 'text-sm sm:text-base md:text-lg',
  small: 'text-xs sm:text-sm md:text-base',
  xs: 'text-xs sm:text-xs md:text-sm'
} as const;

// Tablet-optimized button component
interface TabletButtonProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: boolean;
}

export function TabletOptimizedButton({ children, className = '', maxWidth = true }: TabletButtonProps) {
  return (
    <div className={`
      ${maxWidth ? 'w-full sm:w-auto md:max-w-xs lg:max-w-none' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}