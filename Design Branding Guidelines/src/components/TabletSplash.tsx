import React from 'react';
import { motion } from 'motion/react';
import { PathWayButton } from './PathWayButton';
import { PathWayMotif } from './PathWayMotif';
import { useIsTablet } from './MobileFirst';

interface TabletSplashProps {
  pathwayLogo: string;
  onGetStarted: () => void;
  onUIDemo: () => void;
  onQRScan: () => void;
}

export function TabletSplash({ 
  pathwayLogo, 
  onGetStarted, 
  onUIDemo, 
  onQRScan 
}: TabletSplashProps) {
  const isTablet = useIsTablet();
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-8 md:px-12" style={{ backgroundColor: '#B8E6D9' }}>
      <div className={`
        text-center w-full mx-auto
        ${isTablet ? 'max-w-lg' : 'max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl'}
      `}>
        {/* Logo with animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            type: "spring", 
            bounce: 0.3 
          }}
          className={`mb-8 ${isTablet ? 'mb-10' : ''}`}
        >
          <div className="relative group cursor-pointer">
            <img 
              src={pathwayLogo} 
              alt="PathWay Logo" 
              className={`
                mx-auto transition-all duration-300 group-hover:scale-105
                ${isTablet 
                  ? 'w-40 h-40' 
                  : 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48'
                }
              `}
              style={{ 
                filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.1))',
                backgroundColor: 'transparent'
              }}
            />
            {/* Hover shadow below logo */}
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 w-24 h-4 rounded-full opacity-0 group-hover:opacity-30 transition-all duration-300"
              style={{ 
                backgroundColor: '#333333',
                bottom: '-8px',
                filter: 'blur(8px)'
              }}
            />
          </div>
        </motion.div>

        {/* App Name */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className={`mb-6 ${isTablet ? 'mb-8' : ''}`}
        >
          <h1 className={`
            mb-2 font-bold text-[#333333]
            ${isTablet 
              ? 'text-6xl' 
              : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl'
            }
          `} style={{ 
            fontFamily: 'Nunito, sans-serif',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            PathWay
          </h1>
          <p className={`
            text-[#333333] opacity-80
            ${isTablet 
              ? 'text-xl mb-8' 
              : 'mb-6 sm:mb-8 md:mb-10 text-base sm:text-lg md:text-xl lg:text-2xl'
            }
          `} style={{ 
            fontFamily: 'Quicksand, sans-serif'
          }}>
            Every step together
          </p>
        </motion.div>

        {/* PathWay Motif */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className={`mb-6 ${isTablet ? 'mb-10' : 'sm:mb-8 md:mb-10'}`}
        >
          <PathWayMotif 
            variant="stepping-stones"
            context="family"
            size={isTablet ? "large" : "medium"}
            animated
          />
        </motion.div>

        {/* Get Started Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="space-y-4"
        >
          <PathWayButton 
            variant="primary"
            size="large"
            onClick={onGetStarted}
            className={`
              ${isTablet 
                ? 'min-w-[240px]' 
                : 'w-full sm:w-auto md:min-w-[200px]'
              }
            `}
          >
            Get Started
          </PathWayButton>
          
          <div className={`
            flex space-y-3 sm:space-y-0 sm:space-x-4 sm:justify-center
            ${isTablet 
              ? 'flex-row space-y-0 space-x-6 justify-center' 
              : 'flex-col sm:flex-row md:space-x-6'
            }
          `}>
            <PathWayButton 
              variant="white"
              onClick={onUIDemo}
              className={`
                ${isTablet 
                  ? 'min-w-[140px]' 
                  : 'w-full sm:w-auto md:min-w-[140px]'
                }
              `}
            >
              UI Demo
            </PathWayButton>
            
            <PathWayButton 
              variant="white"
              onClick={onQRScan}
              className={`
                ${isTablet 
                  ? 'min-w-[140px]' 
                  : 'w-full sm:w-auto md:min-w-[140px]'
                }
              `}
            >
              QR Scan
            </PathWayButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}