import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayBadge } from './PathWayBadge';
import { Bell, AlertCircle, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  preview: string;
  date: string;
  urgent: boolean;
  category: 'general' | 'event' | 'safety' | 'reminder';
  read: boolean;
  targetAgeGroups: string[];
}

interface NoticesListProps {
  notices: Notice[];
  onSelectNotice: (noticeId: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function NoticesList({ 
  notices, 
  onSelectNotice, 
  onBack,
  showBackButton = false 
}: NoticesListProps) {
  const sortedNotices = [...notices].sort((a, b) => {
    // Sort by urgent first, then by date (newest first)
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'event':
        return <Calendar className="w-5 h-5" style={{ color: '#4DA9E5' }} />;
      case 'safety':
        return <AlertCircle className="w-5 h-5" style={{ color: '#d4183d' }} />;
      default:
        return <Bell className="w-5 h-5" style={{ color: '#76D7C4' }} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'event':
        return '#4DA9E5';
      case 'safety':
        return '#d4183d';
      case 'reminder':
        return '#FFD166';
      default:
        return '#76D7C4';
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && onBack && (
              <PathWayButton
                variant="white"
                onClick={onBack}
                className="w-10 h-10 p-0 flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </PathWayButton>
            )}
            
            <div>
              <h2 style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                color: '#333333'
              }}>
                Notices & Announcements
              </h2>
              
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#666666'
              }}>
                {notices.filter(n => !n.read).length} unread of {notices.length} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <PathWayBadge 
              status={notices.some(n => n.urgent && !n.read) ? 'unsynced' : 'synced'}
              showLabel={false}
            />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex flex-wrap gap-2">
            <button 
              className="px-3 py-1 rounded-full transition-colors duration-200"
              style={{ 
                backgroundColor: '#76D7C4',
                color: '#333333',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: 'none'
              }}
            >
              All
            </button>
            <button 
              className="px-3 py-1 rounded-full transition-colors duration-200 hover:bg-gray-100"
              style={{ 
                backgroundColor: 'transparent',
                color: '#666666',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid #E0E0E0'
              }}
            >
              Unread
            </button>
            <button 
              className="px-3 py-1 rounded-full transition-colors duration-200 hover:bg-gray-100"
              style={{ 
                backgroundColor: 'transparent',
                color: '#666666',
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 600,
                border: '1px solid #E0E0E0'
              }}
            >
              Urgent
            </button>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Notices List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {sortedNotices.length > 0 ? (
          <div className="space-y-3">
            {sortedNotices.map((notice, index) => (
              <motion.div
                key={notice.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
              >
                <PathWayCard 
                  hoverable 
                  onClick={() => onSelectNotice(notice.id)}
                  className={`cursor-pointer relative ${!notice.read ? 'ring-2 ring-blue-100' : ''}`}
                >
                  {/* Urgent indicator */}
                  {notice.urgent && (
                    <div 
                      className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                      style={{ backgroundColor: '#d4183d' }}
                    />
                  )}
                  
                  <div className="flex items-start space-x-4 pl-2">
                    {/* Category Icon */}
                    <div className="flex-shrink-0 pt-1">
                      {getCategoryIcon(notice.category)}
                    </div>
                    
                    {/* Notice Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={`mb-1 ${!notice.read ? 'font-bold' : ''}`} style={{ 
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: notice.read ? 600 : 700,
                            color: '#333333',
                            fontSize: '0.875rem',
                            lineHeight: '1.3'
                          }}>
                            {notice.title}
                            {notice.urgent && (
                              <span 
                                className="ml-2 px-2 py-0.5 rounded-full text-xs"
                                style={{ 
                                  backgroundColor: '#d4183d',
                                  color: '#FFFFFF',
                                  fontFamily: 'Quicksand, sans-serif',
                                  fontWeight: 600
                                }}
                              >
                                URGENT
                              </span>
                            )}
                          </h4>
                          
                          <p className="mb-2" style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: '#666666',
                            lineHeight: '1.3'
                          }}>
                            {notice.preview}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-2">
                          {!notice.read && (
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: '#4DA9E5' }}
                            />
                          )}
                          <ChevronRight className="w-4 h-4" style={{ color: '#999999' }} />
                        </div>
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.65rem',
                            color: '#999999'
                          }}>
                            {notice.date}
                          </span>
                          
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ 
                              backgroundColor: `${getCategoryColor(notice.category)}20`,
                              color: getCategoryColor(notice.category),
                              fontFamily: 'Quicksand, sans-serif',
                              fontWeight: 600
                            }}
                          >
                            {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
                          </span>
                        </div>
                        
                        {notice.targetAgeGroups.length > 0 && (
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.65rem',
                            color: '#999999'
                          }}>
                            For: {notice.targetAgeGroups.join(', ')}
                          </span>
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
              <Bell className="w-16 h-16 mx-auto mb-4" style={{ color: '#999999' }} />
              <h3 className="mb-2" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#333333'
              }}>
                No notices yet
              </h3>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                Important announcements and updates will appear here
              </p>
            </div>
          </PathWayCard>
        )}
      </motion.div>
    </div>
  );
}