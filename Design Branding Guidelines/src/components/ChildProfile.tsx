import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayToggle } from './PathWayToggle';
import { PathWayBadge } from './PathWayBadge';
import { User, Calendar, CheckCircle, X, Star, ArrowLeft } from 'lucide-react';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

interface PositiveNote {
  id: string;
  date: string;
  teacher: string;
  note: string;
  approved: boolean;
}

interface Child {
  id: string;
  name: string;
  ageGroup: string;
  photo?: string;
  photoConsent: boolean;
  attendanceHistory: AttendanceRecord[];
  positiveNotes: PositiveNote[];
}

interface ChildProfileProps {
  child: Child;
  onBack: () => void;
  onUpdatePhotoConsent: (childId: string, consent: boolean) => void;
}

export function ChildProfile({ child, onBack, onUpdatePhotoConsent }: ChildProfileProps) {
  const recentAttendance = child.attendanceHistory.slice(0, 10);
  const approvedNotes = child.positiveNotes.filter(note => note.approved);
  
  const attendanceRate = Math.round(
    (child.attendanceHistory.filter(record => record.status === 'present').length / 
     child.attendanceHistory.length) * 100
  );

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4" style={{ color: '#76D7C4' }} />;
      case 'absent':
        return <X className="w-4 h-4" style={{ color: '#d4183d' }} />;
      case 'late':
        return <Calendar className="w-4 h-4" style={{ color: '#FFD166' }} />;
      default:
        return null;
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#76D7C4';
      case 'absent':
        return '#d4183d';
      case 'late':
        return '#FFD166';
      default:
        return '#999999';
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
          <PathWayButton
            variant="white"
            onClick={onBack}
            className="px-4 h-12 flex items-center justify-center flex-shrink-0 gap-2"
            aria-label="Go back to previous page"
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
          
          <h2 style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            {child.name}'s Profile
          </h2>
        </div>
      </motion.div>

      {/* Child Info Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-6">
            {/* Child Photo */}
            <div className="flex-shrink-0">
              {child.photo ? (
                <img 
                  src={child.photo} 
                  alt={`${child.name}'s photo`}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <User className="w-12 h-12" style={{ color: '#999999' }} />
                </div>
              )}
            </div>

            {/* Child Details */}
            <div className="flex-1">
              <h3 className="mb-2" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#333333'
              }}>
                {child.name}
              </h3>
              
              <div className="flex items-center space-x-4 mb-4">
                <span style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  color: '#666666'
                }}>
                  {child.ageGroup}
                </span>
                
                <PathWayBadge 
                  status={attendanceRate >= 90 ? 'synced' : attendanceRate >= 70 ? 'online' : 'unsynced'}
                  showLabel={false}
                />
              </div>

              <div className="flex items-center space-x-1">
                <CheckCircle className="w-5 h-5" style={{ color: '#76D7C4' }} />
                <span style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  color: '#666666'
                }}>
                  {attendanceRate}% attendance rate
                </span>
              </div>
            </div>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Photo Consent */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <PathWayCard>
          <h4 className="mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Privacy Settings
          </h4>
          
          <PathWayToggle
            label="Photo consent for secure teacher identification"
            description="I consent for my child's photo to be used for secure teacher identification purposes only"
            checked={child.photoConsent}
            onChange={(consent) => onUpdatePhotoConsent(child.id, consent)}
          />
          
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.75rem',
              color: '#666666',
              lineHeight: '1.4'
            }}>
              Photos are used exclusively for safety and identification by authorized staff. 
              They are securely stored and never shared externally.
            </p>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Attendance History */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <PathWayCard>
          <h4 className="mb-4" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333'
          }}>
            Recent Attendance
          </h4>
          
          <div className="space-y-2">
            {recentAttendance.map((record, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  {getAttendanceIcon(record.status)}
                  <span style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: '#333333'
                  }}>
                    {record.date}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span 
                    className="px-2 py-1 rounded-full text-xs"
                    style={{ 
                      backgroundColor: `${getAttendanceColor(record.status)}20`,
                      color: getAttendanceColor(record.status),
                      fontFamily: 'Quicksand, sans-serif',
                      fontWeight: 600
                    }}
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {child.attendanceHistory.length > 10 && (
            <div className="mt-4 text-center">
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
                View Full History
              </button>
            </div>
          )}
        </PathWayCard>
      </motion.div>

      {/* Positive Notes */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <PathWayCard>
          <div className="flex items-center space-x-2 mb-4">
            <Star className="w-5 h-5" style={{ color: '#FFD166' }} />
            <h4 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: '#333333'
            }}>
              Positive Notes
            </h4>
          </div>
          
          {approvedNotes.length > 0 ? (
            <div className="space-y-4">
              {approvedNotes.slice(0, 3).map((note) => (
                <div key={note.id} className="p-4 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ 
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.75rem',
                      color: '#666666'
                    }}>
                      From {note.teacher}
                    </span>
                    <span style={{ 
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.75rem',
                      color: '#666666'
                    }}>
                      {note.date}
                    </span>
                  </div>
                  
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: '#333333',
                    lineHeight: '1.4'
                  }}>
                    {note.note}
                  </p>
                </div>
              ))}
              
              {approvedNotes.length > 3 && (
                <div className="text-center">
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
                    View All Notes
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Star className="w-12 h-12 mx-auto mb-3" style={{ color: '#999999' }} />
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: '#666666'
              }}>
                No positive notes yet
              </p>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                color: '#999999',
                marginTop: '4px'
              }}>
                Teachers will share positive moments here
              </p>
            </div>
          )}
        </PathWayCard>
      </motion.div>
    </div>
  );
}