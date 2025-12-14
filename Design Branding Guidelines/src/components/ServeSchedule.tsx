import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayToggle } from './PathWayToggle';
import { PathWayBadge } from './PathWayBadge';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  UserCheck, 
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  Grid3X3,
  List
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  role: 'lead' | 'assistant' | 'helper';
}

interface ScheduleSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  ageGroup: string;
  room: string;
  teachers: Teacher[];
  childrenCount: number;
  userRole: 'lead' | 'assistant' | 'helper';
  isUserAvailable: boolean;
  canRequestSwap: boolean;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface ServeScheduleProps {
  sessions: ScheduleSession[];
  currentUserId: string;
  viewMode: 'list' | 'calendar';
  onBack?: () => void;
  onViewSession: (sessionId: string) => void;
  onToggleAvailability: (sessionId: string, available: boolean) => void;
  onRequestSwap: (sessionId: string) => void;
  onViewModeChange: (mode: 'list' | 'calendar') => void;
  showBackButton?: boolean;
}

export function ServeSchedule({
  sessions,
  currentUserId,
  viewMode,
  onBack,
  onViewSession,
  onToggleAvailability,
  onRequestSwap,
  onViewModeChange,
  showBackButton = false
}: ServeScheduleProps) {
  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.startTime}`);
    const dateB = new Date(`${b.date} ${b.startTime}`);
    return dateA.getTime() - dateB.getTime();
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#76D7C4';
      case 'pending':
        return '#FFD166';
      case 'cancelled':
        return '#d4183d';
      default:
        return '#999999';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
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
                Schedule & Rota
              </h2>
              
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#666666'
              }}>
                {sessions.filter(s => s.isUserAvailable).length} of {sessions.length} sessions available
              </p>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <PathWayButton
              variant={viewMode === 'list' ? 'primary' : 'white'}
              onClick={() => onViewModeChange('list')}
              className="w-10 h-10 p-0 flex items-center justify-center"
              style={viewMode === 'list' ? { backgroundColor: '#4DA9E5', color: '#FFFFFF' } : {}}
            >
              <List className="w-5 h-5" />
            </PathWayButton>
            
            <PathWayButton
              variant={viewMode === 'calendar' ? 'primary' : 'white'}
              onClick={() => onViewModeChange('calendar')}
              className="w-10 h-10 p-0 flex items-center justify-center"
              style={viewMode === 'calendar' ? { backgroundColor: '#4DA9E5', color: '#FFFFFF' } : {}}
            >
              <Grid3X3 className="w-5 h-5" />
            </PathWayButton>
          </div>
        </div>
      </motion.div>

      {/* Availability Summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Your Availability
            </h3>
            
            <div className="flex items-center space-x-2">
              <PathWayBadge 
                status={sessions.some(s => s.canRequestSwap) ? 'unsynced' : 'synced'}
                showLabel={false}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#76D7C4' }}>
                {sessions.filter(s => s.isUserAvailable && s.status === 'confirmed').length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                Confirmed
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#FFD166' }}>
                {sessions.filter(s => s.status === 'pending').length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                Pending
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: '#4DA9E5' }}>
                {sessions.filter(s => s.canRequestSwap).length}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#666666'
              }}>
                Swap Requests
              </p>
            </div>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Sessions List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {sortedSessions.length > 0 ? (
          <div className="space-y-3">
            {sortedSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
              >
                <PathWayCard 
                  hoverable 
                  onClick={() => onViewSession(session.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    {/* Date & Time */}
                    <div className="text-center flex-shrink-0 w-20">
                      <div 
                        className="w-2 h-2 rounded-full mx-auto mb-2"
                        style={{ backgroundColor: getStatusColor(session.status) }}
                      />
                      <p style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: '#333333'
                      }}>
                        {formatDate(session.date)}
                      </p>
                      <p style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        color: '#666666'
                      }}>
                        {session.startTime}-{session.endTime}
                      </p>
                    </div>

                    {/* Session Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 700,
                          color: '#333333'
                        }}>
                          {session.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2">
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ 
                              backgroundColor: `${getRoleColor(session.userRole)}20`,
                              color: getRoleColor(session.userRole),
                              fontFamily: 'Quicksand, sans-serif',
                              fontWeight: 600
                            }}
                          >
                            {session.userRole.charAt(0).toUpperCase() + session.userRole.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Session Info */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" style={{ color: '#76D7C4' }} />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: '#666666'
                          }}>
                            {session.ageGroup}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" style={{ color: '#FFD166' }} />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: '#666666'
                          }}>
                            {session.room}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <UserCheck className="w-4 h-4" style={{ color: '#4DA9E5' }} />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: '#666666'
                          }}>
                            {session.childrenCount} children
                          </span>
                        </div>
                      </div>

                      {/* Team Members */}
                      <div className="mb-3">
                        <p style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          color: '#666666'
                        }}>
                          Team: {session.teachers.map(t => t.name).join(', ')}
                        </p>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <PathWayToggle
                            label=""
                            description=""
                            checked={session.isUserAvailable}
                            onChange={(available) => {
                              onToggleAvailability(session.id, available);
                            }}
                            size="small"
                          />
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: session.isUserAvailable ? '#76D7C4' : '#999999'
                          }}>
                            {session.isUserAvailable ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        
                        {session.canRequestSwap && (
                          <PathWayButton
                            variant="white"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRequestSwap(session.id);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Request Swap</span>
                          </PathWayButton>
                        )}
                      </div>
                    </div>
                  </div>
                </PathWayCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <PathWayCard>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#999999' }} />
              <h3 className="mb-2" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#333333'
              }}>
                No sessions scheduled
              </h3>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                Check back later for new volunteer opportunities
              </p>
            </div>
          </PathWayCard>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex space-x-4">
            <PathWayButton
              variant="primary"
              className="flex-1"
              style={{ backgroundColor: '#4DA9E5', color: '#FFFFFF' }}
              onClick={() => {
                // Refresh or sync functionality
                window.location.reload();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Schedule
            </PathWayButton>
            
            <PathWayButton
              variant="white"
              onClick={() => {
                alert('Calendar export functionality would be implemented here');
              }}
            >
              Export Calendar
            </PathWayButton>
          </div>
        </PathWayCard>
      </motion.div>
    </div>
  );
}