import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Camera, AlertCircle } from 'lucide-react';
import pathwayLogo from 'figma:asset/ed0d7c9c9507ef7eeb63f93b164e16b201ba64a9.png';
import { PathWayButton } from './PathWayButton';
import { PathWayCard } from './PathWayCard';

interface QRScanScreenProps {
  onClose: () => void;
  onScanSuccess: (data: string) => void;
}

export function QRScanScreen({ onClose, onScanSuccess }: QRScanScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasPermission(true);
        setError(null);
      }
    } catch (err) {
      setHasPermission(false);
      setError('Camera access is required to scan QR codes. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleMockScan = () => {
    setIsScanning(true);
    // Simulate QR code detection delay
    setTimeout(() => {
      setIsScanning(false);
      onScanSuccess('church-abc-123-pathway');
    }, 2000);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (hasPermission === false || error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: '#333333' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
        >
          <PathWayCard>
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#FFD166' }}
                >
                  <AlertCircle className="w-8 h-8" style={{ color: '#333333' }} />
                </div>
              </div>
              
              <div>
                <h2 className="mb-2" style={{ 
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 700,
                  color: '#333333'
                }}>
                  Camera Access Required
                </h2>
                <p style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  color: '#666666'
                }}>
                  {error || 'Please allow camera access to scan QR codes.'}
                </p>
              </div>

              <div className="space-y-3">
                <PathWayButton 
                  variant="primary" 
                  onClick={startCamera}
                  className="w-full"
                >
                  Try Again
                </PathWayButton>
                <PathWayButton 
                  variant="white" 
                  onClick={handleClose}
                  className="w-full"
                >
                  Cancel
                </PathWayButton>
              </div>
            </div>
          </PathWayCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor: '#000000' }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={pathwayLogo} alt="PathWay" className="w-8 h-8" />
            <h1 style={{ 
              fontFamily: 'Nunito, sans-serif', 
              fontWeight: 700,
              fontSize: '1.25rem',
              color: '#FFFFFF'
            }}>
              PathWay
            </h1>
          </div>
          
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <X className="w-6 h-6" style={{ color: '#FFFFFF' }} />
          </button>
        </div>
      </div>

      {/* Camera View */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Scanning Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Semi-transparent background */}
        <div 
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />
        
        {/* Scanning Frame */}
        <div className="relative">
          {/* QR Code Frame */}
          <motion.div
            className="relative w-64 h-64 border-4 rounded-2xl"
            style={{ 
              borderColor: isScanning ? '#FFD166' : '#76D7C4',
              backgroundColor: 'transparent'
            }}
            animate={{
              scale: isScanning ? [1, 1.02, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: isScanning ? Infinity : 0,
            }}
          >
            {/* Corner indicators */}
            <div className="absolute -top-2 -left-2 w-8 h-8">
              <div 
                className="w-6 h-2 absolute top-0 left-0 rounded-r-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
              <div 
                className="w-2 h-6 absolute top-0 left-0 rounded-b-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
            </div>
            
            <div className="absolute -top-2 -right-2 w-8 h-8">
              <div 
                className="w-6 h-2 absolute top-0 right-0 rounded-l-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
              <div 
                className="w-2 h-6 absolute top-0 right-0 rounded-b-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
            </div>
            
            <div className="absolute -bottom-2 -left-2 w-8 h-8">
              <div 
                className="w-6 h-2 absolute bottom-0 left-0 rounded-r-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
              <div 
                className="w-2 h-6 absolute bottom-0 left-0 rounded-t-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
            </div>
            
            <div className="absolute -bottom-2 -right-2 w-8 h-8">
              <div 
                className="w-6 h-2 absolute bottom-0 right-0 rounded-l-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
              <div 
                className="w-2 h-6 absolute bottom-0 right-0 rounded-t-sm"
                style={{ backgroundColor: isScanning ? '#FFD166' : '#76D7C4' }}
              />
            </div>

            {/* Scanning line animation */}
            {isScanning && (
              <motion.div
                className="absolute left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: '#FFD166', boxShadow: '0 0 10px #FFD166' }}
                animate={{
                  y: [0, 250, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            )}
          </motion.div>
          
          {/* Status text */}
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
            <p style={{ 
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '1rem',
              color: isScanning ? '#FFD166' : '#FFFFFF',
              fontWeight: 600
            }}>
              {isScanning ? 'Scanning...' : 'Position QR code within the frame'}
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
        <div 
          className="rounded-2xl p-6 backdrop-blur-lg"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#76D7C4' }}
              >
                <Camera className="w-6 h-6" style={{ color: '#333333' }} />
              </div>
            </div>
            
            <div>
              <h3 className="mb-2" style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: '#FFFFFF'
              }}>
                Scan your organization's QR code to register
              </h3>
              <p style={{ 
                fontFamily: 'Quicksand, sans-serif',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem'
              }}>
                Hold your device steady and align the QR code within the frame above to register with your organization
              </p>
            </div>

            {/* Demo scan button for testing */}
            <PathWayButton 
              variant="white"
              onClick={handleMockScan}
              disabled={isScanning}
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                minHeight: '44px'
              }}
            >
              {isScanning ? 'Scanning...' : 'Demo Scan'}
            </PathWayButton>
          </div>
        </div>
      </div>
    </div>
  );
}