import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayBadge } from './PathWayBadge';
import { 
  ArrowLeft, 
  Bell, 
  Clock, 
  User, 
  CheckCircle, 
  AlertTriangle,
  Phone,
  MessageCircle
} from 'lucide-react';

interface PickupNotification {
  id: string;
  childId: string;
  childName: string;
  childPhoto?: string;
  parentName: string;
  parentPhone?: string;
  pickupTime: string;
  actualTime?: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'overdue';
  urgencyLevel: 'normal' | 'urgent' | 'emergency';
  sessionName: string;
  room: string;
  notes?: string;
  hasPhotoConsent: boolean;
}

interface PickupNotificationsProps {
  notifications: PickupNotification[];
  onBack?: () => void;
  onCompletePickup: (notificationId: string) => void;
  onStartPickup: (notificationId: string) => void;
  onCallParent: (parentPhone: string) => void;
  onSendMessage: (notificationId: string) => void;
  showBackButton?: boolean;
}

export function PickupNotifications({
  notifications,
  onBack,
  onCompletePickup,
  onStartPickup,
  onCallParent,
  onSendMessage,
  showBackButton = false
}: PickupNotificationsProps) {
  const sortedNotifications = [...notifications].sort((a, b) => {
    // Sort by urgency first, then by pickup time
    const urgencyOrder = { 'emergency': 0, 'urgent': 1, 'normal': 2 };
    const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    
    if (urgencyDiff !== 0) return urgencyDiff;
    
    return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
  });

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'emergency':
        return '#d4183d';
      case 'urgent':
        return '#FFD166';
      case 'normal':
        return '#76D7C4';
      default:
        return '#999999';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#76D7C4';
      case 'in-progress':
        return '#4DA9E5';
      case 'overdue':
        return '#d4183d';
      case 'waiting':
        return '#FFD166';
      default:
        return '#999999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" style={{ color: '#76D7C4' }} />;
      case 'in-progress':
        return <Clock className="w-5 h-5" style={{ color: '#4DA9E5' }} />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5" style={{ color: '#d4183d' }} />;
      case 'waiting':
        return <Bell className="w-5 h-5" style={{ color: '#FFD166' }} />;
      default:
        return <Bell className="w-5 h-5" style={{ color: '#999999' }} />;
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeStatus = (pickupTime: string, actualTime?: string) => {
    const pickup = new Date(pickupTime);
    const now = new Date();
    const actual = actualTime ? new Date(actualTime) : null;

    if (actual) {
      const diffMinutes = (actual.getTime() - pickup.getTime()) / (1000 * 60);
      if (diffMinutes > 15) return 'Late pickup';
      if (diffMinutes < -5) return 'Early pickup';
      return 'On time';
    }

    const diffMinutes = (now.getTime() - pickup.getTime()) / (1000 * 60);
    if (diffMinutes > 15) return 'Overdue';
    if (diffMinutes > 0) return 'Due now';
    return `Due in ${Math.abs(Math.round(diffMinutes))} min`;
  };

  const activeNotifications = notifications.filter(n => n.status !== 'completed');
  const completedNotifications = notifications.filter(n => n.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
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
                Pickup Notifications
              </h2>
              
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#666666'
              }}>
                {activeNotifications.length} active • {completedNotifications.length} completed today
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <PathWayBadge 
              status={notifications.some(n => n.urgencyLevel === 'emergency') ? 'unsynced' : 
                     notifications.some(n => n.status === 'overdue') ? 'offline' : 'online'}
              showLabel={false}
            />
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PathWayCard>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#FFD166' }}>
                {notifications.filter(n => n.status === 'waiting').length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                Waiting
              </p>
            </div>
          </PathWayCard>
          
          <PathWayCard>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#4DA9E5' }}>
                {notifications.filter(n => n.status === 'in-progress').length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                In Progress
              </p>
            </div>
          </PathWayCard>
          
          <PathWayCard>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#d4183d' }}>
                {notifications.filter(n => n.status === 'overdue').length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                Overdue
              </p>
            </div>
          </PathWayCard>
          
          <PathWayCard>
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#76D7C4' }}>
                {notifications.filter(n => n.status === 'completed').length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                Completed
              </p>
            </div>
          </PathWayCard>
        </div>
      </motion.div>

      {/* Active Notifications */}
      {activeNotifications.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h3 className="mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Active Pickups
          </h3>
          
          <div className="space-y-3">
            {sortedNotifications.filter(n => n.status !== 'completed').map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
              >
                <PathWayCard className={`${notification.urgencyLevel === 'emergency' ? 'ring-2 ring-red-200' : ''}`}>
                  <div className="flex items-start space-x-4">
                    {/* Child Photo */}
                    <div className="flex-shrink-0">
                      {notification.childPhoto && notification.hasPhotoConsent ? (
                        <img 
                          src={notification.childPhoto} 
                          alt={`${notification.childName}'s photo`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: '#F5F5F5' }}
                        >
                          <User className="w-8 h-8" style={{ color: '#999999' }} />
                        </div>
                      )}
                    </div>

                    {/* Notification Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 700,
                          fontSize: '1.125rem',
                          color: '#333333'
                        }}>
                          {notification.childName}
                        </h4>
                        
                        <div className="flex items-center space-x-2">
                          {notification.urgencyLevel !== 'normal' && (
                            <span 
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: getUrgencyColor(notification.urgencyLevel),
                                color: '#FFFFFF',
                                fontFamily: 'Quicksand, sans-serif',
                                fontWeight: 600
                              }}
                            >
                              {notification.urgencyLevel.toUpperCase()}
                            </span>
                          )}
                          
                          {getStatusIcon(notification.status)}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 600,
                          color: '#333333',
                          marginBottom: '4px'
                        }}>
                          Parent: {notification.parentName}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            color: '#666666'
                          }}>
                            {notification.sessionName} • {notification.room}
                          </span>
                          
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            color: getStatusColor(notification.status),
                            fontWeight: 600
                          }}>
                            {getTimeStatus(notification.pickupTime, notification.actualTime)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.875rem',
                          color: '#666666'
                        }}>
                          Scheduled: {formatTime(notification.pickupTime)}
                          {notification.actualTime && (
                            <span> • Actual: {formatTime(notification.actualTime)}</span>
                          )}
                        </div>
                      </div>

                      {notification.notes && (
                        <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                          <p style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.875rem',
                            color: '#333333'
                          }}>
                            Note: {notification.notes}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 mt-4">
                        {notification.status === 'waiting' && (
                          <PathWayButton
                            variant="primary"
                            size="small"
                            onClick={() => onStartPickup(notification.id)}
                            style={{ backgroundColor: '#4DA9E5', color: '#FFFFFF' }}
                          >
                            Start Pickup
                          </PathWayButton>
                        )}
                        
                        {notification.status === 'in-progress' && (
                          <PathWayButton
                            variant="primary"
                            size="small"
                            onClick={() => onCompletePickup(notification.id)}
                            style={{ backgroundColor: '#76D7C4', color: '#333333' }}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </PathWayButton>
                        )}
                        
                        {notification.parentPhone && (
                          <PathWayButton
                            variant="white"
                            size="small"
                            onClick={() => onCallParent(notification.parentPhone!)}
                          >
                            <Phone className="w-3 h-3 mr-1" />
                            Call
                          </PathWayButton>
                        )}
                        
                        <PathWayButton
                          variant="white"
                          size="small"
                          onClick={() => onSendMessage(notification.id)}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Message
                        </PathWayButton>
                      </div>
                    </div>
                  </div>
                </PathWayCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Completed Notifications */}
      {completedNotifications.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h3 className="mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Completed Today
          </h3>
          
          <div className="space-y-2">
            {completedNotifications.slice(0, 5).map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }}
              >
                <PathWayCard className="opacity-75">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="w-6 h-6" style={{ color: '#76D7C4' }} />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 600,
                          color: '#333333'
                        }}>
                          {notification.childName}
                        </span>
                        
                        <span style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          color: '#666666'
                        }}>
                          {notification.actualTime ? formatTime(notification.actualTime) : 'Completed'}
                        </span>
                      </div>
                      
                      <p style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        color: '#666666'
                      }}>
                        Picked up by {notification.parentName}
                      </p>
                    </div>
                  </div>
                </PathWayCard>
              </motion.div>
            ))}
            
            {completedNotifications.length > 5 && (
              <div className="text-center mt-4">
                <button 
                  className="transition-colors duration-200 hover:underline"
                  style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: '#4DA9E5',
                    backgroundColor: 'transparent',
                    border: 'none'
                  }}
                >
                  View all {completedNotifications.length} completed pickups
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <PathWayCard>
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#999999' }} />
              <h3 className="mb-2" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#333333'
              }}>
                No pickup notifications
              </h3>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                Pickup alerts will appear here when parents are ready to collect their children
              </p>
            </div>
          </PathWayCard>
        </motion.div>
      )}
    </div>
  );
}