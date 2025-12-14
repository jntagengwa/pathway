import React from 'react';
import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { Bell, AlertCircle, Calendar, Clock, Users, ArrowLeft } from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  urgent: boolean;
  category: 'general' | 'event' | 'safety' | 'reminder';
  author: string;
  targetAgeGroups: string[];
  expiryDate?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface NoticeDetailProps {
  notice: Notice;
  onBack: () => void;
  onMarkAsRead?: (noticeId: string) => void;
}

export function NoticeDetail({ notice, onBack, onMarkAsRead }: NoticeDetailProps) {
  const getCategoryIcon = () => {
    switch (notice.category) {
      case 'event':
        return <Calendar className="w-6 h-6" style={{ color: '#4DA9E5' }} />;
      case 'safety':
        return <AlertCircle className="w-6 h-6" style={{ color: '#d4183d' }} />;
      default:
        return <Bell className="w-6 h-6" style={{ color: '#76D7C4' }} />;
    }
  };

  const getCategoryColor = () => {
    switch (notice.category) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Mark as read when component mounts
  React.useEffect(() => {
    if (onMarkAsRead) {
      onMarkAsRead(notice.id);
    }
  }, [notice.id, onMarkAsRead]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-4 mb-6">
          <PathWayButton
            variant="white"
            onClick={onBack}
            className="px-4 h-12 flex items-center justify-center flex-shrink-0 gap-2"
            aria-label="Go back to notices list"
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
          
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              {getCategoryIcon()}
              <span 
                className="px-3 py-1 rounded-full text-sm"
                style={{ 
                  backgroundColor: `${getCategoryColor()}20`,
                  color: getCategoryColor(),
                  fontFamily: 'Quicksand, sans-serif',
                  fontWeight: 600
                }}
              >
                {notice.category.charAt(0).toUpperCase() + notice.category.slice(1)}
              </span>
              
              {notice.urgent && (
                <span 
                  className="px-3 py-1 rounded-full text-sm"
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notice Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          {/* Title */}
          <h1 className="mb-6" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '1.5rem',
            color: '#333333',
            lineHeight: '1.3'
          }}>
            {notice.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" style={{ color: '#666666' }} />
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#666666'
              }}>
                {formatDate(notice.date)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" style={{ color: '#666666' }} />
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#666666'
              }}>
                From {notice.author}
              </span>
            </div>
            
            {notice.targetAgeGroups.length > 0 && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" style={{ color: '#666666' }} />
                <span style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  color: '#666666'
                }}>
                  For: {notice.targetAgeGroups.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            <div style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '1rem',
              color: '#333333',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {notice.content}
            </div>
          </div>

          {/* Expiry Notice */}
          {notice.expiryDate && (
            <div 
              className="mt-6 p-3 rounded-lg"
              style={{ backgroundColor: '#FFF9E6', border: '1px solid #FFD166' }}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" style={{ color: '#FFD166' }} />
                <span style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  color: '#333333'
                }}>
                  This notice expires on {formatDate(notice.expiryDate)}
                </span>
              </div>
            </div>
          )}
        </PathWayCard>
      </motion.div>

      {/* Attachments */}
      {notice.attachments && notice.attachments.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <PathWayCard>
            <h3 className="mb-4" style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Attachments
            </h3>
            
            <div className="space-y-2">
              {notice.attachments.map((attachment, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  style={{ border: '1px solid #E0E0E0' }}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#F5F5F5' }}
                    >
                      <span style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.65rem',
                        color: '#666666',
                        fontWeight: 600
                      }}>
                        {attachment.type.toUpperCase()}
                      </span>
                    </div>
                    
                    <span style={{ 
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      color: '#333333'
                    }}>
                      {attachment.name}
                    </span>
                  </div>
                  
                  <PathWayButton
                    variant="white"
                    size="small"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    Download
                  </PathWayButton>
                </div>
              ))}
            </div>
          </PathWayCard>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex space-x-4">
            <PathWayButton
              variant="primary"
              onClick={onBack}
              className="flex-1"
            >
              Back to Notices
            </PathWayButton>
            
            <PathWayButton
              variant="white"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: notice.title,
                    text: notice.content,
                    url: window.location.href
                  });
                } else {
                  // Fallback for browsers that don't support Web Share API
                  navigator.clipboard.writeText(
                    `${notice.title}\n\n${notice.content}\n\nShared from PathWay`
                  );
                  alert('Notice copied to clipboard');
                }
              }}
            >
              Share
            </PathWayButton>
          </div>
        </PathWayCard>
      </motion.div>
    </div>
  );
}