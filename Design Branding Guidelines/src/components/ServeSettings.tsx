import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayToggle } from './PathWayToggle';
import { 
  ArrowLeft, 
  Bell, 
  Calendar, 
  Shield, 
  ChevronRight,
  UserCheck,
  Settings
} from 'lucide-react';

interface VolunteerSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  scheduleReminders: boolean;
  pickupAlerts: boolean;
  sessionUpdates: boolean;
  lastMinuteChanges: boolean;
  availability: 'always' | 'weekends' | 'specific';
  autoAcceptSimilar: boolean;
}

interface ServeSettingsProps {
  settings: VolunteerSettings;
  onBack?: () => void;
  onUpdateSettings: (settings: Partial<VolunteerSettings>) => void;
  showBackButton?: boolean;
}

export function ServeSettings({
  settings,
  onBack,
  onUpdateSettings,
  showBackButton = false
}: ServeSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-4 mb-6">
          {showBackButton && onBack && (
            <PathWayButton
              variant="white"
              onClick={onBack}
              className="px-4 h-12 flex items-center justify-center flex-shrink-0 gap-2"
              aria-label="Go back to serve dashboard"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19 12H5" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m12 19-7-7 7-7" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                color: '#333333',
                fontSize: '0.875rem'
              }}>
                Back
              </span>
            </PathWayButton>
          )}
          
          <div>
            <h2 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Volunteer Settings
            </h2>
            
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.875rem',
              color: '#666666'
            }}>
              Manage your volunteering preferences and notifications
            </p>
          </div>
        </div>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-5 h-5" style={{ color: '#4DA9E5' }} />
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Notification Preferences
            </h3>
          </div>
          
          <div className="space-y-4">
            <PathWayToggle
              label="Push Notifications"
              description="Receive notifications on your device"
              checked={settings.pushNotifications}
              onChange={(checked) => onUpdateSettings({ pushNotifications: checked })}
            />
            
            <PathWayToggle
              label="Email Notifications"
              description="Receive important updates via email"
              checked={settings.emailNotifications}
              onChange={(checked) => onUpdateSettings({ emailNotifications: checked })}
            />
            
            <div className="pl-4 space-y-3">
              <PathWayToggle
                label="Schedule Reminders"
                description="Get reminders about upcoming sessions"
                checked={settings.scheduleReminders}
                onChange={(checked) => onUpdateSettings({ scheduleReminders: checked })}
                disabled={!settings.pushNotifications}
              />
              
              <PathWayToggle
                label="Pickup Alerts"
                description="Urgent notifications about child pickups"
                checked={settings.pickupAlerts}
                onChange={(checked) => onUpdateSettings({ pickupAlerts: checked })}
                disabled={!settings.pushNotifications}
              />
              
              <PathWayToggle
                label="Session Updates"
                description="Changes to room assignments, team members, etc."
                checked={settings.sessionUpdates}
                onChange={(checked) => onUpdateSettings({ sessionUpdates: checked })}
                disabled={!settings.pushNotifications}
              />
              
              <PathWayToggle
                label="Last-Minute Changes"
                description="Emergency updates and schedule changes"
                checked={settings.lastMinuteChanges}
                onChange={(checked) => onUpdateSettings({ lastMinuteChanges: checked })}
                disabled={!settings.pushNotifications}
              />
            </div>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Availability Settings */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5" style={{ color: '#76D7C4' }} />
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Availability Preferences
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontWeight: 500,
                color: '#333333',
                marginBottom: '8px',
                display: 'block'
              }}>
                Default Availability
              </label>
              
              <div className="flex space-x-2">
                {(['always', 'weekends', 'specific'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => onUpdateSettings({ availability: option })}
                    className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                      settings.availability === option ? 'font-semibold' : ''
                    }`}
                    style={{ 
                      backgroundColor: settings.availability === option ? '#4DA9E5' : '#F5F5F5',
                      color: settings.availability === option ? '#FFFFFF' : '#333333',
                      border: 'none',
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem'
                    }}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            <PathWayToggle
              label="Auto-accept similar sessions"
              description="Automatically accept sessions similar to ones you've volunteered for before"
              checked={settings.autoAcceptSimilar}
              onChange={(checked) => onUpdateSettings({ autoAcceptSimilar: checked })}
            />
          </div>
        </PathWayCard>
      </motion.div>

      {/* Volunteer Profile */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck className="w-5 h-5" style={{ color: '#FFD166' }} />
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Volunteer Profile
            </h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Skills & Interests
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Age Group Preferences
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Background Check Status
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Emergency Contact
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Privacy & Support */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5" style={{ color: '#999999' }} />
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Privacy & Support
            </h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Privacy Policy
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Volunteer Handbook
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Report an Issue
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-50">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Contact Support
              </span>
              <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.75rem',
              color: '#999999'
            }}>
              PathWay v1.0.0 • Thank you for serving!
            </p>
          </div>
        </PathWayCard>
      </motion.div>
    </div>
  );
}