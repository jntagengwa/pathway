import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayToggle } from './PathWayToggle';
import { PathWayBadge } from './PathWayBadge';
import { 
  Settings, 
  Camera, 
  Bell, 
  Shield, 
  Download, 
  Trash2, 
  User, 
  ChevronRight,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface Child {
  id: string;
  name: string;
  photoConsent: boolean;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  attendanceUpdates: boolean;
  eventReminders: boolean;
  positiveNotes: boolean;
  urgentAlerts: boolean;
}

interface FamilySettingsProps {
  children: Child[];
  notificationSettings: NotificationSettings;
  onBack?: () => void;
  onUpdatePhotoConsent: (childId: string, consent: boolean) => void;
  onUpdateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
  showBackButton?: boolean;
}

export function FamilySettings({
  children,
  notificationSettings,
  onBack,
  onUpdatePhotoConsent,
  onUpdateNotificationSettings,
  onExportData,
  onDeleteAccount,
  showBackButton = false
}: FamilySettingsProps) {
  const handleGDPRAction = (action: 'export' | 'delete') => {
    if (action === 'export') {
      onExportData();
    } else {
      const confirmMessage = 
        'Are you sure you want to delete your account? This action cannot be undone and will remove all your data permanently.';
      
      if (window.confirm(confirmMessage)) {
        onDeleteAccount();
      }
    }
  };

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
              aria-label="Go back to family dashboard"
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
              Family Settings
            </h2>
            
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.875rem',
              color: '#666666'
            }}>
              Manage your privacy and notification preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* Photo Consent Management */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-3 mb-4">
            <Camera className="w-5 h-5" style={{ color: '#76D7C4' }} />
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Photo Consent Settings
            </h3>
          </div>
          
          <div className="space-y-4">
            {children.map((child) => (
              <div key={child.id} className="p-4 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#76D7C4' }}
                    >
                      <User className="w-4 h-4" style={{ color: '#333333' }} />
                    </div>
                    <span style={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                      color: '#333333'
                    }}>
                      {child.name}
                    </span>
                  </div>
                  
                  <PathWayBadge 
                    status={child.photoConsent ? 'synced' : 'unsynced'}
                    showLabel={false}
                  />
                </div>
                
                <PathWayToggle
                  label="Photo consent for secure teacher identification"
                  description="Allow photos to be used for safety and identification by authorized staff only"
                  checked={child.photoConsent}
                  onChange={(consent) => onUpdatePhotoConsent(child.id, consent)}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#E8F5E8' }}>
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.75rem',
              color: '#666666',
              lineHeight: '1.4'
            }}>
              <strong>Privacy Commitment:</strong> Photos are stored securely, used exclusively for safety purposes, 
              and never shared externally. You can withdraw consent at any time.
            </p>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
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
              checked={notificationSettings.pushNotifications}
              onChange={(checked) => onUpdateNotificationSettings({ pushNotifications: checked })}
            />
            
            <PathWayToggle
              label="Email Notifications"
              description="Receive important updates via email"
              checked={notificationSettings.emailNotifications}
              onChange={(checked) => onUpdateNotificationSettings({ emailNotifications: checked })}
            />
            
            <div className="pl-4 space-y-3">
              <PathWayToggle
                label="Attendance Updates"
                description="Get notified when your child checks in or out"
                checked={notificationSettings.attendanceUpdates}
                onChange={(checked) => onUpdateNotificationSettings({ attendanceUpdates: checked })}
                disabled={!notificationSettings.pushNotifications}
              />
              
              <PathWayToggle
                label="Event Reminders"
                description="Reminders about upcoming events and activities"
                checked={notificationSettings.eventReminders}
                onChange={(checked) => onUpdateNotificationSettings({ eventReminders: checked })}
                disabled={!notificationSettings.pushNotifications}
              />
              
              <PathWayToggle
                label="Positive Notes"
                description="Get notified when teachers share positive feedback"
                checked={notificationSettings.positiveNotes}
                onChange={(checked) => onUpdateNotificationSettings({ positiveNotes: checked })}
                disabled={!notificationSettings.pushNotifications}
              />
              
              <PathWayToggle
                label="Urgent Alerts"
                description="Critical safety and emergency notifications"
                checked={notificationSettings.urgentAlerts}
                onChange={(checked) => onUpdateNotificationSettings({ urgentAlerts: checked })}
                disabled={!notificationSettings.pushNotifications}
              />
            </div>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Privacy & Data */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-5 h-5" style={{ color: '#FFD166' }} />
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Privacy & Data Rights
            </h3>
          </div>
          
          <p className="mb-6" style={{ 
            fontFamily: 'Quicksand, sans-serif',
            fontSize: '0.875rem',
            color: '#666666',
            lineHeight: '1.5'
          }}>
            Under GDPR, you have the right to access, export, or delete your personal data. 
            These actions help you maintain control over your information.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => handleGDPRAction('export')}
              className="w-full flex items-center justify-between p-4 rounded-lg transition-colors duration-200 hover:bg-gray-50"
              style={{ border: '1px solid #E0E0E0' }}
            >
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5" style={{ color: '#4DA9E5' }} />
                <div className="text-left">
                  <h4 style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    color: '#333333',
                    fontSize: '0.875rem'
                  }}>
                    Export My Data
                  </h4>
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.75rem',
                    color: '#666666'
                  }}>
                    Download a copy of all your family's data
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#999999' }} />
            </button>
            
            <button 
              onClick={() => handleGDPRAction('delete')}
              className="w-full flex items-center justify-between p-4 rounded-lg transition-colors duration-200 hover:bg-red-50"
              style={{ border: '1px solid #FFE5E5' }}
            >
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5" style={{ color: '#d4183d' }} />
                <div className="text-left">
                  <h4 style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    color: '#d4183d',
                    fontSize: '0.875rem'
                  }}>
                    Delete My Account
                  </h4>
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.75rem',
                    color: '#999999'
                  }}>
                    Permanently remove all your data
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#d4183d' }} />
            </button>
          </div>
          
          <div className="mt-4 p-3 rounded-lg flex items-start space-x-2" style={{ backgroundColor: '#FFF3CD' }}>
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#856404' }} />
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.75rem',
              color: '#856404',
              lineHeight: '1.4'
            }}>
              Account deletion is permanent and cannot be undone. Consider exporting your data first.
            </p>
          </div>
        </PathWayCard>
      </motion.div>

      {/* About & Support */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <PathWayCard>
          <h3 className="mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            About & Support
          </h3>
          
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
                Terms of Service
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
              PathWay v1.0.0 • Built with care for families
            </p>
          </div>
        </PathWayCard>
      </motion.div>
    </div>
  );
}