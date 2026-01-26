import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Filter, 
  X, 
  ChevronDown, 
  Download, 
  Share, 
  MoreHorizontal,
  FileText,
  File,
  Image,
  Video,
  ExternalLink,
  Clock,
  User,
  Calendar,
  Eye,
  Edit,
  AlertTriangle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { PathWayButton } from './PathWayButton';
import { PathWayCard } from './PathWayCard';
import { PathWayBadge } from './PathWayBadge';
import { PathWayMotif } from './PathWayMotif';
import { EmptyState } from './EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Skeleton } from './ui/skeleton';
import { toast } from "sonner@2.0.3";

interface LessonsBrowseScreenProps {
  onBack: () => void;
  onUploadLesson: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  ageGroup: 'toddlers' | 'younger' | 'middle' | 'older';
  date: string;
  author: {
    name: string;
    avatar?: string;
    initials: string;
  };
  resources: {
    type: 'pdf' | 'docx' | 'pptx' | 'image' | 'video' | 'link';
    name: string;
    size?: string;
    url: string;
  }[];
  tags: string[];
  status: 'approved' | 'pending' | 'draft';
  isOfflineCached: boolean;
  duration?: string;
  version: string;
  lastUpdated: string;
  notes?: string;
}

interface FilterState {
  ageGroup: string;
  dateRange: string;
  type: string[];
  myUploads: boolean;
}

const ageGroups = [
  { value: 'all', label: 'All Ages' },
  { value: 'toddlers', label: 'Toddlers (2-4)' },
  { value: 'younger', label: 'Younger (5-7)' },
  { value: 'middle', label: 'Middle (8-10)' },
  { value: 'older', label: 'Older (11-13)' }
];

const resourceTypes = ['PDF', 'Link', 'Video', 'Image', 'Slides'];

const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'The Good Samaritan',
    description: 'Teaching children about kindness and helping others through the parable of the Good Samaritan.',
    ageGroup: 'younger',
    date: '2024-12-15',
    author: {
      name: 'Sarah Johnson',
      initials: 'SJ'
    },
    resources: [
      { type: 'pdf', name: 'Lesson Plan.pdf', size: '2.4 MB', url: '#' },
      { type: 'pptx', name: 'Story Slides.pptx', size: '5.1 MB', url: '#' },
      { type: 'video', name: 'Story Animation.mp4', size: '15.2 MB', url: '#' }
    ],
    tags: ['kindness', 'parable', 'helping others'],
    status: 'approved',
    isOfflineCached: true,
    duration: '45 min',
    version: '1.2',
    lastUpdated: '2024-12-10',
    notes: 'Great for interactive discussion. Include props for role-playing.'
  },
  {
    id: '2',
    title: 'Creation Story Craft',
    description: 'Hands-on craft activity exploring the seven days of creation with age-appropriate materials.',
    ageGroup: 'toddlers',
    date: '2024-12-22',
    author: {
      name: 'Mike Chen',
      initials: 'MC'
    },
    resources: [
      { type: 'pdf', name: 'Craft Instructions.pdf', size: '1.8 MB', url: '#' },
      { type: 'image', name: 'Example Photos.jpg', size: '3.2 MB', url: '#' },
      { type: 'link', name: 'Supply List Online', url: 'https://example.com/supplies' }
    ],
    tags: ['craft', 'creation', 'hands-on'],
    status: 'pending',
    isOfflineCached: false,
    duration: '30 min',
    version: '1.0',
    lastUpdated: '2024-12-08'
  },
  {
    id: '3',
    title: 'David and Goliath Drama',
    description: 'Interactive drama lesson teaching courage and faith through the story of David and Goliath.',
    ageGroup: 'middle',
    date: '2024-12-29',
    author: {
      name: 'Lisa Martinez',
      initials: 'LM'
    },
    resources: [
      { type: 'pdf', name: 'Script.pdf', size: '1.2 MB', url: '#' },
      { type: 'pdf', name: 'Props List.pdf', size: '0.8 MB', url: '#' }
    ],
    tags: ['drama', 'courage', 'faith', 'interactive'],
    status: 'draft',
    isOfflineCached: true,
    duration: '60 min',
    version: '0.9',
    lastUpdated: '2024-12-05'
  }
];

const recentSearches = ['kindness', 'Christmas lessons', 'craft activities', 'drama'];

export function LessonsBrowseScreen({ onBack, onUploadLesson }: LessonsBrowseScreenProps) {
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>(mockLessons);
  const [filters, setFilters] = useState<FilterState>({
    ageGroup: 'all',
    dateRange: '',
    type: [],
    myUploads: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Simulate offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Filter lessons based on current filters and search
  useEffect(() => {
    let filtered = [...lessons];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(query) ||
        lesson.description.toLowerCase().includes(query) ||
        lesson.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply age group filter
    if (filters.ageGroup && filters.ageGroup !== 'all') {
      filtered = filtered.filter(lesson => lesson.ageGroup === filters.ageGroup);
    }

    // Apply type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter(lesson =>
        lesson.resources.some(resource => {
          const resourceType = resource.type.toLowerCase();
          return filters.type.some(filterType => {
            const type = filterType.toLowerCase();
            if (type === 'slides') return resourceType === 'pptx';
            if (type === 'link') return resourceType === 'link';
            return resourceType === type;
          });
        })
      );
    }

    // Apply my uploads filter (simulated)
    if (filters.myUploads) {
      filtered = filtered.filter(lesson => lesson.author.name === 'Sarah Johnson');
    }

    setFilteredLessons(filtered);
  }, [lessons, filters, searchQuery]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTypeFilter = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      ageGroup: 'all',
      dateRange: '',
      type: [],
      myUploads: false
    });
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSearch(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isOffline) {
        setError("Couldn't load lessons. Check your connection and try again.");
      } else {
        toast.success('Lessons updated');
      }
    } catch (err) {
      setError("Couldn't load lessons. Retry.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLessonAction = (action: string, lesson: Lesson) => {
    switch (action) {
      case 'open':
        setSelectedLesson(lesson);
        break;
      case 'download':
        toast.success(`Downloading ${lesson.title}...`);
        break;
      case 'share':
        toast.success(`Sharing ${lesson.title}...`);
        break;
      case 'offline':
        const updatedLessons = lessons.map(l =>
          l.id === lesson.id ? { ...l, isOfflineCached: !l.isOfflineCached } : l
        );
        setLessons(updatedLessons);
        toast.success(
          lesson.isOfflineCached
            ? `${lesson.title} removed from offline storage`
            : `${lesson.title} saved for offline access`
        );
        break;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <File className="w-4 h-4 text-red-500" />;
      case 'docx': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'pptx': return <FileText className="w-4 h-4 text-orange-500" />;
      case 'image': return <Image className="w-4 h-4 text-green-500" />;
      case 'video': return <Video className="w-4 h-4 text-purple-500" />;
      case 'link': return <ExternalLink className="w-4 h-4 text-blue-500" />;
      default: return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Draft</span>;
      default:
        return null;
    }
  };

  const activeFiltersCount = 
    (filters.ageGroup && filters.ageGroup !== 'all' ? 1 : 0) +
    (filters.dateRange ? 1 : 0) +
    filters.type.length +
    (filters.myUploads ? 1 : 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 style={{ 
              fontFamily: 'Nunito, sans-serif',
              fontSize: 'clamp(1.125rem, 2.5vw, 1.25rem)',
              fontWeight: 700,
              color: '#333333'
            }}>
              Lessons
            </h1>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ minHeight: '44px', minWidth: '44px' }}
                aria-label="Search lessons"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              
              <PathWayButton
                variant="primary"
                size="small"
                onClick={onUploadLesson}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </PathWayButton>
            </div>
          </div>
        </header>

        {/* Mobile/Tablet Layout */}
        <div className="md:flex md:h-[calc(100vh-73px)]">
          {/* Filters Sidebar (Tablet) */}
          <div className="hidden md:block md:w-80 border-r border-gray-200 bg-gray-50">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#333333'
                }}>
                  Filters
                </h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Age Group Filter */}
              <div>
                <label className="block mb-2" style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#333333'
                }}>
                  Age Group
                </label>
                <Select value={filters.ageGroup} onValueChange={(value) => handleFilterChange('ageGroup', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Ages" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Resource Type Filter */}
              <div>
                <label className="block mb-2" style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#333333'
                }}>
                  Resource Type
                </label>
                <div className="space-y-2">
                  {resourceTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.type.includes(type)}
                        onChange={() => toggleTypeFilter(type)}
                        className="pathway-checkbox w-4 h-4 rounded focus:ring-2 focus:ring-offset-2"
                        style={{
                          accentColor: '#76D7C4'
                        }}
                      />
                      <span style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.875rem',
                        color: '#333333'
                      }}>
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* My Uploads Filter */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.myUploads}
                    onChange={(e) => handleFilterChange('myUploads', e.target.checked)}
                    className="pathway-checkbox w-4 h-4 rounded focus:ring-2 focus:ring-offset-2"
                    style={{
                      accentColor: '#76D7C4'
                    }}
                  />
                  <span style={{
                    fontFamily: 'Quicksand, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#333333'
                  }}>
                    My uploads only
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Mobile Filters Bar */}
            <div className="md:hidden border-b border-gray-200 bg-white">
              <div className="p-4">
                <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                  {/* Age Group Chip */}
                  <Select value={filters.ageGroup} onValueChange={(value) => handleFilterChange('ageGroup', value)}>
                    <SelectTrigger className="flex-shrink-0 h-8 px-3 bg-gray-100 border-gray-200 hover:bg-gray-200 transition-colors">
                      <div className="flex items-center space-x-1">
                        <span style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {filters.ageGroup && filters.ageGroup !== 'all' ? ageGroups.find(g => g.value === filters.ageGroup)?.label : 'Age Group'}
                        </span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {ageGroups.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Type Filter Chips */}
                  {resourceTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleTypeFilter(type)}
                      className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filters.type.includes(type)
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        minHeight: '32px'
                      }}
                    >
                      {type}
                    </button>
                  ))}

                  {/* My Uploads Chip */}
                  <button
                    onClick={() => handleFilterChange('myUploads', !filters.myUploads)}
                    className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filters.myUploads
                        ? 'bg-mint-100 text-mint-800 border border-mint-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                    style={{
                      fontFamily: 'Quicksand, sans-serif',
                      minHeight: '32px',
                      backgroundColor: filters.myUploads ? 'rgba(118, 215, 196, 0.1)' : undefined,
                      color: filters.myUploads ? '#76D7C4' : undefined,
                      borderColor: filters.myUploads ? 'rgba(118, 215, 196, 0.3)' : undefined
                    }}
                  >
                    My uploads
                  </button>

                  {/* Clear All */}
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="flex-shrink-0 text-blue-600 hover:text-blue-700 transition-colors px-2"
                      style={{
                        fontFamily: 'Quicksand, sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        minHeight: '32px'
                      }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      color: '#DC2626',
                      fontWeight: 500
                    }}>
                      {error}
                    </span>
                  </div>
                  <PathWayButton
                    variant="white"
                    size="small"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Retry'}
                  </PathWayButton>
                </div>
              </div>
            )}

            {/* Lessons List */}
            <div className="flex-1 overflow-auto">
              <div className="p-4 space-y-4">
                {/* Pull to Refresh Indicator */}
                {isRefreshing && (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2" style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      color: '#4DA9E5'
                    }}>
                      Refreshing lessons...
                    </span>
                  </div>
                )}

                {/* Loading Skeleton */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <PathWayCard key={index} className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-6 w-12" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-14" />
                        </div>
                      </PathWayCard>
                    ))}
                  </div>
                ) : filteredLessons.length === 0 ? (
                  /* Empty State */
                  <div className="flex items-center justify-center min-h-[400px]">
                    <EmptyState
                      title="No lessons found"
                      description="Try adjusting filters or uploading a lesson."
                      actionText="Upload lesson"
                      onAction={onUploadLesson}
                      variant="curved-path"
                    />
                  </div>
                ) : (
                  /* Lessons Cards */
                  <div className="space-y-4">
                    {filteredLessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onAction={handleLessonAction}
                        onOpen={() => setSelectedLesson(lesson)}
                        getResourceIcon={getResourceIcon}
                        getStatusBadge={getStatusBadge}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {showSearch && (
            <SearchOverlay
              onClose={() => setShowSearch(false)}
              onSearch={handleSearch}
              recentSearches={recentSearches}
              searchInputRef={searchInputRef}
            />
          )}
        </AnimatePresence>

        {/* Lesson Detail Modal */}
        <AnimatePresence>
          {selectedLesson && (
            <LessonDetailModal
              lesson={selectedLesson}
              onClose={() => setSelectedLesson(null)}
              onAction={handleLessonAction}
              getResourceIcon={getResourceIcon}
              getStatusBadge={getStatusBadge}
            />
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

// Lesson Card Component
interface LessonCardProps {
  lesson: Lesson;
  onAction: (action: string, lesson: Lesson) => void;
  onOpen: () => void;
  getResourceIcon: (type: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

function LessonCard({ lesson, onAction, onOpen, getResourceIcon, getStatusBadge }: LessonCardProps) {
  const ageGroupLabel = ageGroups.find(g => g.value === lesson.ageGroup)?.label || lesson.ageGroup;
  
  const resourceCounts = lesson.resources.reduce((acc, resource) => {
    const type = resource.type === 'pptx' ? 'Slides' : resource.type.toUpperCase();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PathWayCard 
      hoverable 
      className="cursor-pointer transition-all duration-200"
      onClick={onOpen}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1rem',
              fontWeight: 700,
              color: '#333333',
              marginBottom: '4px'
            }}>
              {lesson.title}
            </h3>
            <p style={{
              fontFamily: 'Quicksand, sans-serif',
              fontSize: '0.875rem',
              color: '#666666',
              lineHeight: '1.4'
            }}>
              {lesson.description}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {getStatusBadge(lesson.status)}
            {lesson.isOfflineCached && (
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      Cached
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Available offline</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Meta Row */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span style={{ fontFamily: 'Quicksand, sans-serif' }}>
            {ageGroupLabel}
          </span>
          <span>•</span>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span style={{ fontFamily: 'Quicksand, sans-serif' }}>
              {new Date(lesson.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
              style={{ backgroundColor: '#76D7C4' }}
            >
              {lesson.author.initials}
            </div>
            <span style={{ fontFamily: 'Quicksand, sans-serif' }}>
              {lesson.author.name}
            </span>
          </div>
        </div>

        {/* Resource Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(resourceCounts).map(([type, count]) => (
            <span
              key={type}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {type}
              {count > 1 && <span className="ml-1">({count})</span>}
            </span>
          ))}
        </div>

        {/* Tags */}
        {lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {lesson.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                style={{ fontFamily: 'Quicksand, sans-serif' }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <PathWayButton
            variant="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAction('open', lesson);
            }}
          >
            Open
          </PathWayButton>
          
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('download', lesson);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                  aria-label="Download lesson"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('share', lesson);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                  aria-label="Share lesson"
                >
                  <Share className="w-4 h-4 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction('offline', lesson);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                  aria-label={lesson.isOfflineCached ? "Remove from offline" : "Make available offline"}
                >
                  {lesson.isOfflineCached ? (
                    <WifiOff className="w-4 h-4 text-green-600" />
                  ) : (
                    <Wifi className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lesson.isOfflineCached ? "Remove from offline" : "Make available offline"}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle more actions
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  style={{ minHeight: '36px', minWidth: '36px' }}
                  aria-label="More actions"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>More actions</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </PathWayCard>
  );
}

// Search Overlay Component
interface SearchOverlayProps {
  onClose: () => void;
  onSearch: (query: string) => void;
  recentSearches: string[];
  searchInputRef: React.RefObject<HTMLInputElement>;
}

function SearchOverlay({ onClose, onSearch, recentSearches, searchInputRef }: SearchOverlayProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#333333'
            }}>
              Search Lessons
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close search"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-4">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search title, tags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem'
              }}
            />
          </form>
          
          {recentSearches.length > 0 && (
            <div>
              <h4 style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#666666',
                marginBottom: '8px'
              }}>
                Recent searches
              </h4>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => onSearch(search)}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      color: '#333333'
                    }}
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Lesson Detail Modal Component
interface LessonDetailModalProps {
  lesson: Lesson;
  onClose: () => void;
  onAction: (action: string, lesson: Lesson) => void;
  getResourceIcon: (type: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

function LessonDetailModal({ lesson, onClose, onAction, getResourceIcon, getStatusBadge }: LessonDetailModalProps) {
  const ageGroupLabel = ageGroups.find(g => g.value === lesson.ageGroup)?.label || lesson.ageGroup;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#333333'
            }}>
              {lesson.title}
            </h2>
            {getStatusBadge(lesson.status)}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close lesson details"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Meta Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>Age Group:</span>
                <p className="font-medium" style={{ fontFamily: 'Quicksand, sans-serif', color: '#333333' }}>
                  {ageGroupLabel}
                </p>
              </div>
              <div>
                <span className="text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>Date:</span>
                <p className="font-medium" style={{ fontFamily: 'Quicksand, sans-serif', color: '#333333' }}>
                  {new Date(lesson.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              {lesson.duration && (
                <div>
                  <span className="text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>Duration:</span>
                  <p className="font-medium" style={{ fontFamily: 'Quicksand, sans-serif', color: '#333333' }}>
                    {lesson.duration}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500" style={{ fontFamily: 'Quicksand, sans-serif' }}>Author:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                    style={{ backgroundColor: '#76D7C4' }}
                  >
                    {lesson.author.initials}
                  </div>
                  <span className="font-medium" style={{ fontFamily: 'Quicksand, sans-serif', color: '#333333' }}>
                    {lesson.author.name}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <h3 style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#333333',
                marginBottom: '8px'
              }}>
                Description
              </h3>
              <p style={{
                fontFamily: 'Quicksand, sans-serif',
                fontSize: '0.875rem',
                color: '#666666',
                lineHeight: '1.6'
              }}>
                {lesson.description}
              </p>
            </div>
            
            {/* Resources */}
            <div>
              <h3 style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#333333',
                marginBottom: '12px'
              }}>
                Resources
              </h3>
              <div className="space-y-3">
                {lesson.resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getResourceIcon(resource.type)}
                      <div>
                        <p style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: '#333333'
                        }}>
                          {resource.name}
                        </p>
                        {resource.size && (
                          <p style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '0.75rem',
                            color: '#666666'
                          }}>
                            {resource.size}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <PathWayButton variant="white" size="small">
                        {resource.type === 'link' ? 'Open' : 'View'}
                      </PathWayButton>
                      {resource.type !== 'link' && (
                        <button
                          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                          aria-label="Download resource"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            {lesson.notes && (
              <div>
                <h3 style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#333333',
                  marginBottom: '8px'
                }}>
                  Notes for Teachers
                </h3>
                <p style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  color: '#666666',
                  lineHeight: '1.6'
                }}>
                  {lesson.notes}
                </p>
              </div>
            )}
            
            {/* Version History */}
            <div>
              <h3 style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#333333',
                marginBottom: '8px'
              }}>
                Version History
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <span style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: '#333333'
                    }}>
                      v{lesson.version} (Current)
                    </span>
                    <p style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '0.75rem',
                      color: '#666666'
                    }}>
                      Updated {new Date(lesson.lastUpdated).toLocaleDateString()} by {lesson.author.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Actions - Fixed */}
        <div 
          className="p-4 md:p-6 border-t flex-shrink-0" 
          style={{ 
            borderTopColor: 'rgba(51, 51, 51, 0.1)',
            backgroundColor: '#FFFFFF'
          }}
        >
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-4 md:hidden">
            <div className="flex justify-center">
              <PathWayButton 
                variant="white" 
                onClick={() => onAction('share', lesson)}
                className="w-full max-w-xs"
              >
                <Share className="w-4 h-4" />
                Share
              </PathWayButton>
            </div>
            <div className="flex items-center justify-center space-x-6">
              <button
                onClick={() => onAction('edit', lesson)}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#4DA9E5',
                  backgroundColor: 'transparent',
                  minHeight: '44px',
                  border: '1px solid #4DA9E5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4DA9E5';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#4DA9E5';
                }}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#EF4444',
                  backgroundColor: 'transparent',
                  minHeight: '44px',
                  border: '1px solid #EF4444'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EF4444';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#EF4444';
                }}
              >
                Report Issue
              </button>
            </div>
          </div>

          {/* Tablet/Desktop Layout */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div className="flex items-center">
              <PathWayButton 
                variant="white" 
                onClick={() => onAction('share', lesson)}
                style={{
                  minWidth: '120px'
                }}
              >
                <Share className="w-4 h-4" />
                Share
              </PathWayButton>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onAction('edit', lesson)}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#4DA9E5',
                  backgroundColor: 'transparent',
                  minHeight: '44px',
                  border: '1px solid #4DA9E5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4DA9E5';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#4DA9E5';
                }}
              >
                Edit
              </button>
              <button
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  fontFamily: 'Quicksand, sans-serif',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#EF4444',
                  backgroundColor: 'transparent',
                  minHeight: '44px',
                  border: '1px solid #EF4444'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EF4444';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#EF4444';
                }}
              >
                Report Issue
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}