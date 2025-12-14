import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { PathWayButton } from './PathWayButton';
import { PathWayCard } from './PathWayCard';
import { PathWayMotif } from './PathWayMotif';

interface SignUpQRScreenProps {
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}

export function SignUpQRScreen({ onClose, onScanSuccess }: SignUpQRScreenProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Simulate QR scanning process
  const startScan = () => {
    setIsScanning(true);
    setScanStatus('scanning');
    setErrorMessage('');

    // Simulate camera activation and scanning
    setTimeout(() => {
      // Simulate random success/failure for demo
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        setScanStatus('success');
        setIsScanning(false);
        
        // Simulate successful organization connection
        setTimeout(() => {
          onScanSuccess('Sunshine Community Centre - Welcome to our community!');
        }, 1500);
      } else {
        setScanStatus('error');
        setIsScanning(false);
        setErrorMessage('QR code not recognized. Please ensure you\'re scanning an official organization QR code.');
      }
    }, 3000);
  };

  const resetScan = () => {
    setScanStatus('idle');
    setIsScanning(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-6 pb-4 px-4 text-center"
        style={{ backgroundColor: '#76D7C4' }}
      >
        <h1 
          className="mb-1"
          style={{ 
            fontFamily: 'Nunito, sans-serif',
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: 700,
            color: '#333333',
            lineHeight: 1.2
          }}
        >
          Connect with your organisation
        </h1>
        
        <p 
          style={{ 
            fontFamily: 'Quicksand, sans-serif',
            fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
            fontWeight: 400,
            color: '#333333',
            opacity: 0.8,
            lineHeight: 1.4
          }}
        >
          Scan your organization's QR code to get started
        </p>
      </motion.div>

      {/* Curved Path Motif */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="px-4 pb-3"
      >
        <PathWayMotif 
          variant="curved-path"
          context="family"
          size="small"
          animated
        />
      </motion.div>

      {/* Main content */}
      <main id="main-content" className="px-4 sm:px-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4 py-3"
        >
          {/* Instructions Card */}
          <PathWayCard className="text-center space-y-3">
            <h2 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)',
              fontWeight: 700,
              color: '#333333'
            }}>
              Get Your QR Code
            </h2>
            
            <div className="space-y-2">
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 'clamp(0.8rem, 1.8vw, 0.875rem)',
                fontWeight: 400,
                color: '#333333',
                lineHeight: 1.4
              }}>
                Ask your organization's staff for your QR code:
              </p>
              
              <ul className="space-y-1 max-w-xs mx-auto">
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={14} color="#22C55E" className="flex-shrink-0" />
                  <span style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: 'clamp(0.75rem, 1.8vw, 0.825rem)',
                    color: '#333333'
                  }}>
                    Connect to your organization
                  </span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={14} color="#22C55E" className="flex-shrink-0" />
                  <span style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: 'clamp(0.75rem, 1.8vw, 0.825rem)',
                    color: '#333333'
                  }}>
                    Register your child automatically
                  </span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <CheckCircle size={14} color="#22C55E" className="flex-shrink-0" />
                  <span style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: 'clamp(0.75rem, 1.8vw, 0.825rem)',
                    color: '#333333'
                  }}>
                    Set up your family account
                  </span>
                </li>
              </ul>
            </div>
          </PathWayCard>

          {/* QR Scanner Area */}
          <PathWayCard className="text-center space-y-4">
            {/* Scanner View */}
            <div 
              className="relative mx-auto rounded-lg overflow-hidden"
              style={{ 
                width: '220px', 
                height: '220px',
                backgroundColor: scanStatus === 'scanning' ? '#F3F4F6' : '#F9FAFB',
                border: '2px dashed #D1D5DB'
              }}
            >
              {/* Scanner States */}
              {scanStatus === 'idle' && (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <Camera size={40} color="#9CA3AF" />
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.8rem',
                    color: '#6B7280'
                  }}>
                    Tap "Start Scanning" to begin
                  </p>
                </div>
              )}

              {scanStatus === 'scanning' && (
                <motion.div 
                  className="flex flex-col items-center justify-center h-full space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Camera size={40} color="#76D7C4" />
                  </motion.div>
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.8rem',
                    color: '#76D7C4'
                  }}>
                    Scanning for QR code...
                  </p>
                  
                  {/* Scanning overlay */}
                  <motion.div
                    className="absolute inset-0 border-2 border-[#76D7C4] rounded-lg"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.div>
              )}

              {scanStatus === 'success' && (
                <motion.div 
                  className="flex flex-col items-center justify-center h-full space-y-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                >
                  <CheckCircle size={40} color="#22C55E" />
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.8rem',
                    color: '#22C55E',
                    fontWeight: 600
                  }}>
                    Successfully connected!
                  </p>
                </motion.div>
              )}

              {scanStatus === 'error' && (
                <motion.div 
                  className="flex flex-col items-center justify-center h-full space-y-3 p-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <AlertCircle size={40} color="#EF4444" />
                  <p style={{ 
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.7rem',
                    color: '#EF4444',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}>
                    QR code not recognized. Please try again.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {scanStatus === 'idle' && (
                <PathWayButton
                  variant="primary"
                  size="medium"
                  onClick={startScan}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#76D7C4',
                    color: '#333333',
                    minHeight: '46px'
                  }}
                  aria-describedby="start-scan-help"
                >
                  <Camera size={18} aria-hidden="true" />
                  Start Scanning
                </PathWayButton>
              )}
              
              {scanStatus === 'error' && (
                <PathWayButton
                  variant="primary"
                  size="medium"
                  onClick={resetScan}
                  className="w-full flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: '#76D7C4',
                    color: '#333333',
                    minHeight: '46px'
                  }}
                  aria-label="Try scanning again"
                >
                  <RotateCcw size={18} aria-hidden="true" />
                  Try Again
                </PathWayButton>
              )}

              {scanStatus === 'scanning' && (
                <PathWayButton
                  variant="white"
                  size="medium"
                  onClick={resetScan}
                  className="w-full"
                  style={{ minHeight: '46px' }}
                  aria-label="Cancel scanning"
                >
                  Cancel
                </PathWayButton>
              )}
            </div>
            
            <div id="start-scan-help" className="sr-only">
              This will activate your camera to scan the QR code provided by your organization
            </div>
          </PathWayCard>

          {/* Help Text */}
          <div className="text-center space-y-2">
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
              color: '#6B7280',
              lineHeight: 1.4
            }}>
              Don't have a QR code? Contact your organization's staff.
            </p>
            
            <button
              onClick={onClose}
              className="p-1 rounded-md transition-colors duration-200 hover:bg-gray-50"
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: 'clamp(0.8rem, 1.8vw, 0.9rem)',
                fontWeight: 500,
                color: '#4DA9E5',
                textDecoration: 'underline',
                textDecorationThickness: '1px',
                textUnderlineOffset: '2px',
                minHeight: '44px',
                minWidth: '44px'
              }}
              aria-label="Go back to login screen"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}