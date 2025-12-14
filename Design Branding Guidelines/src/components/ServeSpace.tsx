import { useState } from 'react';
import { motion } from 'motion/react';
import pathwayLogo from 'figma:asset/ed0d7c9c9507ef7eeb63f93b164e16b201ba64a9.png';
import { ServeDashboard } from './ServeDashboard';
import { ServeSchedule } from './ServeSchedule';
import { SessionDetails } from './SessionDetails';
import { PickupNotifications } from './PickupNotifications';
import { ServeSettings } from './ServeSettings';
import { BottomTabBar } from './BottomTabBar';
import { PathWayBadge } from './PathWayBadge';

// Mock data types
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

interface Child {
  id: string;
  name: string;
  ageGroup: string;
  photo?: string;
  hasPhotoConsent: boolean;
  attendanceStatus: 'present' | 'absent' | 'late' | 'not-marked';
  notes?: string;
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

interface ServeSpaceProps {
  onBack: () => void;
}

export function ServeSpace({ onBack }: ServeSpaceProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const userName = 'Sarah';
  const currentUserId = 'volunteer-1';

  // Mock data
  const [todaySessions] = useState<TodaySession[]>([
    {
      id: 'session-1',
      title: 'Sunday Kids',
      ageGroup: 'Ages 4-6',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Rainbow Room',
      childrenCount: 12,
      attendanceStatus: 'not-started',
      role: 'lead',
      hasUnsynced: false
    },
    {
      id: 'session-2',
      title: 'Little Explorers',
      ageGroup: 'Ages 2-3',
      startTime: '11:00',
      endTime: '12:00',
      room: 'Blue Room',
      childrenCount: 8,
      attendanceStatus: 'completed',
      role: 'assistant',
      hasUnsynced: true
    }
  ]);

  const [scheduleSessions] = useState<ScheduleSession[]>([
    {
      id: 'session-1',
      title: 'Sunday Kids',
      date: '2024-12-15',
      startTime: '09:00',
      endTime: '10:30',
      ageGroup: 'Ages 4-6',
      room: 'Rainbow Room',
      teachers: [
        { id: 'teacher-1', name: 'Sarah', role: 'lead' },
        { id: 'teacher-2', name: 'Mike', role: 'assistant' }
      ],
      childrenCount: 12,
      userRole: 'lead',
      isUserAvailable: true,
      canRequestSwap: false,
      status: 'confirmed'
    },
    {
      id: 'session-3',
      title: 'Youth Group',
      date: '2024-12-16',
      startTime: '18:00',
      endTime: '19:30',
      ageGroup: 'Ages 12-16',
      room: 'Main Hall',
      teachers: [
        { id: 'teacher-3', name: 'Emma', role: 'lead' },
        { id: 'teacher-1', name: 'Sarah', role: 'helper' }
      ],
      childrenCount: 15,
      userRole: 'helper',
      isUserAvailable: false,
      canRequestSwap: true,
      status: 'pending'
    },
    {
      id: 'session-4',
      title: 'Little Ones',
      date: '2024-12-17',
      startTime: '10:00',
      endTime: '11:00',
      ageGroup: 'Ages 1-2',
      room: 'Nursery',
      teachers: [
        { id: 'teacher-1', name: 'Sarah', role: 'lead' },
        { id: 'teacher-4', name: 'Lisa', role: 'assistant' }
      ],
      childrenCount: 6,
      userRole: 'lead',
      isUserAvailable: true,
      canRequestSwap: false,
      status: 'confirmed'
    }
  ]);

  const [sessionDetails] = useState<SessionInfo>({
    id: 'session-1',
    title: 'Sunday Kids',
    date: '2024-12-15',
    startTime: '09:00',
    endTime: '10:30',
    ageGroup: 'Ages 4-6',
    room: 'Rainbow Room',
    teachers: [
      { id: 'teacher-1', name: 'Sarah', role: 'lead' },
      { id: 'teacher-2', name: 'Mike', role: 'assistant' }
    ],
    children: [
      {
        id: 'child-1',
        name: 'Emma Wilson',
        ageGroup: 'Age 5',
        hasPhotoConsent: true,
        attendanceStatus: 'present'
      },
      {
        id: 'child-2',
        name: 'Lucas Brown',
        ageGroup: 'Age 4',
        hasPhotoConsent: false,
        attendanceStatus: 'late'
      },
      {
        id: 'child-3',
        name: 'Sophia Davis',
        ageGroup: 'Age 6',
        hasPhotoConsent: true,
        attendanceStatus: 'not-marked'
      },
      {
        id: 'child-4',
        name: 'Oliver Johnson',
        ageGroup: 'Age 5',
        hasPhotoConsent: true,
        attendanceStatus: 'absent'
      }
    ],
    hasUnsynced: true,
    userRole: 'lead'
  });

  const [pickupNotifications] = useState<PickupNotification[]>([
    {
      id: 'pickup-1',
      childId: 'child-1',
      childName: 'Emma Wilson',
      parentName: 'Jennifer Wilson',
      parentPhone: '+1234567890',
      pickupTime: '2024-12-15T10:30:00',
      status: 'waiting',
      urgencyLevel: 'normal',
      sessionName: 'Sunday Kids',
      room: 'Rainbow Room',
      hasPhotoConsent: true
    },
    {
      id: 'pickup-2',
      childId: 'child-2',
      childName: 'Lucas Brown',
      parentName: 'Michael Brown',
      parentPhone: '+1234567891',
      pickupTime: '2024-12-15T10:15:00',
      actualTime: '2024-12-15T10:45:00',
      status: 'overdue',
      urgencyLevel: 'urgent',
      sessionName: 'Sunday Kids',
      room: 'Rainbow Room',
      notes: 'Parent running late due to traffic',
      hasPhotoConsent: false
    },
    {
      id: 'pickup-3',
      childId: 'child-3',
      childName: 'Sophia Davis',
      parentName: 'Anna Davis',
      pickupTime: '2024-12-15T10:30:00',
      actualTime: '2024-12-15T10:25:00',
      status: 'completed',
      urgencyLevel: 'normal',
      sessionName: 'Sunday Kids',
      room: 'Rainbow Room',
      hasPhotoConsent: true
    }
  ]);

  const [volunteerSettings, setVolunteerSettings] = useState<VolunteerSettings>({
    emailNotifications: true,
    pushNotifications: true,
    scheduleReminders: true,
    pickupAlerts: true,
    sessionUpdates: true,
    lastMinuteChanges: true,
    availability: 'weekends',
    autoAcceptSimilar: false
  });

  const [positiveNotes] = useState([
    {
      id: 'note-1',
      childId: 'child-1',
      note: 'Emma showed wonderful leadership skills today by helping younger children with their craft project.',
      status: 'pending' as const,
      createdAt: '2024-12-15T09:30:00'
    },
    {
      id: 'note-2',
      childId: 'child-2',
      note: 'Lucas was very attentive during story time and asked thoughtful questions.',
      status: 'approved' as const,
      createdAt: '2024-12-15T09:45:00'
    }
  ]);

  const [concerns] = useState([
    {
      id: 'concern-1',
      childId: 'child-4',
      concern: 'Oliver seemed upset when his parent left. Took extra time to settle in.',
      severity: 'low' as const,
      status: 'open' as const,
      createdAt: '2024-12-15T09:15:00'
    }
  ]);

  // Handlers
  const handleTakeAttendance = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleViewSchedule = () => {
    setActiveTab('schedule');
  };

  const handleViewPickups = () => {
    setActiveTab('pickups');
  };

  const handleToggleAvailability = (sessionId: string, available: boolean) => {
    console.log(`Toggle availability for session ${sessionId}: ${available}`);
    // Update session availability
  };

  const handleRequestSwap = (sessionId: string) => {
    alert(`Swap request sent for session ${sessionId}`);
  };

  const handleUpdateAttendance = (childId: string, status: 'present' | 'absent' | 'late') => {
    console.log(`Update attendance for child ${childId}: ${status}`);
    // Update child attendance status
  };

  const handleAddPositiveNote = (childId: string, note: string) => {
    console.log(`Add positive note for child ${childId}: ${note}`);
    // Add new positive note
  };

  const handleAddConcern = (childId: string, concern: string, severity: 'low' | 'medium' | 'high') => {
    console.log(`Add concern for child ${childId}: ${concern} (${severity})`);
    // Add new concern
  };

  const handleSyncData = () => {
    alert('Syncing data...');
    // Sync unsynced data
  };

  const handleCompletePickup = (notificationId: string) => {
    console.log(`Complete pickup: ${notificationId}`);
    // Mark pickup as completed
  };

  const handleStartPickup = (notificationId: string) => {
    console.log(`Start pickup: ${notificationId}`);
    // Mark pickup as in progress
  };

  const handleCallParent = (parentPhone: string) => {
    window.open(`tel:${parentPhone}`, '_self');
  };

  const handleSendMessage = (notificationId: string) => {
    alert(`Send message for notification: ${notificationId}`);
    // Open messaging interface
  };

  const handleUpdateVolunteerSettings = (updates: Partial<VolunteerSettings>) => {
    setVolunteerSettings(prev => ({ ...prev, ...updates }));
  };

  // Get the current view based on state
  const getCurrentView = () => {
    // If viewing a specific session
    if (selectedSessionId) {
      return (
        <SessionDetails
          session={sessionDetails}
          positiveNotes={positiveNotes}
          concerns={concerns}
          onBack={() => setSelectedSessionId(null)}
          onUpdateAttendance={handleUpdateAttendance}
          onAddPositiveNote={handleAddPositiveNote}
          onAddConcern={handleAddConcern}
          onSyncData={handleSyncData}
        />
      );
    }

    // Main tab views
    switch (activeTab) {
      case 'dashboard':
        return (
          <ServeDashboard
            todaySessions={todaySessions}
            pickupNotifications={pickupNotifications.filter(p => p.status !== 'completed')}
            userName={userName}
            onTakeAttendance={handleTakeAttendance}
            onViewPickups={handleViewPickups}
            onViewSession={handleViewSession}
            onViewSchedule={handleViewSchedule}
          />
        );
      case 'schedule':
        return (
          <ServeSchedule
            sessions={scheduleSessions}
            currentUserId={currentUserId}
            viewMode={viewMode}
            onViewSession={handleViewSession}
            onToggleAvailability={handleToggleAvailability}
            onRequestSwap={handleRequestSwap}
            onViewModeChange={setViewMode}
          />
        );
      case 'pickups':
        return (
          <PickupNotifications
            notifications={pickupNotifications}
            onCompletePickup={handleCompletePickup}
            onStartPickup={handleStartPickup}
            onCallParent={handleCallParent}
            onSendMessage={handleSendMessage}
          />
        );
      case 'settings':
        return (
          <ServeSettings
            settings={volunteerSettings}
            onUpdateSettings={handleUpdateVolunteerSettings}
          />
        );
      default:
        return (
          <ServeDashboard
            todaySessions={todaySessions}
            pickupNotifications={pickupNotifications.filter(p => p.status !== 'completed')}
            userName={userName}
            onTakeAttendance={handleTakeAttendance}
            onViewPickups={handleViewPickups}
            onViewSession={handleViewSession}
            onViewSchedule={handleViewSchedule}
          />
        );
    }
  };

  return (
    <div className="min-h-screen pb-36" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Header */}
      <div className="p-4 sm:p-6" style={{ backgroundColor: '#76D7C4' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={pathwayLogo} alt="PathWay" className="w-10 h-10" />
            <h1 style={{ 
              fontFamily: 'Nunito, sans-serif', 
              fontWeight: 700,
              fontSize: '1.5rem',
              color: '#333333'
            }}>
              Serve Space
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <PathWayBadge 
              status={todaySessions.some(s => s.hasUnsynced) || pickupNotifications.some(p => p.urgencyLevel === 'urgent') ? 'unsynced' : 'online'} 
              showLabel={false}
            />
            <button
              onClick={onBack}
              className="transition-colors duration-200 hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-full"
              style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333',
                backgroundColor: 'transparent',
                border: 'none'
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <motion.div
          key={`${activeTab}-${selectedSessionId}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {getCurrentView()}
        </motion.div>
      </div>

      {/* Bottom Tab Bar - Hide when viewing individual sessions */}
      {!selectedSessionId && (
        <BottomTabBar
          context="serve"
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}