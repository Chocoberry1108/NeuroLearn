
import React from 'react';
import { Course, User, Language } from '../types';
import CourseCard from '../components/CourseCard';
import { Bell, Flame, Calendar, Clock } from 'lucide-react';
import StreakTracker from '../components/StreakTracker';

interface HomeProps {
  user: User;
  courses: Course[];
  onCourseClick: (course: Course) => void;
  t: any;
  language: Language;
  onOpenNotif: () => void;
  unreadCount: number;
}

const Home: React.FC<HomeProps> = ({ user, courses, onCourseClick, t, language, onOpenNotif, unreadCount }) => {
  const ongoingCourses = courses.filter(c => c.progress > 0 && c.progress < 100);
  const recommendedCourses = courses.filter(c => c.progress === 0);

  const deadlineLabel = language === 'vi' ? 'Hạn chót học tập' : 'Learning Deadlines';

  return (
    <div className="pb-24 pt-14 md:pt-8 px-5 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t.hello}, {user.name} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.ready}</p>
        </div>
        <div className="flex items-center space-x-3">
            <button 
              onClick={onOpenNotif}
              className="relative p-2.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:scale-105 active:scale-95 group"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-indigo-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-gray-900 text-[10px] font-bold text-white flex items-center justify-center px-1">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
            <StreakTracker user={user} t={t} language={language} />
        </div>
        {/* Simple Deadline Widget */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                    <Calendar size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{deadlineLabel}</span>
            </div>
            <div>
                <h3 className="text-lg font-bold mb-1">UI Design: Tools</h3>
                <div className="flex items-center space-x-2 text-xs opacity-80">
                    <Clock size={12} />
                    <span>Hết hạn trong 2 giờ nữa</span>
                </div>
            </div>
            <button className="mt-6 w-full py-3 bg-white text-indigo-600 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                {language === 'vi' ? 'Học ngay' : 'Learn Now'}
            </button>
        </div>
      </div>

      {/* Ongoing */}
      {ongoingCourses.length > 0 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t.continue}</h2>
            <button className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">{t.seeAll}</button>
          </div>
          <div className="flex overflow-x-auto space-x-4 pb-4 -mx-5 px-5 md:mx-0 md:px-0 no-scrollbar">
             {ongoingCourses.map(course => (
                 <div key={course.id} className="min-w-[260px] md:min-w-[300px]">
                     <CourseCard course={course} onClick={onCourseClick} />
                 </div>
             ))}
          </div>
        </div>
      )}

      {/* Recommended */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t.recommended}</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {recommendedCourses.map(course => (
                <CourseCard key={course.id} course={course} onClick={onCourseClick} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
