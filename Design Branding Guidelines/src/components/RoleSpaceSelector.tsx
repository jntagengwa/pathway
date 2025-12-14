import { motion } from 'motion/react';
import pathwayLogo from 'figma:asset/ed0d7c9c9507ef7eeb63f93b164e16b201ba64a9.png';
import { PathWayButton } from './PathWayButton';
import { PathWayCard } from './PathWayCard';
import { PathWayMotif } from './PathWayMotif';
import { Users, Heart, UserPlus, Settings } from 'lucide-react';

interface RoleSpaceSelectorProps {
  hasChildRegistered: boolean;
  isVolunteer: boolean;
  onSelectSpace: (space: 'family' | 'serve') => void;
  onRegisterChild: () => void;
  onBecomeVolunteer: () => void;
  onSettings: () => void;
}

export function RoleSpaceSelector({
  hasChildRegistered,
  isVolunteer,
  onSelectSpace,
  onRegisterChild,
  onBecomeVolunteer,
  onSettings
}: RoleSpaceSelectorProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="p-6" style={{ backgroundColor: '#76D7C4' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={pathwayLogo} alt="PathWay" className="w-10 h-10" />
            <h1 style={{ 
              fontFamily: 'Nunito, sans-serif', 
              fontWeight: 700,
              fontSize: '1.5rem',
              color: '#333333'
            }}>
              PathWay
            </h1>
          </div>
          
          <button
            onClick={onSettings}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white hover:bg-opacity-20"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <Settings className="w-6 h-6" style={{ color: '#333333' }} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-md mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <PathWayMotif 
            variant="stepping-stones"
            context="family"
            size="medium"
            animated
          />
          
          <h2 className="mt-6 mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '1.75rem',
            color: '#333333'
          }}>
            Welcome to PathWay
          </h2>
          
          <p style={{ 
            fontFamily: 'Quicksand, sans-serif',
            color: '#666666',
            fontSize: '1rem'
          }}>
            Choose your space to get started
          </p>
        </motion.div>

        {/* Space Selection Cards */}
        <div className="space-y-4">
          {/* Family Space */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <PathWayCard 
              hoverable={hasChildRegistered}
              className={`relative overflow-hidden ${!hasChildRegistered ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center space-x-4 p-2">
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: hasChildRegistered ? '#FFD166' : '#E0E0E0'
                  }}
                >
                  <Users 
                    className="w-8 h-8" 
                    style={{ 
                      color: hasChildRegistered ? '#333333' : '#999999'
                    }} 
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1" style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: hasChildRegistered ? '#333333' : '#999999'
                  }}>
                    Family Space
                  </h3>
                  
                  <p className="mb-3" style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: hasChildRegistered ? '#666666' : '#999999'
                  }}>
                    Connect with your child's journey
                  </p>
                  
                  {hasChildRegistered ? (
                    <PathWayButton 
                      variant="primary"
                      onClick={() => onSelectSpace('family')}
                      style={{ 
                        backgroundColor: '#FFD166',
                        minHeight: '44px'
                      }}
                    >
                      Enter Family Space
                    </PathWayButton>
                  ) : (
                    <div className="space-y-2">
                      <p style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        color: '#999999'
                      }}>
                        Add a child to get started
                      </p>
                      <PathWayButton 
                        variant="secondary"
                        onClick={onRegisterChild}
                        disabled={false}
                        style={{ 
                          minHeight: '44px',
                          opacity: 0.8
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Register Child
                      </PathWayButton>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Background Motif */}
              {hasChildRegistered && (
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                  <PathWayMotif 
                    variant="stepping-stones"
                    context="family"
                    size="small"
                  />
                </div>
              )}
            </PathWayCard>
          </motion.div>

          {/* Serve Space */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <PathWayCard 
              hoverable={isVolunteer}
              className={`relative overflow-hidden ${!isVolunteer ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center space-x-4 p-2">
                {/* Icon */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ 
                    backgroundColor: isVolunteer ? '#4DA9E5' : '#E0E0E0'
                  }}
                >
                  <Heart 
                    className="w-8 h-8" 
                    style={{ 
                      color: isVolunteer ? '#FFFFFF' : '#999999'
                    }} 
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1" style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: isVolunteer ? '#333333' : '#999999'
                  }}>
                    Serve Space
                  </h3>
                  
                  <p className="mb-3" style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: isVolunteer ? '#666666' : '#999999'
                  }}>
                    Make a difference in your community
                  </p>
                  
                  {isVolunteer ? (
                    <PathWayButton 
                      variant="primary"
                      onClick={() => onSelectSpace('serve')}
                      style={{ 
                        backgroundColor: '#4DA9E5',
                        color: '#FFFFFF',
                        minHeight: '44px'
                      }}
                    >
                      Enter Serve Space
                    </PathWayButton>
                  ) : (
                    <div className="space-y-2">
                      <button 
                        onClick={onBecomeVolunteer}
                        className="transition-colors duration-200 hover:underline"
                        style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          color: '#4DA9E5',
                          backgroundColor: 'transparent',
                          border: 'none',
                          padding: '0',
                          minHeight: '20px'
                        }}
                      >
                        Do you want to volunteer?
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Background Motif */}
              {isVolunteer && (
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                  <PathWayMotif 
                    variant="curved-path"
                    context="serve"
                    size="small"
                  />
                </div>
              )}
            </PathWayCard>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-8 text-center"
        >
          <p style={{ 
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.875rem',
            color: '#999999',
            lineHeight: '1.5'
          }}>
            You can switch between spaces anytime from your profile settings
          </p>
        </motion.div>
      </div>
    </div>
  );
}