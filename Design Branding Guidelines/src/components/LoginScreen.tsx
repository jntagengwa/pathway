import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { PathWayButton } from './PathWayButton';
import { PathWayInput } from './PathWayInput';
import { PathWayMotif } from './PathWayMotif';

interface LoginScreenProps {
  pathwayLogo: string;
  onBack: () => void;
  onLogin: (email: string, password: string) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
  onCreateAccount: () => void;
}

export function LoginScreen({
  pathwayLogo,
  onBack,
  onLogin,
  onForgotPassword,
  onSignUp,
  onCreateAccount
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header with logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-12 pb-8 px-4 text-center"
      >
        <img 
          src={pathwayLogo} 
          alt="PathWay Logo" 
          className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6"
          style={{ 
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))'
          }}
        />
        
        <h1 
          className="mb-2"
          style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 700,
            color: '#333333',
            lineHeight: 1.2
          }}
        >
          Welcome back
        </h1>
        
        <p 
          style={{ 
            fontFamily: 'Quicksand, sans-serif',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
            fontWeight: 400,
            color: '#333333',
            opacity: 0.8,
            lineHeight: 1.5
          }}
        >
          Log in to continue your journey
        </p>
      </motion.div>

      {/* Curved Path Motif */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="px-4 pb-6"
      >
        <PathWayMotif 
          variant="curved-path"
          context="family"
          size="medium"
          animated
        />
      </motion.div>

      {/* Main content */}
      <main id="main-content" className="px-4 sm:px-6 max-w-sm mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-6"
        >
          {/* Login Form */}
          <div className="space-y-4">
            <PathWayInput
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={setEmail}
              onKeyPress={handleKeyPress}
              required
              autoComplete="email"
              aria-describedby="email-help"
            />
            <div id="email-help" className="sr-only">
              Enter your registered email address
            </div>

            <div className="relative">
              <PathWayInput
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={setPassword}
                onKeyPress={handleKeyPress}
                required
                autoComplete="current-password"
                aria-describedby="password-help"
              />
              <div id="password-help" className="sr-only">
                Enter your password. Use the show/hide button to toggle visibility.
              </div>
              
              {/* Show/Hide Password Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                style={{ 
                  top: '50%',
                  transform: 'translateY(-50%)',
                  marginTop: '12px', /* Half of label height to account for label space */
                  minHeight: '44px',
                  minWidth: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#333333" />
                ) : (
                  <Eye size={20} color="#333333" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <PathWayButton
            variant="primary"
            size="large"
            onClick={handleLogin}
            disabled={!email || !password || isLoading}
            className="w-full"
            style={{
              backgroundColor: '#76D7C4',
              color: '#333333',
              minHeight: '52px'
            }}
            aria-describedby="login-button-help"
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </PathWayButton>
          <div id="login-button-help" className="sr-only">
            Click to log in with your email and password
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              onClick={onForgotPassword}
              className="p-2 rounded-md transition-colors duration-200 hover:bg-gray-50"
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 500,
                color: '#4DA9E5',
                textDecoration: 'underline',
                textDecorationThickness: '1px',
                textUnderlineOffset: '2px',
                minHeight: '44px',
                minWidth: '44px'
              }}
              aria-label="Reset your forgotten password"
            >
              Forgot your password?
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div 
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span 
                className="px-4 bg-white"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 400,
                  color: '#333333',
                  opacity: 0.6
                }}
              >
                or
              </span>
            </div>
          </div>

          {/* Sign Up Button */}
          <PathWayButton
            variant="white"
            size="large"
            onClick={onSignUp}
            className="w-full flex items-center justify-center gap-3"
            style={{
              border: '2px solid #4DA9E5',
              color: '#4DA9E5',
              backgroundColor: 'white',
              minHeight: '52px'
            }}
            aria-describedby="signup-button-help"
          >
            <UserPlus size={20} aria-hidden="true" />
            Sign Up
          </PathWayButton>
          <div id="signup-button-help" className="sr-only">
            Sign up for a new account by connecting with your organization
          </div>

          {/* Footer Link */}
          <div className="text-center pt-6 pb-8">
            <p 
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                fontWeight: 400,
                color: '#333333',
                lineHeight: 1.5
              }}
            >
              New here?{' '}
              <button
                onClick={onCreateAccount}
                className="p-1 rounded-md transition-colors duration-200 hover:bg-yellow-50"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: 600,
                  color: '#FFD166',
                  textDecoration: 'underline',
                  textDecorationThickness: '2px',
                  textUnderlineOffset: '2px',
                  minHeight: '44px',
                  minWidth: '44px'
                }}
                aria-label="Create a new PathWay account"
              >
                Create an account
              </button>
            </p>
          </div>
        </motion.div>
      </main>

      {/* Back button - positioned at bottom for easy thumb access */}
      <div className="fixed bottom-8 left-4">
        <PathWayButton
          variant="white"
          onClick={onBack}
          className="flex items-center gap-2 shadow-lg"
          style={{
            minHeight: '48px',
            minWidth: '48px'
          }}
          aria-label="Go back to previous screen"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path 
              d="M19 12H5" 
              stroke="#333333" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="m12 19-7-7 7-7" 
              stroke="#333333" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
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
      </div>
    </div>
  );
}