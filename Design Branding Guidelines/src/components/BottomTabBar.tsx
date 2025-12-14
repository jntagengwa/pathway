import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Home, Users, Heart, Settings, Bell } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

interface BottomTabBarProps {
  context?: 'family' | 'serve';
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export function BottomTabBar({ 
  context = 'family',
  activeTab,
  onTabChange,
  className = '' 
}: BottomTabBarProps) {
  const [currentTab, setCurrentTab] = useState(activeTab || 'home');

  const familyTabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { id: 'notices', label: 'Notices', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  const serveTabs: Tab[] = [
    { id: 'dashboard', label: 'Today', icon: <Home size={20} /> },
    { id: 'schedule', label: 'Schedule', icon: <Users size={20} /> },
    { id: 'pickups', label: 'Pickups', icon: <Bell size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  const tabs = context === 'family' ? familyTabs : serveTabs;

  const handleTabPress = (tabId: string) => {
    setCurrentTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div 
      className={`
        fixed
        bottom-0
        left-0
        right-0
        bg-white
        border-t
        px-2 sm:px-4 md:px-6
        py-2 sm:py-3 md:py-4
        shadow-lg
        ${className}
      `}
      style={{
        backgroundColor: '#FFFFFF',
        borderTopColor: context === 'family' ? '#FFD166' : '#4DA9E5',
        borderTopWidth: '3px',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -2px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex justify-around items-center max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              className={`
                flex
                flex-col
                items-center
                justify-center
                min-h-[48px] sm:min-h-[56px] md:min-h-[60px]
                min-w-[48px] sm:min-w-[56px] md:min-w-[64px]
                px-2 sm:px-4 md:px-5
                py-2 sm:py-3 md:py-4
                rounded-2xl
                transition-all
                duration-300
                relative
              `}
              style={{
                backgroundColor: isActive ? '#76D7C4' : 'transparent',
                color: isActive ? '#333333' : '#666666'
              }}
              onClick={() => handleTabPress(tab.id)}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: '#76D7C4' }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="mb-1">
                  <div className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center">
                    {React.cloneElement(tab.icon as React.ReactElement, { 
                      size: 24,
                      className: "w-full h-full"
                    })}
                  </div>
                </div>
                <span 
                  className="text-xs md:text-sm font-medium"
                  style={{
                    fontFamily: 'Quicksand, sans-serif',
                    fontWeight: 600
                  }}
                >
                  {tab.label}
                </span>
              </div>

              {tab.badge && (
                <div 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FFD166' }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#333333' }}
                  />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Context indicator */}
      <div className="flex justify-center mt-3 md:mt-4">
        <div 
          className="px-4 py-2 md:px-5 md:py-3 rounded-full text-sm md:text-base"
          style={{
            backgroundColor: context === 'family' ? '#FFD166' : '#4DA9E5',
            color: '#333333',
            fontFamily: 'Quicksand, sans-serif',
            fontWeight: 600
          }}
        >
          {context === 'family' ? 'Family Space' : 'Serve Space'}
        </div>
      </div>
    </div>
  );
}