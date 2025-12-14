import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, X, HelpCircle, Upload, File, FileText, Image, Video, Plus, Trash2, Calendar, Wifi, WifiOff } from 'lucide-react';
import { PathWayButton } from './PathWayButton';
import { PathWayInput } from './PathWayInput';
import { PathWayCard } from './PathWayCard';
import { PathWayToggle } from './PathWayToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from "sonner@2.0.3";

interface UploadLessonScreenProps {
  onBack: () => void;
  onClose: () => void;
}

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'pending';
  url?: string;
}

interface ExternalResource {
  id: string;
  url: string;
  title: string;
}

const ageGroups = [
  { value: 'toddlers', label: 'Toddlers (2–4)' },
  { value: 'younger', label: 'Younger (5–7)' },
  { value: 'middle', label: 'Middle (8–10)' },
  { value: 'older', label: 'Older (11–13)' }
];

const suggestedTags = ['game', 'craft', 'memory verse', 'video', 'worksheet', 'activity', 'discussion', 'prayer'];

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return <File className="w-4 h-4 text-red-500" />;
  if (type.includes('doc')) return <FileText className="w-4 h-4 text-blue-500" />;
  if (type.includes('image')) return <Image className="w-4 h-4 text-green-500" />;
  if (type.includes('video')) return <Video className="w-4 h-4 text-purple-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getNextSunday = () => {
  const today = new Date();
  const nextSunday = new Date(today);
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  return nextSunday.toISOString().split('T')[0];
};

export function UploadLessonScreen({ onBack, onClose }: UploadLessonScreenProps) {
  const [formData, setFormData] = useState({
    ageGroup: '',
    title: '',
    description: '',
    date: getNextSunday(),
    tags: [] as string[],
    visibleToAllTeachers: true
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [externalResources, setExternalResources] = useState<ExternalResource[]>([]);
  const [newExternalUrl, setNewExternalUrl] = useState('');
  const [showExternalUrlInput, setShowExternalUrlInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate offline/online status
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.ageGroup) {
      newErrors.ageGroup = 'Age group is required';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Lesson title is required';
    }
    
    if (uploadedFiles.length === 0 && externalResources.length === 0) {
      newErrors.resources = 'At least one resource (file or link) is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
    }
  };

  const handleFileUpload = (files: File[]) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'video/mp4'
    ];

    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were not uploaded. Only PDF, DOCX, PPTX, JPG, PNG, and MP4 files are allowed.');
    }

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: isOffline ? 'pending' : 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate file upload
    if (!isOffline) {
      newFiles.forEach(uploadedFile => {
        const interval = setInterval(() => {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, progress: Math.min(f.progress + 10, 100) }
                : f
            )
          );
        }, 200);

        setTimeout(() => {
          clearInterval(interval);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === uploadedFile.id 
                ? { ...f, status: 'completed', progress: 100 }
                : f
            )
          );
        }, 2000);
      });
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addExternalResource = () => {
    if (newExternalUrl.trim()) {
      const resource: ExternalResource = {
        id: Math.random().toString(36).substr(2, 9),
        url: newExternalUrl,
        title: newExternalUrl
      };
      
      setExternalResources(prev => [...prev, resource]);
      setNewExternalUrl('');
      setShowExternalUrlInput(false);
    }
  };

  const removeExternalResource = (resourceId: string) => {
    setExternalResources(prev => prev.filter(r => r.id !== resourceId));
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isOffline) {
        toast.success('Draft saved locally. Will sync when online.');
      } else {
        toast.success('Lesson uploaded successfully!', {
          action: {
            label: 'View lessons',
            onClick: () => onBack()
          }
        });
      }
      
      onBack();
    } catch (error) {
      toast.error('Failed to upload lesson. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved locally. Will sync when online.');
  };

  const overallProgress = uploadedFiles.length > 0 
    ? Math.round(uploadedFiles.reduce((sum, file) => sum + file.progress, 0) / uploadedFiles.length)
    : 0;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minHeight: '44px', minWidth: '44px' }}
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 style={{ 
                fontFamily: 'Nunito, sans-serif',
                fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
                fontWeight: 700,
                color: '#333333'
              }}>
                Upload Lesson
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                    aria-label="Help"
                  >
                    <HelpCircle className="w-5 h-5 text-gray-600" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Get help with uploading lessons</p>
                </TooltipContent>
              </Tooltip>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minHeight: '44px', minWidth: '44px' }}
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </header>

        {/* Context Banner */}
        <div 
          className="px-4 py-3 border-b"
          style={{ backgroundColor: 'rgba(118, 215, 196, 0.1)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span style={{ 
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#333333',
                fontWeight: 500
              }}>
                Serve Space · Age-group resources
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Teachers can upload lesson files for coordinators to review.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {isOffline && (
              <div className="flex items-center space-x-2 text-orange-600">
                <WifiOff className="w-4 h-4" />
                <span style={{ 
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  Offline – will sync later
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="px-4 py-6 pb-48 sm:pb-52 md:pb-56">
          <div className="max-w-2xl mx-auto">
            <PathWayCard className="space-y-6">
              {/* Error Banner */}
              {Object.keys(errors).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p style={{
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    color: '#DC2626',
                    fontWeight: 500
                  }}>
                    Please fix the following errors before continuing:
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {Object.values(errors).map((error, index) => (
                      <li key={index} style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        color: '#DC2626'
                      }}>
                        {error}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      color: '#1E40AF',
                      fontWeight: 500
                    }}>
                      Uploading lesson...
                    </span>
                    <span style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      color: '#1E40AF'
                    }}>
                      {overallProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${overallProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Form - Mobile: Single column, Tablet: Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Age Group */}
                  <div>
                    <label 
                      htmlFor="age-group"
                      className="block mb-2"
                      style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#333333'
                      }}
                    >
                      Age Group <span className="text-red-500">*</span>
                    </label>
                    <Select value={formData.ageGroup} onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, ageGroup: value }));
                      setErrors(prev => ({ ...prev, ageGroup: '' }));
                    }}>
                      <SelectTrigger 
                        id="age-group"
                        className={`h-12 ${errors.ageGroup ? 'border-red-500' : ''}`}
                        aria-describedby={errors.ageGroup ? 'age-group-error' : undefined}
                      >
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        {ageGroups.map((group) => (
                          <SelectItem key={group.value} value={group.value}>
                            {group.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ageGroup && (
                      <p 
                        id="age-group-error" 
                        className="mt-2 text-red-500"
                        style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem'
                        }}
                      >
                        {errors.ageGroup}
                      </p>
                    )}
                  </div>

                  {/* Lesson Title */}
                  <div>
                    <PathWayInput
                      label="Lesson Title"
                      placeholder="E.g., The Good Samaritan"
                      value={formData.title}
                      onChange={(value) => {
                        setFormData(prev => ({ ...prev, title: value }));
                        setErrors(prev => ({ ...prev, title: '' }));
                      }}
                      required
                      error={errors.title}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label 
                      htmlFor="description"
                      className="block mb-2"
                      style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#333333'
                      }}
                    >
                      Description (Optional)
                    </label>
                    <Textarea
                      id="description"
                      placeholder="1–3 lines: objective, key points."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[100px] resize-none"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem'
                      }}
                    />
                    <p 
                      className="mt-1 text-gray-500"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem'
                      }}
                    >
                      1–3 lines: objective, key points.
                    </p>
                  </div>

                  {/* Date */}
                  <div>
                    <label 
                      htmlFor="lesson-date"
                      className="block mb-2"
                      style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#333333'
                      }}
                    >
                      Date (Optional)
                    </label>
                    <div className="relative">
                      <input
                        id="lesson-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.875rem'
                        }}
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Resources Upload */}
                  <div>
                    <label 
                      className="block mb-2"
                      style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#333333'
                      }}
                    >
                      Resources <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Upload Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      } ${errors.resources ? 'border-red-500' : ''}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        color: '#666666',
                        marginBottom: '8px'
                      }}>
                        Drag & drop files here, or
                      </p>
                      <PathWayButton
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="mb-2"
                      >
                        Choose files
                      </PathWayButton>
                      <p style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        color: '#888888'
                      }}>
                        Supports PDF, DOCX, PPTX, JPG, PNG, MP4
                      </p>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.mp4"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>

                    {errors.resources && (
                      <p 
                        className="mt-2 text-red-500"
                        style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem'
                        }}
                      >
                        {errors.resources}
                      </p>
                    )}

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {getFileIcon(file.file.type)}
                              <div className="flex-1 min-w-0">
                                <p 
                                  className="truncate"
                                  style={{
                                    fontFamily: 'Quicksand, sans-serif',
                                    fontSize: '0.875rem',
                                    color: '#333333',
                                    fontWeight: 500
                                  }}
                                >
                                  {file.file.name}
                                </p>
                                <p style={{
                                  fontFamily: 'Quicksand, sans-serif',
                                  fontSize: '0.75rem',
                                  color: '#666666'
                                }}>
                                  {formatFileSize(file.file.size)}
                                  {file.status === 'pending' && (
                                    <span className="ml-2 text-orange-600">• Pending sync</span>
                                  )}
                                </p>
                                {file.status === 'uploading' && (
                                  <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                    <div
                                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${file.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-1 rounded hover:bg-gray-200 transition-colors"
                              style={{ minHeight: '32px', minWidth: '32px' }}
                              aria-label={`Remove ${file.file.name}`}
                            >
                              <Trash2 className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* External Resources */}
                    <div className="mt-4">
                      {externalResources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-2">
                          <div className="flex-1 min-w-0">
                            <p 
                              className="truncate"
                              style={{
                                fontFamily: 'Quicksand, sans-serif',
                                fontSize: '0.875rem',
                                color: '#333333',
                                fontWeight: 500
                              }}
                            >
                              {resource.title}
                            </p>
                            <p 
                              className="truncate"
                              style={{
                                fontFamily: 'Quicksand, sans-serif',
                                fontSize: '0.75rem',
                                color: '#4DA9E5'
                              }}
                            >
                              {resource.url}
                            </p>
                          </div>
                          <button
                            onClick={() => removeExternalResource(resource.id)}
                            className="p-1 rounded hover:bg-blue-200 transition-colors ml-2"
                            style={{ minHeight: '32px', minWidth: '32px' }}
                            aria-label={`Remove external resource ${resource.title}`}
                          >
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      ))}

                      {showExternalUrlInput ? (
                        <div className="flex space-x-2 mt-2">
                          <input
                            type="url"
                            placeholder="https://example.com/resource"
                            value={newExternalUrl}
                            onChange={(e) => setNewExternalUrl(e.target.value)}
                            className="flex-1 h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            style={{
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '0.875rem'
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && addExternalResource()}
                          />
                          <PathWayButton
                            variant="primary"
                            size="small"
                            onClick={addExternalResource}
                          >
                            Add
                          </PathWayButton>
                          <PathWayButton
                            variant="white"
                            size="small"
                            onClick={() => {
                              setShowExternalUrlInput(false);
                              setNewExternalUrl('');
                            }}
                          >
                            Cancel
                          </PathWayButton>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowExternalUrlInput(true)}
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mt-2"
                          style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add link to external resource</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label 
                      className="block mb-2"
                      style={{ 
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#333333'
                      }}
                    >
                      Tags (Optional)
                    </label>
                    
                    {/* Current Tags */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800"
                            style={{
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-2 hover:text-blue-600"
                              aria-label={`Remove tag ${tag}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add New Tag */}
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="text"
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="flex-1 h-10 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.875rem'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && addTag(newTag)}
                      />
                      <PathWayButton
                        variant="secondary"
                        size="small"
                        onClick={() => addTag(newTag)}
                        disabled={!newTag.trim()}
                      >
                        Add
                      </PathWayButton>
                    </div>

                    {/* Suggested Tags */}
                    <div>
                      <p style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        color: '#666666',
                        marginBottom: '8px'
                      }}>
                        Suggested:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags
                          .filter(tag => !formData.tags.includes(tag))
                          .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => addTag(tag)}
                            className="px-3 py-1 text-gray-600 border border-gray-300 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
                            style={{
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <h3 
                      className="mb-4"
                      style={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#333333'
                      }}
                    >
                      Visibility
                    </h3>
                    
                    <PathWayToggle
                      label={`Visible to all teachers in ${formData.ageGroup ? ageGroups.find(g => g.value === formData.ageGroup)?.label || 'Age Group' : 'Age Group'}`}
                      description="Other teachers in this age group can see and use this lesson"
                      checked={formData.visibleToAllTeachers}
                      onChange={(checked) => setFormData(prev => ({ ...prev, visibleToAllTeachers: checked }))}
                    />
                  </div>
                </div>
              </div>
            </PathWayCard>
          </div>
        </main>

        {/* Sticky Footer */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4 max-w-4xl mx-auto">
            {/* Mobile Layout */}
            <div className="flex flex-col space-y-3 md:hidden">
              <div className="flex space-x-3">
                <PathWayButton
                  variant="white"
                  onClick={handleSaveDraft}
                  disabled={isUploading}
                  className="flex-1"
                >
                  Save Draft
                </PathWayButton>
                
                <PathWayButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Uploading...' : 'Upload & Save'}
                </PathWayButton>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 transition-colors self-center"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  minHeight: '44px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </button>
            </div>

            {/* Tablet Layout */}
            <div className="hidden md:flex md:items-center md:justify-between">
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  minHeight: '44px',
                  padding: '8px 16px'
                }}
              >
                Cancel
              </button>
              
              <div className="flex space-x-3">
                <PathWayButton
                  variant="white"
                  onClick={handleSaveDraft}
                  disabled={isUploading}
                  className="min-w-[120px]"
                >
                  Save Draft
                </PathWayButton>
                
                <PathWayButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="min-w-[140px]"
                >
                  {isUploading ? 'Uploading...' : 'Upload & Save'}
                </PathWayButton>
              </div>
            </div>
            
            {isOffline && (
              <div className="mt-2 text-center">
                <span style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.75rem',
                  color: '#F59E0B',
                  fontWeight: 500
                }}>
                  • Offline – will sync later
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}