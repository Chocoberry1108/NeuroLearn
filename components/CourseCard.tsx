import React, { useState } from 'react';
import { PlayCircle, Star, Users, Bot, PenTool, Lock, Globe, FileEdit, Share2, Check } from 'lucide-react';
import { Course } from '../types';

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?courseId=${course.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
        console.error("Failed to copy", err);
    });
  };

  return (
    <div 
      onClick={() => onClick(course)}
      title={course.description}
      className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:scale-[1.03] transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.98] transform group h-full flex flex-col relative"
    >
      <div className="relative h-32 w-full shrink-0 overflow-hidden">
        <img 
          src={course.thumbnail} 
          alt={course.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            if (!e.currentTarget.src.includes('picsum.photos')) {
              e.currentTarget.src = `https://picsum.photos/seed/${encodeURIComponent(course.title)}/400/300`;
            }
          }}
        />
        
        {/* Share Button */}
        <button
            onClick={handleShare}
            className={`absolute top-2 left-2 p-1.5 backdrop-blur-md rounded-full text-white transition-all duration-300 z-30 shadow-sm flex items-center justify-center ${
                isCopied ? 'bg-green-500/90' : 'bg-black/30 hover:bg-black/60'
            } ${isCopied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            title="Share Course"
        >
            {isCopied ? <Check size={14} /> : <Share2 size={14} />}
        </button>

        {/* Description Tooltip Overlay */}
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px] p-4 flex flex-col items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <p className="text-white text-xs font-medium leading-relaxed line-clamp-3 mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            {course.description}
          </p>
          <div className="transform scale-75 group-hover:scale-100 transition-transform duration-300 delay-100 bg-white/20 rounded-full p-1.5 backdrop-blur-sm">
             <PlayCircle className="text-white w-5 h-5" fill="currentColor" fillOpacity={0.2} />
          </div>
        </div>
        
        {/* Badges Container */}
        <div className="absolute top-2 right-2 flex flex-col items-end space-y-1.5 z-20">
            {/* Status Badge */}
            {course.status === 'draft' && (
                <div className="bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                    <FileEdit size={10} />
                    <span>Bản nháp</span>
                </div>
            )}
            
            {course.status === 'published' && (
                 course.visibility === 'private' ? (
                    <div className="bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                        <Lock size={10} />
                        <span>Riêng tư</span>
                    </div>
                 ) : (
                    <div className="bg-blue-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                        <Globe size={10} />
                        <span>Công khai</span>
                    </div>
                 )
            )}

            {/* Origin Badge */}
            {course.isGenerated ? (
                <div className="bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                    <Bot size={10} />
                    <span>AI</span>
                </div>
            ) : (
                <div className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center space-x-1">
                    <PenTool size={10} />
                    <span>Thủ công</span>
                </div>
            )}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide truncate max-w-[70%]">{course.category}</span>
            <div className="flex items-center space-x-1 text-yellow-500">
                <Star size={12} fill="currentColor" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{course.rating > 0 ? course.rating : 'New'}</span>
            </div>
        </div>
        <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-1 line-clamp-2 leading-tight flex-1">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
          bởi {course.author}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-2">
             <div className="flex items-center text-gray-400 dark:text-gray-500 space-x-1">
                <Users size={12} />
                <span className="text-[10px]">{course.students.toLocaleString()} học viên</span>
             </div>
             {course.progress > 0 && (
                 <div className="flex items-center space-x-2">
                     <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                         <div className="h-full bg-green-500 rounded-full" style={{ width: `${course.progress}%` }}></div>
                     </div>
                     <span className="text-[10px] text-gray-500 dark:text-gray-400">{course.progress}%</span>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;