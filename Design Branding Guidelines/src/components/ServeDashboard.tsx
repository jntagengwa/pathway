import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayBadge } from './PathWayBadge';
import { Calendar, Clock, Users, MapPin, UserCheck, Bell, ChevronRight } from 'lucide-react';

interface TodaySession {
  id: string;
  title: string;
  ageGroup: string;
  startTime: string;
  endTime: string;
  room: string;
  childrenCount: number;
  attendanceStatus: 'not-started' | 'in-progress' | 'completed';
  role: 'lead' | 'assistant' | 'helper';
  hasUnsynced: boolean;
}

interface PickupNotification {
  id: string;
  childName: string;
  parentName: string;
  time: string;
  urgent: boolean;
}

interface ServeDashboardProps {
  todaySessions: TodaySession[];
  pickupNotifications: PickupNotification[];
  userName: string;
  onTakeAttendance: (sessionId: string) => void;
  onViewPickups: () => void;
  onViewSession: (sessionId: string) => void;
  onViewSchedule: () => void;
}

export function ServeDashboard({
  todaySessions,
  pickupNotifications,
  userName,
  onTakeAttendance,
  onViewPickups,
  onViewSession,
  onViewSchedule
}: ServeDashboardProps) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  const getSessionStatus = (session: TodaySession) => {
    const [startHour, startMinutes] = session.startTime.split(':').map(Number);
    const [endHour, endMinutes] = session.endTime.split(':').map(Number);
    
    const sessionStart = startHour * 60 + startMinutes;
    const sessionEnd = endHour * 60 + endMinutes;
    const currentTimeMinutes = currentHour * 60 + currentMinutes;

    if (currentTimeMinutes < sessionStart) return 'upcoming';
    if (currentTimeMinutes >= sessionStart && currentTimeMinutes <= sessionEnd) return 'active';
    return 'completed';
  };

  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusBadge = (session: TodaySession) => {
    const status = getSessionStatus(session);
    switch (status) {
      case 'upcoming':
        return <PathWayBadge status="offline" showLabel={false} />;
      case 'active':
        return <PathWayBadge status="online" showLabel={false} />;
      case 'completed':
        return <PathWayBadge status="synced" showLabel={false} />;
      default:
        return <PathWayBadge status="offline" showLabel={false} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'lead':
        return '#4DA9E5';
      case 'assistant':
        return '#76D7C4';
      case 'helper':
        return '#FFD166';
      default:
        return '#999999';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                color: '#333333',
                marginBottom: '8px'
              }}>
                {getGreeting()}, {userName}
              </h2>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                You have {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''} today
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#4DA9E5' }}
            >
              <UserCheck className="w-6 h-6" style={{ color: '#FFFFFF' }} />
            </div>
          </div>
          
          {pickupNotifications.length > 0 && (
            <div 
              className="mt-4 p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-blue-50"
              style={{ backgroundColor: '#E3F2FD', border: '1px solid #4DA9E5' }}
              onClick={onViewPickups}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" style={{ color: '#4DA9E5' }} />
                  <span style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#333333'
                  }}>
                    {pickupNotifications.length} pickup notification{pickupNotifications.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: '#4DA9E5' }} />
              </div>
            </div>
          )}
        </PathWayCard>
      </motion.div>

      {/* Today's Sessions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Today's Sessions
          </h3>
          <button
            onClick={onViewSchedule}
            className="transition-colors duration-200 hover:underline"
            style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.875rem',
              color: '#4DA9E5',
              backgroundColor: 'transparent',
              border: 'none',
              padding: '0'
            }}
          >
            View Full Schedule
          </button>
        </div>

        {todaySessions.length > 0 ? (
          <div className="space-y-3">
            {todaySessions.map((session, index) => {
              const status = getSessionStatus(session);
              
              return (
                <motion.div
                  key={session.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                >
                  <PathWayCard 
                    hoverable 
                    onClick={() => onViewSession(session.id)}
                    className="cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Session Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="mb-2" style={{ 
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.25rem',
                            color: '#333333'
                          }}>
                            {session.title}
                          </h4>
                          
                          <div className="flex items-center space-x-3">
                            <span 
                              className="px-3 py-1 rounded-full text-sm"
                              style={{ 
                                backgroundColor: `${getRoleColor(session.role)}20`,
                                color: getRoleColor(session.role),
                                fontFamily: 'Quicksand, sans-serif',
                                fontWeight: 600
                              }}
                            >
                              {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
                            </span>
                            
                            {getStatusBadge(session)}
                            
                            {session.hasUnsynced && (
                              <PathWayBadge status="unsynced" size="small" />
                            )}
                          </div>
                        </div>
                        
                        {/* Time Display */}
                        <div className="text-right flex-shrink-0 ml-4">
                          <p style={{ 
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 700,
                            fontSize: '1.125rem',
                            color: '#333333'
                          }}>
                            {session.startTime}
                          </p>
                          <p style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.875rem',
                            color: '#666666'
                          }}>
                            to {session.endTime}
                          </p>
                        </div>
                      </div>

                      {/* Session Details - Mobile Stacked */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5" style={{ color: '#76D7C4' }} />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1rem',
                            color: '#666666'
                          }}>
                            {session.ageGroup} ({session.childrenCount} children)
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-5 h-5" style={{ color: '#FFD166' }} />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1rem',
                            color: '#666666'
                          }}>
                            {session.room}
                          </span>
                        </div>
                      </div>

                      {/* Action Button - Full Width */}
                      {status === 'active' && session.attendanceStatus === 'not-started' && (
                        <PathWayButton
                          variant="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTakeAttendance(session.id);
                          }}
                          className="w-full h-12 flex items-center justify-center space-x-2"
                          style={{ 
                            backgroundColor: '#4DA9E5',
                            color: '#FFFFFF'
                          }}
                        >
                          <UserCheck className="w-5 h-5" />
                          <span style={{ 
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 600
                          }}>
                            Take Attendance
                          </span>
                        </PathWayButton>
                      )}
                      
                      {status === 'active' && session.attendanceStatus === 'in-progress' && (
                        <PathWayButton
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewSession(session.id);
                          }}
                          className="w-full h-12 flex items-center justify-center space-x-2"
                        >
                          <UserCheck className="w-5 h-5" />
                          <span style={{ 
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 600
                          }}>
                            Continue Session
                          </span>
                        </PathWayButton>
                      )}
                      
                      {status === 'upcoming' && (
                        <div className="flex items-center justify-center space-x-2 py-3 px-4 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                          <Clock className="w-5 h-5" style={{ color: '#999999' }} />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1rem',
                            color: '#666666'
                          }}>
                            Starts in {Math.max(0, Math.ceil((new Date(session.startTime).getTime() - currentTime.getTime()) / (1000 * 60)))} minutes
                          </span>
                        </div>
                      )}
                    </div>
                  </PathWayCard>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <PathWayCard>
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: '#999999' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                No sessions scheduled for today
              </p>
            </div>
          </PathWayCard>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <PathWayCard>
          <h3 className="mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Quick Actions
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onViewSchedule}
              className="p-4 rounded-lg transition-colors duration-200 hover:bg-gray-50 text-left"
            >
              <Calendar className="w-6 h-6 mb-2" style={{ color: '#4DA9E5' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                View Schedule
              </p>
            </button>
            
            <button 
              onClick={onViewPickups}
              className="p-4 rounded-lg transition-colors duration-200 hover:bg-gray-50 text-left relative"
            >
              <Bell className="w-6 h-6 mb-2" style={{ color: '#FFD166' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                Pickup Alerts
              </p>
              {pickupNotifications.length > 0 && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#d4183d' }}
                >
                  <span style={{ 
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 600
                  }}>
                    {pickupNotifications.length}
                  </span>
                </div>
              )}
            </button>
          </div>
        </PathWayCard>
      </motion.div>
    </div>
  );
}