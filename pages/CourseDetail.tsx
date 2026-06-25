
import React, { useState, useRef, useEffect } from 'react';
import { Course, Module, Lesson, Language, VerificationResult } from '../types';
import { ChevronLeft, PlayCircle, CheckCircle, Lock, Clock, BookOpen, ChevronDown, ChevronUp, ArrowLeft, Users, Star, Sparkles, Loader2, Link as LinkIcon, Youtube, ShieldCheck, AlertTriangle, Check, Camera, Edit2, Save, X, Globe, FileEdit, LayoutTemplate, ArrowRight, Image as ImageIcon, Bot } from 'lucide-react';
import { generateLessonContent, verifyLessonContent, extractYouTubeId } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CourseCard from '../components/CourseCard';
import RichTextEditor from '../components/RichTextEditor';

interface CourseDetailProps {
  course: Course;
  allCourses?: Course[];
  onCourseClick?: (course: Course) => void;
  onBack: () => void;
  language?: Language;
  onLessonComplete?: (courseId: string, moduleId: string, lessonId: string) => void;
  onCourseUpdate?: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  commonT?: any;
}

const CourseDetail: React.FC<CourseDetailProps> = ({ 
    course, 
    allCourses = [], 
    onCourseClick, 
    onBack, 
    language = 'vi', 
    onLessonComplete,
    onCourseUpdate,
    onEditCourse,
    commonT = { edit: 'Edit', save: 'Save', cancel: 'Cancel', editing: 'Editing', markdownSupport: 'Markdown' }
}) => {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(course.modules[0]?.id || null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [lessonSources, setLessonSources] = useState<{title: string, uri: string}[]>([]);
  const [lessonVideos, setLessonVideos] = useState<{title: string, videoId: string}[]>([]);
  const [lessonImages, setLessonImages] = useState<{title: string, url: string}[]>([]);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const relatedCourses = allCourses
    .filter(c => c.id !== course.id)
    .sort((a, b) => (b.category === course.category ? 1 : 0) - (a.category === course.category ? 1 : 0))
    .slice(0, 5);

  const handleLessonSelect = (lesson: Lesson, moduleId: string) => {
    setSelectedLesson(lesson);
    setSelectedModuleId(moduleId);
    setVerificationResult(null);
    setIsEditing(false);
    setIsSourcesExpanded(false);
    
    if (lesson.content) {
      const sanitized = lesson.content.replace(/\\n/g, '\n');
      setLessonContent(sanitized);
      setLessonSources(lesson.sources || []);
      setLessonVideos(lesson.videos || []);
      setLessonImages(lesson.images || []);
    } else {
      setLessonContent("");
      setLessonSources([]);
      setLessonVideos([]);
      setLessonImages([]);
    }
  };

  const handleGenerateContent = async () => {
    if (!selectedLesson || loadingLesson) return;
    setLoadingLesson(true);
    setVerificationResult(null);
    try {
      const result = await generateLessonContent(course.title, selectedLesson.title, language as Language);
      setLessonContent(result.content);
      setLessonSources(result.sources);
      setLessonVideos(result.videos);
      setLessonImages(result.images);
      
      if (onCourseUpdate && selectedModuleId) {
          updateCourseContent(selectedModuleId, selectedLesson.id, result.content, result.sources, result.videos, result.images);
      }
    } catch (e) {
      setLessonContent("");
    } finally {
      setLoadingLesson(false);
    }
  };

  const handleVerifyContent = async () => {
    if (!lessonContent || isVerifying) return;
    setIsVerifying(true);
    try {
        const result = await verifyLessonContent(lessonContent, language as Language);
        setVerificationResult(result);
    } catch (e) {
        console.error(e);
    } finally {
        setIsVerifying(false);
    }
  };

  const handleCompleteLesson = () => {
    if (onLessonComplete && selectedLesson && selectedModuleId) {
        onLessonComplete(course.id, selectedModuleId, selectedLesson.id);
    }
  };

  const handleNextLesson = () => {
      if (!selectedLesson || !selectedModuleId) return;
      const currentModuleIndex = course.modules.findIndex(m => m.id === selectedModuleId);
      if (currentModuleIndex === -1) return;
      const currentModule = course.modules[currentModuleIndex];
      const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === selectedLesson.id);

      if (currentLessonIndex < currentModule.lessons.length - 1) {
          handleLessonSelect(currentModule.lessons[currentLessonIndex + 1], selectedModuleId);
      } else if (currentModuleIndex < course.modules.length - 1) {
          const nextModule = course.modules[currentModuleIndex + 1];
          if (nextModule.lessons.length > 0) {
              setActiveModuleId(nextModule.id);
              handleLessonSelect(nextModule.lessons[0], nextModule.id);
          }
      } else {
          setSelectedLesson(null);
      }
  };

  const handleRateLesson = (rating: number) => {
    if (!selectedLesson || !selectedModuleId || !onCourseUpdate) return;
    const newModules = course.modules.map(mod => mod.id !== selectedModuleId ? mod : {
        ...mod,
        lessons: mod.lessons.map(les => les.id !== selectedLesson.id ? les : { ...les, userRating: rating })
    });
    onCourseUpdate({ ...course, modules: newModules });
  };

  const updateCourseContent = (moduleId: string, lessonId: string, content: string, sources?: any[], videos?: any[], images?: any[]) => {
      if (!onCourseUpdate) return;
      const newModules = course.modules.map(mod => mod.id !== moduleId ? mod : {
          ...mod,
          lessons: mod.lessons.map(les => les.id !== lessonId ? les : { ...les, content, sources, videos, images })
      });
      onCourseUpdate({ ...course, modules: newModules });
  };

  const renderContent = (content: string) => {
    const sanitized = content.replace(/\\n/g, '\n');
    // Prefer Markdown for better component rendering (Images, etc) unless explicitly pure HTML structure
    const isPureHtml = /^\s*<(!doctype|html|head|body)/i.test(sanitized);

    return (
        <div className="prose prose-indigo dark:prose-invert prose-lg max-w-none leading-relaxed text-gray-800 dark:text-gray-200">
            {isPureHtml ? (
                <div dangerouslySetInnerHTML={{ __html: sanitized }} />
            ) : (
                <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        img: ({node, ...props}) => (
                            <span className="flex flex-col items-center justify-center my-8 md:my-10 relative group w-full text-center">
                                <img 
                                    {...props} 
                                    className="w-[90%] md:w-[80%] rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mx-auto object-contain max-h-[500px] bg-white dark:bg-gray-800" 
                                    onError={(e) => {
                                        // Hide broken images automatically
                                        (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                                    }}
                                />
                                {props.alt && (
                                    <span className="block text-center text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium px-4">
                                        {props.alt}
                                    </span>
                                )}
                            </span>
                        ),
                        p: ({node, ...props}) => <p className="mb-4" {...props} />,
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-8 mb-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-6 mb-3" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400" {...props} />
                    }}
                >
                    {sanitized}
                </ReactMarkdown>
            )}
        </div>
    );
  };

  if (selectedLesson) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedLesson(null)}
        />
        
        {/* Modal Content */}
        <div className="w-full max-w-4xl h-full md:h-[95vh] bg-white dark:bg-gray-900 shadow-2xl relative flex flex-col md:rounded-2xl overflow-hidden transform transition-all animate-page-enter">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-30 shrink-0">
                <div className="flex items-center space-x-4 flex-1">
                    <button onClick={() => setSelectedLesson(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ChevronLeft size={24} className="text-gray-900 dark:text-white" />
                    </button>
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{selectedLesson.title}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{course.title}</p>
                    </div>
                </div>
                
                {course.isCreatedByUser && !isEditing && lessonContent && (
                    <button 
                        onClick={() => { setEditedContent(lessonContent); setIsEditing(true); }}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                    >
                        <Edit2 size={16} />
                        <span className="text-xs font-bold">{commonT.edit}</span>
                    </button>
                )}
                
                {isEditing && (
                    <div className="flex items-center space-x-2">
                        <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                            <X size={20} />
                        </button>
                        <button onClick={() => {
                            setLessonContent(editedContent);
                            setIsEditing(false);
                            updateCourseContent(selectedModuleId!, selectedLesson.id, editedContent);
                        }} className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors">
                            <Save size={16} />
                            <span>{commonT.save}</span>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="p-6 md:p-10 flex-1 overflow-y-auto">
                {loadingLesson ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[50vh]">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Neuro AI đang tìm kiếm hình ảnh & video...</p>
                    </div>
                ) : isEditing ? (
                    <RichTextEditor initialContent={editedContent} onChange={setEditedContent} className="min-h-[500px]" />
                ) : lessonContent ? (
                    <div className="animate-page-enter pb-32">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 border-b border-gray-100 dark:border-gray-800 pb-4">{selectedLesson.title}</h1>
                        
                        {/* Render content including inline images */}
                        {renderContent(lessonContent)}

                        {/* Images Gallery from Google Search */}
                        {lessonImages.length > 0 && (
                            <div className="mt-8 mb-8">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                                    <ImageIcon size={12} className="mr-2 text-indigo-500" />
                                    Hình ảnh minh họa
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {lessonImages.map((img, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100 dark:bg-gray-800 cursor-zoom-in">
                                            <img 
                                                src={img.url} 
                                                alt={img.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                onError={(e) => (e.currentTarget.parentElement as HTMLElement).style.display = 'none'}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                <p className="text-xs text-white font-medium line-clamp-1">{img.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Video từ YouTube */}
                        {lessonVideos.length > 0 && (
                            <div className="mt-8 mb-8">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                                    <Youtube size={12} className="mr-2 text-red-500" />
                                    Video bài giảng liên quan
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {lessonVideos
                                        .map(v => ({ ...v, videoId: extractYouTubeId(v.videoId) }))
                                        .filter(v => v.videoId)
                                        .map((video, idx) => (
                                        <div key={idx} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <iframe
                                                width="100%"
                                                height="200"
                                                src={`https://www.youtube.com/embed/${video.videoId}`}
                                                title={video.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50">
                                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{video.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grounding Sources (Google Search) */}
                        {lessonSources.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                                    <LinkIcon size={12} className="mr-2" />
                                    Nguồn tham khảo từ Google Search
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {lessonSources.map((source, idx) => (
                                        <a 
                                            key={idx} 
                                            href={source.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <Globe size={14} className="shrink-0" />
                                            <span className="truncate">{source.title}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">ĐÁNH GIÁ BÀI HỌC NÀY</p>
                            <div className="flex items-center space-x-3">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => handleRateLesson(star)} className="p-1 hover:scale-110 transition-transform">
                                        <Star size={32} className={`${(selectedLesson.userRating || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {!verificationResult && (
                            <div className="mt-8 flex justify-center">
                                <button onClick={handleVerifyContent} disabled={isVerifying} className="flex items-center space-x-2 px-6 py-2.5 rounded-full text-xs font-bold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-all">
                                    {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                                    <span>Xác minh bằng Google Search</span>
                                </button>
                            </div>
                        )}
                        
                        {verificationResult && (
                            <div className={`mt-8 p-4 rounded-2xl border ${verificationResult.status === 'ACCURATE' ? 'bg-green-50 border-green-100 dark:bg-green-900/10' : 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/10'}`}>
                                <h4 className="text-sm font-bold flex items-center mb-2">
                                    {verificationResult.status === 'ACCURATE' ? <CheckCircle size={16} className="text-green-600 mr-2" /> : <AlertTriangle size={16} className="text-yellow-600 mr-2" />}
                                    {verificationResult.status === 'ACCURATE' ? 'Thông tin chính xác' : 'Cần lưu ý'}
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">{verificationResult.analysis}</p>
                                
                                {verificationResult.sources && verificationResult.sources.length > 0 && (
                                    <div className="space-y-1 border-t border-black/5 dark:border-white/5 pt-3">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nguồn xác minh:</p>
                                        {verificationResult.sources.map((source, sIdx) => (
                                            <a key={sIdx} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">
                                                <LinkIcon size={10} />
                                                <span className="truncate">{source.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                        <Sparkles size={48} className="text-indigo-600 mb-4 opacity-20" />
                        <h3 className="text-xl font-bold mb-2">Làm phong phú bài học</h3>
                        <p className="text-sm text-gray-500 mb-6 px-10">AI sẽ tự động tìm kiếm hình ảnh minh họa và video bài giảng từ Google cho bạn.</p>
                        <button onClick={handleGenerateContent} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center space-x-2">
                            <Bot className="w-5 h-5" />
                            <span>Bổ sung Hình ảnh & Video AI</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center space-x-3 z-30 shrink-0">
                <button 
                    onClick={handleCompleteLesson} 
                    disabled={!lessonContent || loadingLesson}
                    className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-[0.98] ${
                        !lessonContent || loadingLesson ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 dark:opacity-90'
                    }`}
                >
                    Hoàn thành bài học
                </button>
                
                <button
                    onClick={() => { handleCompleteLesson(); handleNextLesson(); }}
                    disabled={!lessonContent || loadingLesson}
                    className={`flex-1 py-4 px-4 rounded-xl border-2 font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.98] ${
                        !lessonContent || loadingLesson ? 'border-gray-100 text-gray-300 dark:border-gray-800' : 'border-gray-200 text-gray-800 dark:border-gray-700 dark:text-white hover:bg-gray-50'
                    }`}
                >
                    <span className="text-sm">Tiếp theo</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-0 relative">
      <div className="md:flex md:h-screen">
        <div className="md:w-1/3 md:overflow-y-auto md:border-r border-gray-200 dark:border-gray-700">
            <div className="relative h-64 md:h-72 bg-gray-900 group">
                <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover opacity-60" 
                    onError={(e) => {
                        if (!e.currentTarget.src.includes('picsum.photos')) {
                            e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(course.title)}/400/300`;
                        }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 z-10"><ArrowLeft size={20} /></button>
                <button onClick={() => fileInputRef.current?.click()} className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md rounded-full text-white z-20"><Camera size={20} /></button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onCourseUpdate) {
                        const reader = new FileReader();
                        reader.onloadend = () => onCourseUpdate({ ...course, thumbnail: reader.result as string });
                        reader.readAsDataURL(file);
                    }
                }} />

                <div className="absolute bottom-6 left-6 right-6">
                    <span className="inline-block px-2 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider mb-2">{course.category}</span>
                    <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
                    <div className="flex items-center text-gray-300 text-xs space-x-4">
                        <span className="flex items-center"><Users size={12} className="mr-1"/> {course.students}</span>
                        <span className="flex items-center"><Star size={12} className="mr-1 text-yellow-400"/> {course.rating}</span>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6 space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <img src={`https://ui-avatars.com/api/?name=${course.author}&background=random`} alt={course.author} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Giảng viên</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-white">{course.author}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Tiến độ</p>
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{course.progress}%</p>
                    </div>
                </div>

                {course.isCreatedByUser && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">CÀI ĐẶT KHÓA HỌC</h3>
                        <div className="grid grid-cols-1 mb-3">
                            <button onClick={() => onEditCourse?.(course)} className="flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                                <FileEdit size={24} className="mb-2" />
                                <span className="text-sm font-bold">Chỉnh sửa khóa học</span>
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Giới thiệu</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{course.description}</p>
                </div>
            </div>
        </div>

        <div className="md:flex-1 md:overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
            <div className="p-6 md:p-8 md:max-w-3xl md:mx-auto">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Giáo trình</h2>
                <div className="space-y-4">
                    {course.modules.map((module, idx) => {
                        const isActive = activeModuleId === module.id;
                        return (
                            <div key={module.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-all">
                                <button onClick={() => setActiveModuleId(isActive ? null : module.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                        <div className="text-left">
                                            <h3 className="text-sm font-bold dark:text-white">{module.title}</h3>
                                            <p className="text-[10px] text-gray-400">{module.lessons.length} bài học</p>
                                        </div>
                                    </div>
                                    {isActive ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>
                                {isActive && (
                                    <div className="border-t border-gray-50 dark:border-gray-700">
                                        {module.lessons.map((lesson) => (
                                            <button key={lesson.id} onClick={() => handleLessonSelect(lesson, module.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    {lesson.isCompleted ? <CheckCircle size={18} className="text-green-500" /> : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-200" />}
                                                    <p className={`text-sm font-medium ${lesson.isCompleted ? 'text-gray-400 line-through' : 'dark:text-gray-200'}`}>{lesson.title}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400">{lesson.duration}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
