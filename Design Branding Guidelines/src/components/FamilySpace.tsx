import { useState } from 'react';
import { motion } from 'motion/react';
import pathwayLogo from 'figma:asset/ed0d7c9c9507ef7eeb63f93b164e16b201ba64a9.png';
import { FamilyDashboard } from './FamilyDashboard';
import { ChildProfile } from './ChildProfile';
import { NoticesList } from './NoticesList';
import { NoticeDetail } from './NoticeDetail';
import { FamilySettings } from './FamilySettings';
import { BottomTabBar } from './BottomTabBar';
import { PathWayBadge } from './PathWayBadge';

// Mock data types
interface Child {
  id: string;
  name: string;
  ageGroup: string;
  photo?: string;
  photoConsent: boolean;
  attendanceHistory: Array<{
    date: string;
    status: 'present' | 'absent' | 'late';
    notes?: string;
  }>;
  positiveNotes: Array<{
    id: string;
    date: string;
    teacher: string;
    note: string;
    approved: boolean;
  }>;
}

interface Notice {
  id: string;
  title: string;
  preview: string;
  content: string;
  date: string;
  urgent: boolean;
  category: 'general' | 'event' | 'safety' | 'reminder';
  read: boolean;
  author: string;
  targetAgeGroups: string[];
  expiryDate?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  attendanceUpdates: boolean;
  eventReminders: boolean;
  positiveNotes: boolean;
  urgentAlerts: boolean;
}

interface FamilySpaceProps {
  onBack: () => void;
}

export function FamilySpace({ onBack }: FamilySpaceProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  // Mock data
  const [children, setChildren] = useState<Child[]>([
    {
      id: 'child-1',
      name: 'Emma Johnson',
      ageGroup: 'Ages 4-5',
      photoConsent: true,
      attendanceHistory: [
        { date: 'Dec 15, 2024', status: 'present' },
        { date: 'Dec 14, 2024', status: 'present' },
        { date: 'Dec 13, 2024', status: 'late', notes: 'Traffic delay' },
        { date: 'Dec 12, 2024', status: 'present' },
        { date: 'Dec 11, 2024', status: 'absent', notes: 'Sick day' },
        { date: 'Dec 8, 2024', status: 'present' },
        { date: 'Dec 7, 2024', status: 'present' },
        { date: 'Dec 6, 2024', status: 'present' },
        { date: 'Dec 5, 2024', status: 'present' },
        { date: 'Dec 4, 2024', status: 'present' }
      ],
      positiveNotes: [
        {
          id: 'note-1',
          date: 'Dec 14, 2024',
          teacher: 'Ms. Sarah',
          note: 'Emma showed wonderful kindness today by helping a new friend feel welcome during playtime.',
          approved: true
        },
        {
          id: 'note-2',
          date: 'Dec 10, 2024',
          teacher: 'Mr. Tom',
          note: 'Great creativity during art time! Emma made a beautiful painting and explained her story behind it.',
          approved: true
        }
      ]
    },
    {
      id: 'child-2',
      name: 'Lucas Johnson',
      ageGroup: 'Ages 6-7',
      photoConsent: false,
      attendanceHistory: [
        { date: 'Dec 15, 2024', status: 'present' },
        { date: 'Dec 14, 2024', status: 'present' },
        { date: 'Dec 13, 2024', status: 'present' },
        { date: 'Dec 12, 2024', status: 'present' },
        { date: 'Dec 11, 2024', status: 'present' },
        { date: 'Dec 8, 2024', status: 'present' },
        { date: 'Dec 7, 2024', status: 'present' },
        { date: 'Dec 6, 2024', status: 'present' },
        { date: 'Dec 5, 2024', status: 'present' },
        { date: 'Dec 4, 2024', status: 'present' }
      ],
      positiveNotes: [
        {
          id: 'note-3',
          date: 'Dec 13, 2024',
          teacher: 'Ms. Kate',
          note: 'Lucas demonstrated excellent problem-solving skills during our building challenge today!',
          approved: true
        }
      ]
    }
  ]);

  const [notices, setNotices] = useState<Notice[]>([
    {
      id: 'notice-1',
      title: 'Holiday Schedule Update',
      preview: 'Please note the updated schedule for the holiday period...',
      content: `Dear Families,

We hope this message finds you well. We want to inform you of some important updates to our holiday schedule:

🎄 Christmas Week (Dec 23-27)
- Closed December 24-25 (Christmas Eve and Christmas Day)
- Limited hours December 23, 26-27 (8:00 AM - 3:00 PM)

🎊 New Year's Week (Dec 30 - Jan 3)
- Closed January 1 (New Year's Day)
- Regular hours all other days

We appreciate your understanding and wish you a wonderful holiday season with your families.

If you have any questions about the schedule, please don't hesitate to contact our office.

Warm regards,
The PathWay Team`,
      date: 'Dec 15, 2024',
      urgent: false,
      category: 'general',
      read: false,
      author: 'PathWay Administration',
      targetAgeGroups: ['All Ages']
    },
    {
      id: 'notice-2',
      title: 'Safety Drill Next Week',
      preview: 'We will be conducting a fire safety drill on Tuesday...',
      content: `Important Safety Notice

We will be conducting a fire safety drill next Tuesday, December 19th at 10:30 AM.

What to expect:
• Fire alarm will sound for approximately 2 minutes
• All children and staff will practice our evacuation procedures
• Normal activities will resume afterward

Please ensure your child knows this is just practice and there's no need to worry. Our staff are well-trained and will ensure all children feel safe and supported during the drill.

If you have any concerns or questions about our safety procedures, please reach out to us.

Thank you for your cooperation in keeping everyone safe.`,
      date: 'Dec 14, 2024',
      urgent: true,
      category: 'safety',
      read: true,
      author: 'Safety Coordinator',
      targetAgeGroups: ['All Ages'],
      expiryDate: 'Dec 19, 2024'
    },
    {
      id: 'notice-3',
      title: 'Winter Art Exhibition',
      preview: 'Join us for a showcase of your children\'s winter artwork...',
      content: `You're Invited! Winter Art Exhibition

We're excited to invite you to our Winter Art Exhibition featuring beautiful artwork created by all our children.

📅 When: Friday, December 22nd, 2:00 PM - 4:00 PM
📍 Where: Main Hall
🎨 What: Display of winter-themed artwork, crafts, and projects

This is a wonderful opportunity to:
• See your child's creative work displayed
• Meet other families
• Celebrate the children's artistic achievements
• Enjoy light refreshments

Each child will have at least one piece in the exhibition, and we'll have name tags so you can easily find your child's work.

We can't wait to share these creative masterpieces with you!

RSVP appreciated but not required.`,
      date: 'Dec 12, 2024',
      urgent: false,
      category: 'event',
      read: false,
      author: 'Art Teacher',
      targetAgeGroups: ['Ages 3-4', 'Ages 4-5', 'Ages 6-7']
    }
  ]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    attendanceUpdates: true,
    eventReminders: true,
    positiveNotes: true,
    urgentAlerts: true
  });

  // Add hasNewNotices property to children
  const childrenWithNotices = children.map(child => ({
    ...child,
    hasNewNotices: notices.some(notice => 
      !notice.read && 
      (notice.targetAgeGroups.includes('All Ages') || notice.targetAgeGroups.includes(child.ageGroup))
    ),
    attendanceRate: Math.round(
      (child.attendanceHistory.filter(record => record.status === 'present').length / 
       child.attendanceHistory.length) * 100
    ),
    lastAttendance: child.attendanceHistory[0]?.date || 'No records'
  }));

  // Recent notices for dashboard
  const recentNotices = notices
    .filter(notice => !notice.read || notice.urgent)
    .slice(0, 3)
    .map(notice => ({
      id: notice.id,
      title: notice.title,
      date: notice.date,
      urgent: notice.urgent
    }));

  // Handlers
  const handleUpdatePhotoConsent = (childId: string, consent: boolean) => {
    setChildren(prev => prev.map(child => 
      child.id === childId ? { ...child, photoConsent: consent } : child
    ));
  };

  const handleUpdateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }));
  };

  const handleMarkNoticeAsRead = (noticeId: string) => {
    setNotices(prev => prev.map(notice => 
      notice.id === noticeId ? { ...notice, read: true } : notice
    ));
  };

  const handleExportData = () => {
    const dataToExport = {
      children: children.map(child => ({
        name: child.name,
        ageGroup: child.ageGroup,
        photoConsent: child.photoConsent,
        attendanceRecords: child.attendanceHistory.length,
        positiveNotes: child.positiveNotes.length
      })),
      notificationSettings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pathway-family-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    alert('Account deletion initiated. You will receive a confirmation email within 24 hours.');
  };

  // Get the current view based on state
  const getCurrentView = () => {
    // If viewing a specific child profile
    if (selectedChildId) {
      const child = children.find(c => c.id === selectedChildId);
      if (child) {
        return (
          <ChildProfile
            child={child}
            onBack={() => setSelectedChildId(null)}
            onUpdatePhotoConsent={handleUpdatePhotoConsent}
          />
        );
      }
    }

    // If viewing a specific notice
    if (selectedNoticeId) {
      const notice = notices.find(n => n.id === selectedNoticeId);
      if (notice) {
        return (
          <NoticeDetail
            notice={notice}
            onBack={() => setSelectedNoticeId(null)}
            onMarkAsRead={handleMarkNoticeAsRead}
          />
        );
      }
    }

    // Main tab views
    switch (activeTab) {
      case 'dashboard':
        return (
          <FamilyDashboard
            children={childrenWithNotices}
            recentNotices={recentNotices}
            onSelectChild={setSelectedChildId}
            onViewAllNotices={() => setActiveTab('notices')}
          />
        );
      case 'notices':
        return (
          <NoticesList
            notices={notices}
            onSelectNotice={setSelectedNoticeId}
          />
        );
      case 'settings':
        return (
          <FamilySettings
            children={children}
            notificationSettings={notificationSettings}
            onUpdatePhotoConsent={handleUpdatePhotoConsent}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            onExportData={handleExportData}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      default:
        return (
          <FamilyDashboard
            children={childrenWithNotices}
            recentNotices={recentNotices}
            onSelectChild={setSelectedChildId}
            onViewAllNotices={() => setActiveTab('notices')}
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
              Family Space
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <PathWayBadge 
              status={notices.some(n => !n.read) ? 'unsynced' : 'synced'} 
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
          key={`${activeTab}-${selectedChildId}-${selectedNoticeId}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {getCurrentView()}
        </motion.div>
      </div>

      {/* Bottom Tab Bar - Hide when viewing individual items */}
      {!selectedChildId && !selectedNoticeId && (
        <BottomTabBar
          context="family"
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}