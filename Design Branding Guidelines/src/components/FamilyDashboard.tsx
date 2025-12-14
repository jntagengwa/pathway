import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayBadge } from './PathWayBadge';
import { User, Calendar, Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Child {
  id: string;
  name: string;
  ageGroup: string;
  photo?: string;
  attendanceRate: number;
  lastAttendance: string;
  hasNewNotices: boolean;
  photoConsent: boolean;
}

interface FamilyDashboardProps {
  children: Child[];
  recentNotices: Array<{
    id: string;
    title: string;
    date: string;
    urgent?: boolean;
  }>;
  onSelectChild: (childId: string) => void;
  onViewAllNotices: () => void;
}

export function FamilyDashboard({ 
  children, 
  recentNotices, 
  onSelectChild, 
  onViewAllNotices 
}: FamilyDashboardProps) {
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
                Welcome to Family Space
              </h2>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                Stay connected with your {children.length > 1 ? 'children\'s' : 'child\'s'} journey
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#FFD166' }}
            >
              <User className="w-6 h-6" style={{ color: '#333333' }} />
            </div>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Children Overview */}
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
            Your {children.length > 1 ? 'Children' : 'Child'}
          </h3>
          <PathWayBadge 
            status={children.length > 0 ? 'synced' : 'unsynced'} 
            showLabel 
          />
        </div>

        <div className="space-y-4">
          {children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            >
              <PathWayCard 
                hoverable 
                onClick={() => onSelectChild(child.id)}
                className="cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Child Header */}
                  <div className="flex items-center space-x-4">
                    {/* Child Photo */}
                    <div className="flex-shrink-0">
                      {child.photo ? (
                        <img 
                          src={child.photo} 
                          alt={`${child.name}'s photo`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div 
                          className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                          style={{ backgroundColor: '#F5F5F5' }}
                        >
                          <User className="w-10 h-10" style={{ color: '#999999' }} />
                        </div>
                      )}
                    </div>

                    {/* Child Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 700,
                          fontSize: '1.25rem',
                          color: '#333333'
                        }}>
                          {child.name}
                        </h4>
                        {child.hasNewNotices && (
                          <PathWayBadge status="unsynced" size="small" />
                        )}
                      </div>
                      
                      <p className="mb-1" style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '1rem',
                        color: '#666666'
                      }}>
                        {child.ageGroup}
                      </p>
                    </div>
                  </div>

                  {/* Quick Stats - Mobile Optimized */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                      <CheckCircle className="w-5 h-5" style={{ color: '#76D7C4' }} />
                      <div>
                        <p style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: '#333333'
                        }}>
                          {child.attendanceRate}%
                        </p>
                        <p style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          color: '#666666'
                        }}>
                          Attendance
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ backgroundColor: '#EBF8FF' }}>
                      <Calendar className="w-5 h-5" style={{ color: '#4DA9E5' }} />
                      <div>
                        <p style={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: '#333333'
                        }}>
                          {child.lastAttendance}
                        </p>
                        <p style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          color: '#666666'
                        }}>
                          Last Visit
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </PathWayCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Notices */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Recent Notices
          </h3>
          <button
            onClick={onViewAllNotices}
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
            View All
          </button>
        </div>

        {recentNotices.length > 0 ? (
          <div className="space-y-2">
            {recentNotices.slice(0, 3).map((notice, index) => (
              <motion.div
                key={notice.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              >
                <PathWayCard hoverable className="cursor-pointer">
                  <div className="flex items-center space-x-3 py-2">
                    <div className="flex-shrink-0">
                      {notice.urgent ? (
                        <AlertCircle className="w-5 h-5" style={{ color: '#d4183d' }} />
                      ) : (
                        <Bell className="w-5 h-5" style={{ color: '#4DA9E5' }} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#333333'
                      }}>
                        {notice.title}
                      </h5>
                      <p style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        color: '#666666'
                      }}>
                        {notice.date}
                      </p>
                    </div>
                  </div>
                </PathWayCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <PathWayCard>
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto mb-4" style={{ color: '#999999' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                No recent notices
              </p>
            </div>
          </PathWayCard>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
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
            <button className="p-4 rounded-lg transition-colors duration-200 hover:bg-gray-50 text-left">
              <Calendar className="w-6 h-6 mb-2" style={{ color: '#4DA9E5' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                View Calendar
              </p>
            </button>
            
            <button className="p-4 rounded-lg transition-colors duration-200 hover:bg-gray-50 text-left">
              <Bell className="w-6 h-6 mb-2" style={{ color: '#FFD166' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333'
              }}>
                All Notices
              </p>
            </button>
          </div>
        </PathWayCard>
      </motion.div>
    </div>
  );
}