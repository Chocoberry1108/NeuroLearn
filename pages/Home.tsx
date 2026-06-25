
import React, { useState } from 'react';
import { Course, User, Language } from '../types';
import CourseCard from '../components/CourseCard';
import { Bell, Flame, Calendar, Clock, Check, Snowflake } from 'lucide-react';

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
  const [isStreakOpen, setIsStreakOpen] = useState(false);

  const days = language === 'vi' 
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] 
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const isCompletedToday = user.xpToday >= user.dailyGoal;

  return (
    <div className="pb-24 pt-14 md:pt-8 px-5 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative">
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t.hello}, {user.name} 👋</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.ready}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
            {/* Streak Area */}
            <div className="relative">
                <button 
                  onClick={() => setIsStreakOpen(!isStreakOpen)}
                  className={`flex items-center space-x-1.5 font-bold transition-all p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 ${isCompletedToday ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                >
                    <Flame size={24} fill="currentColor" />
                    <h3 className="text-lg m-0">{user.streak}</h3>
                </button>

                {/* Streak Dropdown Popover */}
                {isStreakOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsStreakOpen(false)} />
                        <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-gray-100 dark:border-gray-700 p-6 z-50 animate-fade-in origin-top-right">
                             {/* Arrow */}
                             <div className="absolute -top-2 right-8 w-4 h-4 bg-white dark:bg-gray-800 border-t-2 border-l-2 border-gray-100 dark:border-gray-700 transform rotate-45"></div>
                             
                             <div className="flex items-center space-x-4 mb-6">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center relative">
                                    <Flame size={40} className={isCompletedToday ? "text-orange-500" : "text-gray-300 dark:text-gray-600"} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{user.streak} {language === 'vi' ? 'Ngày' : 'Days'}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight mt-1">
                                        {language === 'vi' ? 'Hoàn thành bài học mỗi ngày để duy trì chuỗi' : 'Complete a lesson every day to build your streak'}
                                    </p>
                                </div>
                             </div>

                             {/* Week Calendar */}
                             <div className="flex justify-between items-center px-1">
                                {user.streakStatus.map((status, index) => {
                                    const todayIndex = (new Date().getDay() + 6) % 7;
                                    const isToday = index === todayIndex; 
                                    return (
                                        <div key={index} className="flex flex-col items-center space-y-2">
                                            <span className={`text-[11px] font-bold ${isToday ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                                                {days[index]}
                                            </span>
                                            
                                            <div className="relative w-8 h-8 flex items-center justify-center">
                                                {status === 'completed' || (isToday && isCompletedToday) ? (
                                                    <div className="w-full h-full bg-orange-500 rounded-full flex items-center justify-center text-white">
                                                        <Check size={16} strokeWidth={4} />
                                                    </div>
                                                ) : status === 'frozen' ? (
                                                     <div className="w-full h-full bg-blue-400 rounded-full flex items-center justify-center text-white">
                                                        <Snowflake size={16} />
                                                    </div>
                                                ) : isToday ? (
                                                    <div className="w-full h-full rounded-full border-[3px] border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                                        
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-white opacity-50">
                                                        <Check size={16} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        </div>
                    </>
                )}
            </div>

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
