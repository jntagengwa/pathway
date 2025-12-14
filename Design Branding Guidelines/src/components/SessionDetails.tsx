import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PathWayCard } from './PathWayCard';
import { PathWayButton } from './PathWayButton';
import { PathWayBadge } from './PathWayBadge';
import { PathWayInput } from './PathWayInput';
import { 
  ArrowLeft, 
  User, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Star,
  Flag,
  Save,
  Upload
} from 'lucide-react';

interface Child {
  id: string;
  name: string;
  ageGroup: string;
  photo?: string;
  hasPhotoConsent: boolean;
  attendanceStatus: 'present' | 'absent' | 'late' | 'not-marked';
  notes?: string;
}

interface Teacher {
  id: string;
  name: string;
  role: 'lead' | 'assistant' | 'helper';
}

interface SessionInfo {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  ageGroup: string;
  room: string;
  teachers: Teacher[];
  children: Child[];
  hasUnsynced: boolean;
  userRole: 'lead' | 'assistant' | 'helper';
}

interface PositiveNote {
  id: string;
  childId: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Concern {
  id: string;
  childId: string;
  concern: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  createdAt: string;
}

interface SessionDetailsProps {
  session: SessionInfo;
  positiveNotes: PositiveNote[];
  concerns: Concern[];
  onBack: () => void;
  onUpdateAttendance: (childId: string, status: 'present' | 'absent' | 'late') => void;
  onAddPositiveNote: (childId: string, note: string) => void;
  onAddConcern: (childId: string, concern: string, severity: 'low' | 'medium' | 'high') => void;
  onSyncData: () => void;
}

export function SessionDetails({
  session,
  positiveNotes,
  concerns,
  onBack,
  onUpdateAttendance,
  onAddPositiveNote,
  onAddConcern,
  onSyncData
}: SessionDetailsProps) {
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newConcern, setNewConcern] = useState('');
  const [concernSeverity, setConcernSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddConcern, setShowAddConcern] = useState(false);

  const getAttendanceStats = () => {
    const present = session.children.filter(c => c.attendanceStatus === 'present').length;
    const late = session.children.filter(c => c.attendanceStatus === 'late').length;
    const absent = session.children.filter(c => c.attendanceStatus === 'absent').length;
    const notMarked = session.children.filter(c => c.attendanceStatus === 'not-marked').length;
    
    return { present, late, absent, notMarked };
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present':
        return '#76D7C4';
      case 'late':
        return '#FFD166';
      case 'absent':
        return '#d4183d';
      default:
        return '#999999';
    }
  };

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-5 h-5" style={{ color: '#76D7C4' }} />;
      case 'late':
        return <Clock className="w-5 h-5" style={{ color: '#FFD166' }} />;
      case 'absent':
        return <X className="w-5 h-5" style={{ color: '#d4183d' }} />;
      default:
        return <AlertTriangle className="w-5 h-5" style={{ color: '#999999' }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#d4183d';
      case 'medium':
        return '#FFD166';
      case 'low':
        return '#76D7C4';
      default:
        return '#999999';
    }
  };

  const stats = getAttendanceStats();
  const selectedChildData = selectedChild ? session.children.find(c => c.id === selectedChild) : null;
  const childNotes = positiveNotes.filter(n => n.childId === selectedChild);
  const childConcerns = concerns.filter(c => c.childId === selectedChild);

  const handleAddNote = () => {
    if (selectedChild && newNote.trim()) {
      onAddPositiveNote(selectedChild, newNote.trim());
      setNewNote('');
      setShowAddNote(false);
    }
  };

  const handleAddConcern = () => {
    if (selectedChild && newConcern.trim()) {
      onAddConcern(selectedChild, newConcern.trim(), concernSeverity);
      setNewConcern('');
      setShowAddConcern(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
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
            
            <div className="flex-1 min-w-0">
              <h2 style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                fontSize: '1.5rem',
                color: '#333333',
                marginBottom: '8px'
              }}>
                {session.title}
              </h2>
              
              {/* Session Info - Stacked for Mobile */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" style={{ color: '#666666' }} />
                  <span style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '1rem',
                    color: '#666666'
                  }}>
                    {session.date} • {session.startTime}-{session.endTime}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" style={{ color: '#666666' }} />
                  <span style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '1rem',
                    color: '#666666'
                  }}>
                    {session.room}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status and Sync - Full Width for Mobile */}
          <div className="flex items-center justify-between">
            {session.hasUnsynced && (
              <PathWayBadge status="unsynced" showLabel />
            )}
            
            <PathWayButton
              variant="primary"
              onClick={onSyncData}
              className="h-12 px-6 flex items-center space-x-2"
              style={{ backgroundColor: '#4DA9E5', color: '#FFFFFF' }}
            >
              <Upload className="w-5 h-5" />
              <span style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600
              }}>
                Sync Data
              </span>
            </PathWayButton>
          </div>
        </div>
      </motion.div>

      {/* Attendance Overview - Mobile Optimized */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <PathWayCard>
          <h3 className="mb-6" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: '#333333'
          }}>
            Attendance Overview
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#F0FDF4' }}>
              <div className="text-3xl font-bold mb-2" style={{ color: '#76D7C4' }}>
                {stats.present}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#666666'
              }}>
                Present
              </p>
            </div>
            
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#FFFBEB' }}>
              <div className="text-3xl font-bold mb-2" style={{ color: '#FFD166' }}>
                {stats.late}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#666666'
              }}>
                Late
              </p>
            </div>
            
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#FEF2F2' }}>
              <div className="text-3xl font-bold mb-2" style={{ color: '#d4183d' }}>
                {stats.absent}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#666666'
              }}>
                Absent
              </p>
            </div>
            
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: '#F9FAFB' }}>
              <div className="text-3xl font-bold mb-2" style={{ color: '#999999' }}>
                {stats.notMarked}
              </div>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#666666'
              }}>
                Not Marked
              </p>
            </div>
          </div>
        </PathWayCard>
      </motion.div>

      {/* Children Roster */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <PathWayCard>
          <h3 className="mb-6" style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            color: '#333333',
            fontSize: '1.25rem'
          }}>
            Children Roster ({session.children.length})
          </h3>
          
          <div className="space-y-4">
            {session.children.map((child, index) => (
              <motion.div
                key={child.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
              >
                <div 
                  className={`p-5 rounded-xl transition-all duration-200 cursor-pointer ${
                    selectedChild === child.id ? 'ring-2 ring-blue-200 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  style={{ border: '2px solid #E0E0E0' }}
                  onClick={() => setSelectedChild(selectedChild === child.id ? null : child.id)}
                >
                  {/* Child Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    {/* Child Photo */}
                    <div className="flex-shrink-0">
                      {child.photo && child.hasPhotoConsent ? (
                        <img 
                          src={child.photo} 
                          alt={`${child.name}'s photo`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div 
                          className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                          style={{ backgroundColor: '#F5F5F5' }}
                        >
                          <User className="w-8 h-8" style={{ color: '#999999' }} />
                        </div>
                      )}
                    </div>

                    {/* Child Info */}
                    <div className="flex-1 min-w-0">
                      <h4 style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        color: '#333333',
                        marginBottom: '4px'
                      }}>
                        {child.name}
                      </h4>
                      <p style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        color: '#666666'
                      }}>
                        {child.ageGroup}
                      </p>
                    </div>

                    {/* Current Status Badge */}
                    <div className="flex-shrink-0">
                      <div className="flex flex-col items-center space-y-1">
                        {getAttendanceIcon(child.attendanceStatus)}
                        <span 
                          className="px-3 py-1 rounded-full text-xs whitespace-nowrap"
                          style={{ 
                            backgroundColor: `${getAttendanceColor(child.attendanceStatus)}20`,
                            color: getAttendanceColor(child.attendanceStatus),
                            fontFamily: 'Quicksand, sans-serif',
                            fontWeight: 600
                          }}
                        >
                          {child.attendanceStatus === 'not-marked' ? 'Not Marked' : 
                           child.attendanceStatus.charAt(0).toUpperCase() + child.attendanceStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Buttons - Mobile Optimized */}
                  <div className="grid grid-cols-3 gap-3">
                    <PathWayButton
                      variant={child.attendanceStatus === 'present' ? 'primary' : 'white'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateAttendance(child.id, 'present');
                      }}
                      className="h-12 flex items-center justify-center space-x-2"
                      style={child.attendanceStatus === 'present' ? 
                        { backgroundColor: '#76D7C4', color: '#333333' } : {}
                      }
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        Present
                      </span>
                    </PathWayButton>
                    
                    <PathWayButton
                      variant={child.attendanceStatus === 'late' ? 'primary' : 'white'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateAttendance(child.id, 'late');
                      }}
                      className="h-12 flex items-center justify-center space-x-2"
                      style={child.attendanceStatus === 'late' ? 
                        { backgroundColor: '#FFD166', color: '#333333' } : {}
                      }
                    >
                      <Clock className="w-5 h-5" />
                      <span style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        Late
                      </span>
                    </PathWayButton>
                    
                    <PathWayButton
                      variant={child.attendanceStatus === 'absent' ? 'primary' : 'white'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateAttendance(child.id, 'absent');
                      }}
                      className="h-12 flex items-center justify-center space-x-2"
                      style={child.attendanceStatus === 'absent' ? 
                        { backgroundColor: '#d4183d', color: '#FFFFFF' } : {}
                      }
                    >
                      <X className="w-5 h-5" />
                      <span style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        Absent
                      </span>
                    </PathWayButton>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </PathWayCard>
      </motion.div>

      {/* Child Details Panel */}
      {selectedChild && selectedChildData && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PathWayCard>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                color: '#333333'
              }}>
                {selectedChildData.name} - Details
              </h3>
              
              <PathWayButton
                variant="white"
                onClick={() => setSelectedChild(null)}
                className="w-8 h-8 p-0 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </PathWayButton>
            </div>

            {/* Positive Notes Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5" style={{ color: '#FFD166' }} />
                  <h4 style={{ 
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 600,
                    color: '#333333'
                  }}>
                    Positive Notes
                  </h4>
                </div>
                
                <PathWayButton
                  variant="white"
                  size="small"
                  onClick={() => setShowAddNote(true)}
                >
                  Add Note
                </PathWayButton>
              </div>

              {showAddNote && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#F8F9FA' }}>
                  <PathWayInput
                    label=""
                    placeholder="Share something positive about this child..."
                    value={newNote}
                    onChange={setNewNote}
                    multiline
                  />
                  <div className="flex space-x-2 mt-3">
                    <PathWayButton
                      variant="primary"
                      size="small"
                      onClick={handleAddNote}
                      style={{ backgroundColor: '#FFD166', color: '#333333' }}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save Note
                    </PathWayButton>
                    <PathWayButton
                      variant="white"
                      size="small"
                      onClick={() => {
                        setShowAddNote(false);
                        setNewNote('');
                      }}
                    >
                      Cancel
                    </PathWayButton>
                  </div>
                </div>
              )}

              {childNotes.length > 0 ? (
                <div className="space-y-2">
                  {childNotes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg" style={{ backgroundColor: '#FFF9E6' }}>
                      <p style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        color: '#333333',
                        marginBottom: '8px'
                      }}>
                        {note.note}
                      </p>
                      <div className="flex items-center justify-between">
                        <span style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          color: '#666666'
                        }}>
                          {note.createdAt}
                        </span>
                        <span 
                          className="px-2 py-1 rounded-full text-xs"
                          style={{ 
                            backgroundColor: note.status === 'approved' ? '#76D7C420' : '#FFD16620',
                            color: note.status === 'approved' ? '#76D7C4' : '#FFD166',
                            fontFamily: 'Quicksand, sans-serif',
                            fontWeight: 600
                          }}
                        >
                          {note.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  color: '#999999',
                  fontStyle: 'italic'
                }}>
                  No positive notes yet
                </p>
              )}
            </div>

            {/* Concerns Section (Admin/Lead only) */}
            {session.userRole === 'lead' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Flag className="w-5 h-5" style={{ color: '#d4183d' }} />
                    <h4 style={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                      color: '#333333'
                    }}>
                      Concerns (Admin Only)
                    </h4>
                  </div>
                  
                  <PathWayButton
                    variant="white"
                    size="small"
                    onClick={() => setShowAddConcern(true)}
                  >
                    Add Concern
                  </PathWayButton>
                </div>

                {showAddConcern && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FDF2F2' }}>
                    <PathWayInput
                      label=""
                      placeholder="Describe the concern..."
                      value={newConcern}
                      onChange={setNewConcern}
                      multiline
                    />
                    <div className="flex items-center space-x-4 mt-3 mb-3">
                      <span style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        color: '#333333'
                      }}>
                        Severity:
                      </span>
                      {(['low', 'medium', 'high'] as const).map((severity) => (
                        <button
                          key={severity}
                          onClick={() => setConcernSeverity(severity)}
                          className={`px-3 py-1 rounded-full text-xs transition-colors duration-200 ${
                            concernSeverity === severity ? 'font-semibold' : ''
                          }`}
                          style={{ 
                            backgroundColor: concernSeverity === severity ? 
                              getSeverityColor(severity) : `${getSeverityColor(severity)}20`,
                            color: concernSeverity === severity ? '#FFFFFF' : getSeverityColor(severity),
                            border: 'none'
                          }}
                        >
                          {severity.charAt(0).toUpperCase() + severity.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <PathWayButton
                        variant="primary"
                        size="small"
                        onClick={handleAddConcern}
                        style={{ backgroundColor: '#d4183d', color: '#FFFFFF' }}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save Concern
                      </PathWayButton>
                      <PathWayButton
                        variant="white"
                        size="small"
                        onClick={() => {
                          setShowAddConcern(false);
                          setNewConcern('');
                          setConcernSeverity('low');
                        }}
                      >
                        Cancel
                      </PathWayButton>
                    </div>
                  </div>
                )}

                {childConcerns.length > 0 ? (
                  <div className="space-y-2">
                    {childConcerns.map((concern) => (
                      <div key={concern.id} className="p-3 rounded-lg" style={{ backgroundColor: '#FDF2F2' }}>
                        <p style={{ 
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.875rem',
                          color: '#333333',
                          marginBottom: '8px'
                        }}>
                          {concern.concern}
                        </p>
                        <div className="flex items-center justify-between">
                          <span style={{ 
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: '#666666'
                          }}>
                            {concern.createdAt}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span 
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: getSeverityColor(concern.severity),
                                color: '#FFFFFF',
                                fontFamily: 'Quicksand, sans-serif',
                                fontWeight: 600
                              }}
                            >
                              {concern.severity.toUpperCase()}
                            </span>
                            <span 
                              className="px-2 py-1 rounded-full text-xs"
                              style={{ 
                                backgroundColor: concern.status === 'resolved' ? '#76D7C420' : '#FFD16620',
                                color: concern.status === 'resolved' ? '#76D7C4' : '#FFD166',
                                fontFamily: 'Quicksand, sans-serif',
                                fontWeight: 600
                              }}
                            >
                              {concern.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: '#999999',
                    fontStyle: 'italic'
                  }}>
                    No concerns recorded
                  </p>
                )}
              </div>
            )}
          </PathWayCard>
        </motion.div>
      )}
    </div>
  );
}