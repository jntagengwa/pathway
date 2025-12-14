import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import pathwayLogo from 'figma:asset/ed0d7c9c9507ef7eeb63f93b164e16b201ba64a9.png';
import { PathWayButton } from './components/PathWayButton';
import { PathWayCard } from './components/PathWayCard';
import { PathWayBadge } from './components/PathWayBadge';
import { PathWayInput } from './components/PathWayInput';
import { PathWayToggle } from './components/PathWayToggle';
import { BottomTabBar } from './components/BottomTabBar';
import { PathWayMotif } from './components/PathWayMotif';
import { PathWayThemeProvider } from './components/PathWayTheme';
import { EmptyState } from './components/EmptyState';
import { QRScanScreen } from './components/QRScanScreen';
import { SignUpQRScreen } from './components/SignUpQRScreen';
import { LoginScreen } from './components/LoginScreen';
import { RoleSpaceSelector } from './components/RoleSpaceSelector';
import { FamilySpace } from './components/FamilySpace';
import { ServeSpace } from './components/ServeSpace';
import { UploadLessonScreen } from './components/UploadLessonScreen';
import { LessonsBrowseScreen } from './components/LessonsBrowseScreen';

export default function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: false,
    dataSharing: true
  });
  const [activeTab, setActiveTab] = useState('home');
  const [context, setContext] = useState<'family' | 'serve'>('family');
  const [showQRScan, setShowQRScan] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showFamilySpace, setShowFamilySpace] = useState(false);
  const [showServeSpace, setShowServeSpace] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUpQR, setShowSignUpQR] = useState(false);
  const [showUploadLesson, setShowUploadLesson] = useState(false);
  const [showLessonsBrowse, setShowLessonsBrowse] = useState(false);
  const [hasChildRegistered, setHasChildRegistered] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);

  if (!showDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-8 md:px-12" style={{ backgroundColor: '#B8E6D9' }}>
        <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto">
          {/* Logo with animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              type: "spring", 
              bounce: 0.3 
            }}
            className="mb-8"
          >
            <div className="relative group cursor-pointer">
              <img 
                src={pathwayLogo} 
                alt="PathWay Logo" 
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mx-auto transition-all duration-300 group-hover:scale-105"
                style={{ 
                  filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.1))',
                  backgroundColor: 'transparent'
                }}
              />
              {/* Hover shadow below logo */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 w-24 h-4 rounded-full opacity-0 group-hover:opacity-30 transition-all duration-300"
                style={{ 
                  backgroundColor: '#333333',
                  bottom: '-8px',
                  filter: 'blur(8px)'
                }}
              />
            </div>
          </motion.div>

          {/* App Name */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6"
          >
            <h1 className="mb-2 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#333333]" style={{ 
              fontFamily: 'Nunito, sans-serif',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              PathWay
            </h1>
            <p className="mb-6 sm:mb-8 md:mb-10 text-base sm:text-lg md:text-xl lg:text-2xl text-[#333333] opacity-80" style={{ 
              fontFamily: 'Quicksand, sans-serif'
            }}>
              Every step together
            </p>
          </motion.div>

          {/* PathWay Motif */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-6 sm:mb-8 md:mb-10"
          >
            <PathWayMotif 
              variant="stepping-stones"
              context="family"
              size="medium"
              animated
            />
          </motion.div>

          {/* Get Started Button */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="space-y-4"
          >
            <PathWayButton 
              variant="primary"
              size="large"
              onClick={() => setShowRoleSelector(true)}
              className="w-full sm:w-auto md:min-w-[200px]"
            >
              Get Started
            </PathWayButton>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6 sm:justify-center">
              <PathWayButton 
                variant="white"
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto md:min-w-[140px]"
              >
                Login
              </PathWayButton>
              
              <PathWayButton 
                variant="white"
                onClick={() => setShowDemo(true)}
                className="w-full sm:w-auto md:min-w-[140px]"
              >
                UI Demo
              </PathWayButton>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Handle QR scan success
  const handleQRScanSuccess = (data: string) => {
    setShowQRScan(false);
    setHasChildRegistered(true);
    alert(`Successfully scanned: ${data}\n\nChild registered! Welcome to your community!`);
  };

  // Handle role space selection
  const handleRoleSpaceSelect = (space: 'family' | 'serve') => {
    setContext(space);
    setShowRoleSelector(false);
    
    if (space === 'family') {
      setShowFamilySpace(true);
    } else {
      setShowServeSpace(true);
    }
  };

  // Handle register child
  const handleRegisterChild = () => {
    setShowRoleSelector(false);
    setShowQRScan(true);
  };

  // Handle become volunteer
  const handleBecomeVolunteer = () => {
    setIsVolunteer(true);
    alert('Welcome to the volunteer team! You can now access Serve Space.');
  };

  // Handle settings
  const handleSettings = () => {
    alert('Settings panel would open here');
  };

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    // Simulate login process
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowLogin(false);
    setShowRoleSelector(true);
    alert(`Successfully logged in as ${email}!`);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    alert('Password reset link would be sent to your email.');
  };

  // Handle sign up (leads to QR scan)
  const handleSignUp = () => {
    setShowLogin(false);
    setShowSignUpQR(true);
  };

  // Handle create account (same as sign up)
  const handleCreateAccount = () => {
    setShowLogin(false);
    setShowSignUpQR(true);
  };

  // Handle signup QR scan success
  const handleSignUpQRSuccess = (data: string) => {
    setShowSignUpQR(false);
    setHasChildRegistered(true);
    setShowRoleSelector(true);
    alert(`Welcome to PathWay!\n\n${data}\n\nYour account has been created and your child has been registered.`);
  };

  // Show login screen if requested
  if (showLogin) {
    return (
      <LoginScreen
        pathwayLogo={pathwayLogo}
        onBack={() => setShowLogin(false)}
        onLogin={handleLogin}
        onForgotPassword={handleForgotPassword}
        onSignUp={handleSignUp}
        onCreateAccount={handleCreateAccount}
      />
    );
  }

  // Show sign up QR scan screen if requested
  if (showSignUpQR) {
    return (
      <SignUpQRScreen
        onClose={() => setShowSignUpQR(false)}
        onScanSuccess={handleSignUpQRSuccess}
      />
    );
  }

  // Show QR scan screen if requested
  if (showQRScan) {
    return (
      <QRScanScreen
        onClose={() => setShowQRScan(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    );
  }

  // Show role space selector if requested
  if (showRoleSelector) {
    return (
      <RoleSpaceSelector
        hasChildRegistered={hasChildRegistered}
        isVolunteer={isVolunteer}
        onSelectSpace={handleRoleSpaceSelect}
        onRegisterChild={handleRegisterChild}
        onBecomeVolunteer={handleBecomeVolunteer}
        onSettings={handleSettings}
      />
    );
  }

  // Show Family Space if requested
  if (showFamilySpace) {
    return (
      <FamilySpace
        onBack={() => setShowFamilySpace(false)}
      />
    );
  }

  // Show Serve Space if requested
  if (showServeSpace) {
    return (
      <ServeSpace
        onBack={() => setShowServeSpace(false)}
      />
    );
  }

  // Show Upload Lesson Screen if requested
  if (showUploadLesson) {
    return (
      <UploadLessonScreen
        onBack={() => setShowUploadLesson(false)}
        onClose={() => setShowUploadLesson(false)}
      />
    );
  }

  // Show Lessons Browse Screen if requested
  if (showLessonsBrowse) {
    return (
      <LessonsBrowseScreen
        onBack={() => setShowLessonsBrowse(false)}
        onUploadLesson={() => {
          setShowLessonsBrowse(false);
          setShowUploadLesson(true);
        }}
      />
    );
  }

  return (
    <PathWayThemeProvider context={context}>
      <div className="min-h-screen pb-20 sm:pb-24 md:pb-32" style={{ backgroundColor: '#F5F5F5' }}>
        {/* Header */}
        <div className="p-4 sm:p-6 md:p-8" style={{ backgroundColor: '#76D7C4' }}>
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto">
            <div className="flex items-center space-x-3 md:space-x-4">
              <img src={pathwayLogo} alt="PathWay" className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#333333]" style={{ 
                fontFamily: 'Nunito, sans-serif'
              }}>
                PathWay UI Components
              </h1>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6">
              <div 
                className="px-3 py-1 md:px-4 md:py-2 rounded-full text-sm md:text-base"
                style={{
                  backgroundColor: context === 'family' ? '#FFD166' : '#4DA9E5',
                  color: '#333333',
                  fontFamily: 'Quicksand, sans-serif',
                  fontWeight: 600
                }}
              >
                {context === 'family' ? 'Family' : 'Serve'}
              </div>
              <PathWayBadge status="online" showLabel />
            </div>
          </div>
        </div>

      <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 max-w-4xl xl:max-w-6xl mx-auto">
        {/* Buttons Section */}
        <PathWayCard>
          <h2 className="mb-4 sm:mb-6 md:mb-8">Buttons</h2>
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 md:gap-6 sm:justify-center">
              <PathWayButton variant="primary">Primary Button</PathWayButton>
              <PathWayButton variant="secondary">Secondary Button</PathWayButton>
              <PathWayButton variant="white">White Button</PathWayButton>
              <PathWayButton disabled>Disabled Button</PathWayButton>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 md:gap-6 sm:justify-center">
              <PathWayButton size="small">Small</PathWayButton>
              <PathWayButton size="medium">Medium</PathWayButton>
              <PathWayButton size="large">Large</PathWayButton>
            </div>
          </div>
        </PathWayCard>

        {/* Cards Section */}
        <PathWayCard>
          <h2 className="mb-4 sm:mb-6 md:mb-8">Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <PathWayCard hoverable>
              <h3 className="mb-2">Hoverable Card</h3>
              <p>This card has hover effects and can be interactive.</p>
              <div className="mt-3 flex space-x-2">
                <PathWayBadge status="synced" />
                <PathWayBadge status="online" />
              </div>
            </PathWayCard>
            <PathWayCard>
              <h3 className="mb-2">Regular Card</h3>
              <p>This is a standard card with subtle shadows and rounded edges.</p>
              <div className="mt-3 flex space-x-2">
                <PathWayBadge status="unsynced" />
                <PathWayBadge status="offline" />
              </div>
            </PathWayCard>
          </div>
        </PathWayCard>

        {/* Badges Section */}
        <PathWayCard>
          <h2 className="mb-4 sm:mb-6">Status Badges</h2>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <PathWayBadge status="online" showLabel />
              <PathWayBadge status="offline" showLabel />
              <PathWayBadge status="synced" showLabel />
              <PathWayBadge status="unsynced" showLabel />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-sm sm:text-base font-medium">Small badges:</span>
              <div className="flex items-center space-x-3 sm:space-x-4">
                <PathWayBadge status="online" size="small" />
                <PathWayBadge status="offline" size="small" />
                <PathWayBadge status="synced" size="small" />
                <PathWayBadge status="unsynced" size="small" />
              </div>
            </div>
          </div>
        </PathWayCard>

        {/* Form Elements */}
        <PathWayCard>
          <h2 className="mb-4 sm:mb-6 md:mb-8">Form Elements</h2>
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <PathWayInput
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                required
              />
              <PathWayInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                required
              />
            </div>
            
            <div className="space-y-4">
              <PathWayToggle
                label="Push Notifications"
                description="Receive notifications about important updates and reminders"
                checked={formData.notifications}
                onChange={(checked) => setFormData(prev => ({ ...prev, notifications: checked }))}
              />
              
              <PathWayToggle
                label="Data Sharing Consent"
                description="Allow sharing of anonymized data to improve services"
                checked={formData.dataSharing}
                onChange={(checked) => setFormData(prev => ({ ...prev, dataSharing: checked }))}
              />
            </div>

            <PathWayButton variant="primary">
              Save Preferences
            </PathWayButton>
          </div>
        </PathWayCard>

        {/* Context Switching with Visual Motifs */}
        <PathWayCard>
          <h2 className="mb-4">Navigation Context & Visual Motifs</h2>
          
          {/* Context Toggle */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6 sm:mb-8">
            <PathWayButton 
              variant={context === 'family' ? 'primary' : 'white'}
              onClick={() => setContext('family')}
              style={context === 'family' ? { backgroundColor: '#FFD166' } : {}}
            >
              Family Space
            </PathWayButton>
            <PathWayButton 
              variant={context === 'serve' ? 'primary' : 'white'}
              onClick={() => setContext('serve')}
              style={context === 'serve' ? { backgroundColor: '#4DA9E5' } : {}}
            >
              Serve Space
            </PathWayButton>
          </div>

          {/* Visual Motifs Demo */}
          <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
            <div>
              <h4 className="mb-3" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#333333'
              }}>
                Stepping Stones Motif
              </h4>
              <PathWayMotif 
                variant="stepping-stones"
                context={context}
                size="large"
                animated
              />
            </div>
            
            <div>
              <h4 className="mb-3" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#333333'
              }}>
                Curved Path Motif
              </h4>
              <PathWayMotif 
                variant="curved-path"
                context={context}
                size="large"
                animated
              />
            </div>
          </div>
          
          <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#F8F9FA' }}>
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif', 
              color: '#666666',
              fontSize: '0.875rem'
            }}>
              <strong>Color Coding:</strong> 
              {context === 'family' 
                ? ' Family Space uses warmer tones (mint + yellow)' 
                : ' Serve Space uses cooler tones (mint + blue)'
              }
            </p>
          </div>
          
          <p style={{ 
            fontFamily: 'Quicksand, sans-serif', 
            color: '#666666',
            fontSize: '0.875rem'
          }}>
            The bottom tab bar, visual motifs, and accent colors change based on the selected context. 
            These visual elements help users understand their current space while maintaining the journey metaphor.
          </p>
        </PathWayCard>

        {/* Empty State Demo */}
        <PathWayCard>
          <h2 className="mb-4">Empty States with Visual Motifs</h2>
          <EmptyState
            title={context === 'family' ? 'Start Your Family Journey' : 'Begin Your Service Path'}
            description={context === 'family' 
              ? 'Create meaningful connections and shared experiences with your loved ones.' 
              : 'Discover opportunities to serve your community and make a difference.'
            }
            actionText="Get Started"
            onAction={() => alert(`Starting ${context} journey!`)}
            variant={context === 'family' ? 'stepping-stones' : 'curved-path'}
          />
        </PathWayCard>

        {/* Back Button Demo */}
        <PathWayCard>
          <h2 className="mb-4">Back Button Demo</h2>
          <div className="space-y-4">
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif', 
              color: '#666666'
            }}>
              Testing the back button with arrow icon visibility:
            </p>
            
            <div className="flex items-center space-x-4">
              <PathWayButton
                variant="white"
                onClick={() => alert('Back button clicked!')}
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
              
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif', 
                color: '#666666'
              }}>
                ← This should show a back arrow icon
              </span>
            </div>
          </div>
        </PathWayCard>

        {/* QR Scan Demo */}
        <PathWayCard>
          <h2 className="mb-4">QR Code Scanning</h2>
          <div className="space-y-4">
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif', 
              color: '#666666'
            }}>
              Parents can scan their organization's QR code to register their child and connect with their community.
            </p>
            
            <PathWayButton 
              variant="primary"
              onClick={() => setShowQRScan(true)}
            >
              Demo QR Scan
            </PathWayButton>
          </div>
        </PathWayCard>

        {/* Navigation */}
        <PathWayCard className="text-center space-y-4 md:space-y-6">
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4 md:gap-6 justify-center flex-wrap">
            <PathWayButton 
              variant="primary" 
              onClick={() => setShowLogin(true)}
              style={{ backgroundColor: '#4DA9E5', color: '#FFFFFF' }}
            >
              Login Screen Demo
            </PathWayButton>
            
            <PathWayButton 
              variant="secondary" 
              onClick={() => setShowRoleSelector(true)}
            >
              ← Role Selector
            </PathWayButton>
            
            <PathWayButton 
              variant="primary" 
              onClick={() => setShowFamilySpace(true)}
              style={{ backgroundColor: '#FFD166' }}
            >
              Family Space Demo
            </PathWayButton>
            
            <PathWayButton 
              variant="primary" 
              onClick={() => setShowServeSpace(true)}
              style={{ backgroundColor: '#4DA9E5', color: '#FFFFFF' }}
            >
              Serve Space Demo
            </PathWayButton>
            
            <PathWayButton 
              variant="primary" 
              onClick={() => setShowUploadLesson(true)}
              style={{ backgroundColor: '#76D7C4', color: '#333333' }}
            >
              Upload Lesson Demo
            </PathWayButton>
            
            <PathWayButton 
              variant="primary" 
              onClick={() => setShowLessonsBrowse(true)}
              style={{ backgroundColor: '#4DA9E5', color: '#FFFFFF' }}
            >
              Browse Lessons Demo
            </PathWayButton>
            
            <PathWayButton 
              variant="secondary" 
              onClick={() => setShowDemo(false)}
            >
              ← Splash Screen
            </PathWayButton>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.875rem',
              color: '#666666'
            }}>
              Demo State: {hasChildRegistered ? '✅ Child Registered' : '❌ No Child'} | 
              {isVolunteer ? ' ✅ Volunteer' : ' ❌ Not Volunteer'}
            </p>
            <div className="flex gap-2 mt-2 justify-center">
              <PathWayButton 
                variant="white"
                size="small"
                onClick={() => setHasChildRegistered(!hasChildRegistered)}
              >
                Toggle Child
              </PathWayButton>
              <PathWayButton 
                variant="white"
                size="small"
                onClick={() => setIsVolunteer(!isVolunteer)}
              >
                Toggle Volunteer
              </PathWayButton>
            </div>
          </div>
        </PathWayCard>
      </div>

        {/* Bottom Tab Bar */}
        <BottomTabBar
          context={context}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </PathWayThemeProvider>
  );
}