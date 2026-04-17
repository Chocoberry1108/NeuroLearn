
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Loader2, BookOpen, ArrowRight, PenTool, ChevronLeft, Plus, Trash2, FileText, Save, GripVertical, Check, UploadCloud, FileType, Eye, Edit3, Image as ImageIcon, LayoutGrid, List, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { generateCourseStructure, generateLessonFromFile } from '../services/geminiService';
import { Course, Language, Module, Lesson } from '../types';
import ReactMarkdown from 'react-markdown';
import CourseCard from '../components/CourseCard';
import RichTextEditor from '../components/RichTextEditor';

interface CourseGeneratorProps {
  onCourseGenerated: (course: Course) => void;
  t: any;
  language: Language;
  courses?: Course[];
  onCourseClick?: (course: Course) => void;
  initialData?: Course | null;
  onCancel?: () => void;
  onDeleteCourse?: (id: string) => void;
}

type Mode = 'select' | 'ai' | 'manual' | 'upload';
type ViewTab = 'create' | 'my-courses';

const CourseGenerator: React.FC<CourseGeneratorProps> = ({ onCourseGenerated, t, language, courses = [], onCourseClick, initialData, onCancel, onDeleteCourse }) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('create');
  const [mode, setMode] = useState<Mode>('select');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload State (Course Level)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<{ mimeType: string; data: string } | null>(null);

  // Manual creation state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualThumbnail, setManualThumbnail] = useState<string | null>(null);
  const [manualStatus, setManualStatus] = useState<'draft' | 'published'>('draft');
  const [manualVisibility, setManualVisibility] = useState<'public' | 'private'>('private');
  const [manualModules, setManualModules] = useState<Module[]>([
    { id: `m-${Date.now()}`, title: '', lessons: [] }
  ]);
  const [editingLessonId, setEditingLessonId] = useState<{modId: string, lesId: string} | null>(null);
  const [isEditorPreviewMode, setIsEditorPreviewMode] = useState(false);
  
  // Lesson File Upload State
  const [isGeneratingLessonContent, setIsGeneratingLessonContent] = useState(false);
  const lessonFileInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{ type: 'module' | 'lesson', id: string, parentId?: string } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [lastMovedId, setLastMovedId] = useState<string | null>(null);

  const myCourses = courses.filter(c => c.isCreatedByUser);

  // Effect to load initialData when provided (Editing Mode)
  useEffect(() => {
    if (initialData) {
        setMode('manual');
        setManualTitle(initialData.title);
        setManualDesc(initialData.description);
        setManualCategory(initialData.category);
        setManualThumbnail(initialData.thumbnail);
        setManualStatus(initialData.status);
        setManualVisibility(initialData.visibility);
        setManualModules(initialData.modules);
    } else {
        // Reset if initialData is cleared (e.g. going back to main menu manually)
        // resetManualForm(); // Be careful not to loop
    }
  }, [initialData]);

  const handleAiGenerate = async () => {
    // Determine if we have enough input: either a topic text OR a file
    if (!topic.trim() && !fileData) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Pass fileData if it exists
      const partialCourse = await generateCourseStructure(
          topic, 
          language, 
          fileData || undefined
      );
      
      const newCourse: Course = {
        id: `gen-${Date.now()}`,
        title: partialCourse.title || topic || "Uploaded Course",
        description: partialCourse.description || "Khóa học tạo bởi AI",
        thumbnail: partialCourse.thumbnail || "",
        author: "Neuro AI",
        category: partialCourse.category || "Tổng quát",
        rating: 5.0,
        students: 0,
        modules: partialCourse.modules || [],
        progress: 0,
        isGenerated: true,
        status: 'draft',
        visibility: 'private',
        isCreatedByUser: true
      };
      
      onCourseGenerated(newCourse);
    } catch (err) {
      setError(t.error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // Basic validation (size < 5MB)
          if (file.size > 5 * 1024 * 1024) {
              setError("File is too large (Max 5MB)");
              return;
          }

          setSelectedFile(file);
          setError(null);

          // Read file as Base64
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64String = reader.result as string;
              // Remove the Data URL prefix (e.g., "data:application/pdf;base64,")
              const base64Data = base64String.split(',')[1];
              setFileData({
                  mimeType: file.type,
                  data: base64Data
              });
          };
          reader.readAsDataURL(file);
      }
  };
  
  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLessonId) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
         alert("File too large");
         return;
    }

    setIsGeneratingLessonContent(true);
    try {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            
            const lesson = getEditingLesson();
            const currentContent = lesson?.content || "";
            
            const result = await generateLessonFromFile(
                lesson?.title || "Lesson",
                language,
                { mimeType: file.type, data: base64Data }
            );

            if (result.content) {
                const newContent = currentContent ? currentContent + "\n\n" + result.content : result.content;
                // Update content
                setManualModules(prev => prev.map(m => {
                    if (m.id === editingLessonId.modId) {
                        return {
                            ...m,
                            lessons: m.lessons.map(l => l.id === editingLessonId.lesId ? {
                                ...l, 
                                content: newContent,
                                videos: [...(l.videos || []), ...(result.videos || [])], // Append new videos
                                images: [...(l.images || []), ...(result.images || [])] // Append new images
                            } : l)
                        };
                    }
                    return m;
                }));
            }
            setIsGeneratingLessonContent(false);
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error(error);
        setIsGeneratingLessonContent(false);
    }
    // Reset input
    if (lessonFileInputRef.current) lessonFileInputRef.current.value = '';
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Basic validation for image
          if (file.size > 5 * 1024 * 1024) return;

          const reader = new FileReader();
          reader.onloadend = () => {
              setManualThumbnail(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleManualCreate = () => {
      setError(null);
      
      // Validate Course Title
      if (!manualTitle.trim()) {
          setError(language === 'vi' ? 'Vui lòng nhập tên khóa học' : 'Please enter a course title');
          return;
      }

      // Validate Modules and Lessons
      let isValid = true;
      
      if (manualModules.length === 0) {
           setError(language === 'vi' ? 'Vui lòng thêm ít nhất một chương' : 'Please add at least one module');
           return;
      }

      for (const module of manualModules) {
          if (!module.title.trim()) {
              setError(language === 'vi' ? 'Vui lòng nhập tên cho tất cả các chương' : 'Please enter a title for all modules');
              isValid = false;
              break;
          }
          
          for (const lesson of module.lessons) {
              if (!lesson.title.trim()) {
                  setError(language === 'vi' ? `Vui lòng nhập tên bài học trong chương "${module.title}"` : `Please enter a title for all lessons in "${module.title}"`);
                  isValid = false;
                  break;
              }
          }
          if (!isValid) break;
      }

      if (!isValid) return;

      const newCourse: Course = {
          id: initialData ? initialData.id : `manual-${Date.now()}`,
          title: manualTitle,
          description: manualDesc || (language === 'vi' ? 'Khóa học thủ công' : 'Manual Course'),
          thumbnail: manualThumbnail || `https://picsum.photos/seed/${manualTitle.replace(/\s/g, '')}/400/300`,
          author: initialData ? initialData.author : 'Me',
          category: manualCategory || 'General',
          rating: initialData ? initialData.rating : 0,
          students: initialData ? initialData.students : 0,
          progress: initialData ? initialData.progress : 0,
          modules: manualModules,
          status: manualStatus,
          visibility: manualVisibility,
          isCreatedByUser: true
      };
      onCourseGenerated(newCourse);
  };

  const resetManualForm = () => {
      setManualTitle('');
      setManualDesc('');
      setManualCategory('');
      setManualThumbnail(null);
      setManualStatus('draft');
      setManualVisibility('private');
      setManualModules([{ id: `m-${Date.now()}`, title: '', lessons: [] }]);
      setEditingLessonId(null);
      setIsEditorPreviewMode(false);
      setError(null);
  };

  // --- Curriculum Builders ---

  const addModule = () => {
    setManualModules([...manualModules, { id: `m-${Date.now()}`, title: '', lessons: [] }]);
  };

  const deleteModule = (moduleId: string) => {
    if (manualModules.length <= 1) return;
    setManualModules(manualModules.filter(m => m.id !== moduleId));
  };

  const updateModuleTitle = (moduleId: string, title: string) => {
    setManualModules(manualModules.map(m => m.id === moduleId ? { ...m, title } : m));
  };

  const addLesson = (moduleId: string) => {
    setManualModules(manualModules.map(m => {
        if (m.id === moduleId) {
            return {
                ...m,
                lessons: [...m.lessons, {
                    id: `l-${Date.now()}`,
                    title: '',
                    description: '',
                    duration: '5 min',
                    isCompleted: false,
                    content: ''
                }]
            };
        }
        return m;
    }));
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setManualModules(manualModules.map(m => {
        if (m.id === moduleId) {
            return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) };
        }
        return m;
    }));
  };

  const updateLesson = (moduleId: string, lessonId: string, field: keyof Lesson, value: any) => {
    setManualModules(manualModules.map(m => {
        if (m.id === moduleId) {
            return {
                ...m,
                lessons: m.lessons.map(l => l.id === lessonId ? { ...l, [field]: value } : l)
            };
        }
        return m;
    }));
  };

  const getEditingLesson = () => {
      if (!editingLessonId) return null;
      const mod = manualModules.find(m => m.id === editingLessonId.modId);
      if (!mod) return null;
      return mod.lessons.find(l => l.id === editingLessonId.lesId);
  };

  // --- Drag and Drop Handlers ---

  const triggerDropAnimation = (id: string) => {
      setLastMovedId(id);
      setTimeout(() => setLastMovedId(null), 1000); // Extended slightly for visual cue
  };

  const onModuleDragStart = (e: React.DragEvent, id: string) => {
     setDraggedItem({ type: 'module', id });
     e.dataTransfer.effectAllowed = 'move';
     // Just a little hint for mobile polyfill if needed, mostly automatic
  };
  
  const onModuleDragOver = (e: React.DragEvent, id: string) => {
     e.preventDefault();
     if (draggedItem?.type !== 'module' || draggedItem.id === id) return;
     setDragOverId(id);
  };
  
  const onModuleDrop = (e: React.DragEvent, targetId: string) => {
     e.preventDefault();
     setDragOverId(null);
     if (!draggedItem || draggedItem.type !== 'module') return;
     
     const oldIndex = manualModules.findIndex(m => m.id === draggedItem.id);
     const newIndex = manualModules.findIndex(m => m.id === targetId);
     
     if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
         const newModules = [...manualModules];
         const [moved] = newModules.splice(oldIndex, 1);
         newModules.splice(newIndex, 0, moved);
         setManualModules(newModules);
         triggerDropAnimation(draggedItem.id);
     }
     setDraggedItem(null);
  };

  const onLessonDragStart = (e: React.DragEvent, id: string, parentId: string) => {
     e.stopPropagation();
     setDraggedItem({ type: 'lesson', id, parentId });
     e.dataTransfer.effectAllowed = 'move';
  };
  
  const onLessonDragOver = (e: React.DragEvent, id: string, parentId: string) => {
     e.preventDefault();
     e.stopPropagation();
     // Only allow drop if it's a lesson from the SAME module
     if (draggedItem?.type !== 'lesson' || draggedItem.id === id || draggedItem.parentId !== parentId) return;
     setDragOverId(id);
  };
  
  const onLessonDrop = (e: React.DragEvent, targetId: string, parentId: string) => {
     e.preventDefault();
     e.stopPropagation();
     setDragOverId(null);
     
     if (!draggedItem || draggedItem.type !== 'lesson' || draggedItem.parentId !== parentId) return;
     
     const modIndex = manualModules.findIndex(m => m.id === parentId);
     if (modIndex === -1) return;
     
     const module = manualModules[modIndex];
     const oldIndex = module.lessons.findIndex(l => l.id === draggedItem.id);
     const newIndex = module.lessons.findIndex(l => l.id === targetId);
     
     if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
         const newModules = [...manualModules];
         const newLessons = [...module.lessons];
         const [moved] = newLessons.splice(oldIndex, 1);
         newLessons.splice(newIndex, 0, moved);
         newModules[modIndex] = { ...module, lessons: newLessons };
         setManualModules(newModules);
         triggerDropAnimation(draggedItem.id);
     }
     setDraggedItem(null);
  };

  // --- Renderers ---

  const renderSelectMode = () => (
      <div className="flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => setMode('ai')}
              className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-none text-white transition-all transform active:scale-[0.98] md:col-span-1 md:row-span-1 md:aspect-square"
            >
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-bold mb-1">{t.modeAI}</h3>
                <p className="text-sm text-indigo-100 text-center">{t.modeAIDesc}</p>
            </button>

            <button 
                onClick={() => setMode('manual')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group active:scale-[0.98] md:aspect-square"
            >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <PenTool size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{t.modeManual}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{t.modeManualDesc}</p>
            </button>

            <button 
                onClick={() => setMode('upload')}
                className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group active:scale-[0.98] md:aspect-square"
            >
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud size={24} />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{t.modeUpload}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-tight">{t.modeUploadDesc}</p>
            </button>
          </div>
      </div>
  );

  const renderAiMode = () => (
    <div className="max-w-xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.label}
        </label>
        <div className="relative mb-4">
            <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t.placeholder}
            className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            disabled={isGenerating}
            />
        </div>

        <button
            onClick={handleAiGenerate}
            disabled={!topic.trim() || isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] ${
                !topic.trim() || isGenerating 
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                : 'bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600'
            }`}
        >
            {isGenerating ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>{t.generating}</span>
                </>
            ) : (
                <>
                    <Sparkles size={20} />
                    <span>{t.button}</span>
                </>
            )}
        </button>
        
        {error && (
            <p className="mt-4 text-sm text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                {error}
            </p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-2">{t.ideas}</h3>
        {['Nhập môn Python', 'Marketing Kỹ thuật số 101', 'Yoga cho người mới'].map((idea) => (
            <button
                key={idea}
                onClick={() => setTopic(idea)}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-indigo-100 dark:hover:border-indigo-800 transition-colors"
            >
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 dark:text-orange-400 flex items-center justify-center">
                        <BookOpen size={14} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-200 font-medium text-sm">{idea}</span>
                </div>
                <ArrowRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
            </button>
        ))}
      </div>
    </div>
  );

  const renderUploadMode = () => (
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.uploadLabel}
          </label>
          
          <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors bg-gray-50 dark:bg-gray-800/50">
              <input 
                  type="file" 
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.csv,.md"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isGenerating}
              />
              <div className="flex flex-col items-center pointer-events-none">
                  {selectedFile ? (
                      <>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                            <FileType size={24} />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate max-w-xs">{selectedFile.name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{t.fileSelected}</p>
                      </>
                  ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-full flex items-center justify-center mb-3">
                            <UploadCloud size={24} />
                        </div>
                        <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-1">{t.selectFile}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.supportedFormats}</p>
                      </>
                  )}
              </div>
          </div>

          <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {/* Optional topic hint */}
                  {t.label} (Optional)
              </p>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                disabled={isGenerating}
              />
          </div>

          <button
              onClick={handleAiGenerate}
              disabled={!fileData || isGenerating}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-white flex items-center justify-center space-x-2 transition-all transform active:scale-[0.98] ${
                  !fileData || isGenerating 
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                  : 'bg-indigo-600 dark:bg-indigo-500 shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600'
              }`}
          >
              {isGenerating ? (
                  <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>{t.generating}</span>
                  </>
              ) : (
                  <>
                      <Sparkles size={20} />
                      <span>{t.button}</span>
                  </>
              )}
          </button>
          
          {error && (
              <p className="mt-4 text-sm text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">
                  {error}
              </p>
          )}
      </div>
  );

  const renderLessonEditor = () => {
      const lesson = getEditingLesson();
      if (!lesson || !editingLessonId) return null;

      // Simple heuristic for content detection (HTML vs Markdown)
      const isHtml = /<[a-z][\s\S]*>/i.test(lesson.content || '') && !(lesson.content || '').trim().startsWith('```');

      return (
          <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[100] flex flex-col transition-colors">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { setEditingLessonId(null); setIsEditorPreviewMode(false); }} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                        <span className="ml-1 font-medium hidden md:inline">{t.backToCurriculum}</span>
                    </button>
                  </div>
                  
                  {/* Toggle View */}
                  <div className="flex items-center space-x-2">
                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                          <button 
                              onClick={() => setIsEditorPreviewMode(false)}
                              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!isEditorPreviewMode ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                              <Edit3 size={12} />
                              <span className="hidden md:inline">Editor</span>
                          </button>
                          <button 
                              onClick={() => setIsEditorPreviewMode(true)}
                              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isEditorPreviewMode ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
                          >
                              <Eye size={12} />
                              <span className="hidden md:inline">Preview</span>
                          </button>
                      </div>

                      <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

                      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                        <button 
                            onClick={() => lessonFileInputRef.current?.click()}
                            disabled={isGeneratingLessonContent}
                            className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${isGeneratingLessonContent ? 'opacity-50 cursor-not-allowed' : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'}`}
                            title="Upload file to generate content"
                        >
                             {isGeneratingLessonContent ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                             <span className="hidden md:inline">{isGeneratingLessonContent ? t.uploading : t.generateFromFile}</span>
                        </button>
                        <input 
                            type="file" 
                            ref={lessonFileInputRef} 
                            className="hidden" 
                            accept=".pdf,.txt,.md,.csv,.jpg,.png,.jpeg" // Gemini generic support
                            onChange={handleLessonFileUpload}
                        />
                      </div>
                  </div>

                  <button 
                    onClick={() => { 
                        if (editingLessonId) {
                            // Automatically mark as completed when saving
                            updateLesson(editingLessonId.modId, editingLessonId.lesId, 'isCompleted', true);
                        }
                        setEditingLessonId(null); 
                        setIsEditorPreviewMode(false); 
                    }}
                    className="px-4 py-1.5 bg-white dark:bg-gray-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                     {t.save}
                  </button>
              </div>
              
              <div className="flex-1 overflow-hidden relative">
                  {isEditorPreviewMode ? (
                      <div className="absolute inset-0 p-6 overflow-y-auto prose prose-indigo dark:prose-invert max-w-2xl mx-auto">
                           {isHtml ? (
                               <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
                           ) : (
                               <ReactMarkdown>{lesson.content || '*No content yet*'}</ReactMarkdown>
                           )}
                      </div>
                  ) : (
                      <div className="absolute inset-0 p-4 max-w-4xl mx-auto flex flex-col">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                              {lesson.title || t.lessonTitle}
                          </label>
                          <RichTextEditor 
                             initialContent={lesson.content || ''}
                             onChange={(newContent) => updateLesson(editingLessonId.modId, editingLessonId.lesId, 'content', newContent)}
                             className="flex-1"
                          />
                      </div>
                  )}
              </div>
          </div>
      );
  };

  const renderManualMode = () => (
      <div className="md:grid md:grid-cols-2 md:gap-8 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors space-y-6 md:space-y-0 pb-20 md:pb-6">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Course Info</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.courseTitle}</label>
                <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Advanced Photography"
                />
            </div>

            {/* Thumbnail Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.coverImage}</label>
                <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 h-40">
                    <img 
                        src={manualThumbnail || (manualTitle ? `https://picsum.photos/seed/${manualTitle.replace(/\s/g, '')}/400/300` : 'https://picsum.photos/400/300')} 
                        alt="Course Thumbnail" 
                        className="w-full h-full object-cover transition-opacity group-hover:opacity-70"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-black/50 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center space-x-2 backdrop-blur-sm cursor-pointer pointer-events-none">
                            <ImageIcon size={16} />
                            <span>{t.changeCover}</span>
                         </div>
                    </div>
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Trạng thái (Status)</label>
                    <select
                        value={manualStatus}
                        onChange={(e) => setManualStatus(e.target.value as 'draft' | 'published')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="draft">Bản nháp</option>
                        <option value="published">Đã xuất bản</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chế độ (Visibility)</label>
                    <select
                        value={manualVisibility}
                        onChange={(e) => setManualVisibility(e.target.value as 'public' | 'private')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="private">Riêng tư</option>
                        <option value="public">Công khai</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.category}</label>
                    <input
                        type="text"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.duration}</label>
                    <input type="text" disabled className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed" value="Auto" />
                </div>
            </div>
          
          {error && (
              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center animate-pulse">
                  <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                  <span>{error}</span>
              </div>
          )}
          </div>

          {/* Section 2: Curriculum Builder */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 md:pt-0 md:border-t-0 md:border-l md:pl-8">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">{t.curriculum}</h3>
             
             <div className="space-y-6">
                {manualModules.map((module, mIdx) => {
                    const isDragOver = dragOverId === module.id;
                    const isJustMoved = lastMovedId === module.id;
                    
                    return (
                        <div 
                            key={module.id} 
                            draggable
                            onDragStart={(e) => onModuleDragStart(e, module.id)}
                            onDragOver={(e) => onModuleDragOver(e, module.id)}
                            onDrop={(e) => onModuleDrop(e, module.id)}
                            className={`rounded-2xl p-4 border transition-all duration-200 ease-in-out ${
                                isDragOver 
                                ? 'border-2 border-indigo-500 border-t-indigo-500 border-r-indigo-500 border-b-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 scale-[1.02] shadow-lg z-10' 
                                : isJustMoved
                                    ? 'border-2 border-green-500 ring-4 ring-green-100 dark:ring-green-900/30 bg-green-50/50 dark:bg-green-900/10'
                                    : 'border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-750/30 hover:border-gray-200 dark:hover:border-gray-600'
                            } ${draggedItem?.id === module.id ? 'opacity-40 border-dashed border-2' : ''}`}
                        >
                            <div className="flex items-center space-x-2 mb-3">
                                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-indigo-500">
                                    <GripVertical size={16} />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                    {mIdx + 1}
                                </div>
                                <input
                                    type="text"
                                    value={module.title}
                                    onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                                    className="flex-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm font-bold text-gray-800 dark:text-gray-200 placeholder-gray-400"
                                    placeholder={t.moduleTitle}
                                />
                                <button onClick={() => deleteModule(module.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Lessons List */}
                            <div className="space-y-3 pl-6">
                                {module.lessons.map((lesson, lIdx) => {
                                    const isLessonDragOver = dragOverId === lesson.id;
                                    const isLessonJustMoved = lastMovedId === lesson.id;
                                    
                                    return (
                                        <div 
                                            key={lesson.id} 
                                            draggable
                                            onDragStart={(e) => onLessonDragStart(e, lesson.id, module.id)}
                                            onDragOver={(e) => onLessonDragOver(e, lesson.id, module.id)}
                                            onDrop={(e) => onLessonDrop(e, lesson.id, module.id)}
                                            className={`rounded-xl p-3 shadow-sm border transition-all duration-200 ease-in-out ${
                                                isLessonDragOver
                                                ? 'border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 scale-[1.02] shadow-md z-10'
                                                : isLessonJustMoved
                                                    ? 'border-2 border-green-500 bg-green-50/50 dark:bg-green-900/10 ring-2 ring-green-100 dark:ring-green-900/30'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                            } ${draggedItem?.id === lesson.id ? 'opacity-40 border-dashed border-2' : ''}`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-500">
                                                    <GripVertical size={14} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={lesson.title}
                                                    onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                                                    className="flex-1 bg-transparent border-b border-gray-100 dark:border-gray-700 focus:border-indigo-500 outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 pb-1"
                                                    placeholder={t.lessonTitle}
                                                />
                                                <input 
                                                    type="text"
                                                    value={lesson.duration}
                                                    onChange={(e) => updateLesson(module.id, lesson.id, 'duration', e.target.value)}
                                                    className="w-16 bg-transparent border-b border-gray-100 dark:border-gray-700 focus:border-indigo-500 outline-none text-xs text-right text-gray-500 pb-1"
                                                    placeholder="5m"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between pl-6">
                                                <button 
                                                    onClick={() => setEditingLessonId({modId: module.id, lesId: lesson.id})}
                                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${lesson.content ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'bg-gray-50 dark:bg-gray-700 text-gray-500'}`}
                                                >
                                                    <FileText size={12} />
                                                    <span>{t.editContent}</span>
                                                    {lesson.isCompleted ? (
                                                        <CheckCircle size={14} className="text-green-500 ml-1" />
                                                    ) : lesson.content && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-1"></div>
                                                    )}
                                                </button>
                                                <button onClick={() => deleteLesson(module.id, lesson.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Add Lesson Button */}
                            <button 
                                onClick={() => addLesson(module.id)}
                                className="mt-3 ml-6 flex items-center space-x-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-lg transition-colors w-fit"
                            >
                                <Plus size={14} />
                                <span>{t.addLesson}</span>
                            </button>
                        </div>
                    );
                })}
             </div>

             <button 
                onClick={addModule}
                className="mt-6 w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 font-bold text-sm flex items-center justify-center space-x-2 hover:border-indigo-500 hover:text-indigo-500 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-all"
            >
                <Plus size={18} />
                <span>{t.addModule}</span>
             </button>
          </div>
          
          <div className="fixed bottom-0 left-0 right-0 md:static md:col-span-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 md:border-t-0 md:bg-transparent md:p-0 z-20">
             <button 
                 onClick={handleManualCreate}
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98]"
             >
                 {initialData ? t.updateManual : t.save}
             </button>
             {initialData && onDeleteCourse && (
                 <button 
                     onClick={(e) => {
                         const btn = e.currentTarget;
                         if (btn.dataset.confirm === 'true') {
                             onDeleteCourse(initialData.id);
                         } else {
                             btn.dataset.confirm = 'true';
                             btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg><span>Nhấn lần nữa để xác nhận xóa vĩnh viễn</span>';
                             setTimeout(() => {
                                 if (btn) {
                                     btn.dataset.confirm = 'false';
                                     btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg><span>Xóa toàn bộ khóa học</span>';
                                 }
                             }, 3000);
                         }
                     }}
                     className="w-full py-4 mt-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                 >
                     <Trash2 size={20} />
                     <span>Xóa toàn bộ khóa học</span>
                 </button>
             )}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 pt-14 px-5 transition-colors duration-200">
      {renderLessonEditor()}

      <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-xl flex">
              <button 
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'create' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                  {t.tabCreate}
              </button>
              <button 
                onClick={() => setActiveTab('my-courses')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'my-courses' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                  {t.tabMyCourses}
              </button>
          </div>
      </div>

      {activeTab === 'create' ? (
          <div>
              {mode !== 'select' && (
                  <button 
                    onClick={() => {
                        if (mode === 'manual' && initialData) {
                             if (onCancel) onCancel();
                        } else {
                             setMode('select');
                             resetManualForm();
                        }
                    }} 
                    className="mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                      <ArrowLeft size={18} className="mr-1" />
                      <span>{t.backToCurriculum}</span>
                  </button>
              )}

              {mode === 'select' && renderSelectMode()}
              {mode === 'ai' && renderAiMode()}
              {mode === 'upload' && renderUploadMode()}
              {mode === 'manual' && renderManualMode()}
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.length > 0 ? (
                  myCourses.map(course => (
                      <CourseCard key={course.id} course={course} onClick={onCourseClick || (() => {})} />
                  ))
              ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60">
                      <LayoutGrid size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">Bạn chưa tạo khóa học nào.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

export default CourseGenerator;
