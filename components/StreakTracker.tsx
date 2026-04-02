import React from 'react';
import { Flame, Check, Zap, Snowflake } from 'lucide-react';
import { User, Language } from '../types';

interface StreakTrackerProps {
  user: User;
  t: any;
  language: Language;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ user, t, language }) => {
  const days = language === 'vi' 
    ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] 
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Calculate percentage for the daily ring
  const progressPercentage = Math.min(100, Math.round((user.xpToday / user.dailyGoal) * 100));
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border-2 border-gray-100 dark:border-gray-700 mb-8 transition-colors">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
            <div className="relative">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-500 dark:text-orange-400">
                    <Flame size={28} fill="currentColor" className="animate-pulse" />
                </div>
                {/* Sparkle effects */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                    {user.streak} {language === 'vi' ? 'Ngày' : 'Days'}
                </h2>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {language === 'vi' ? 'Chuỗi hiện tại' : 'Current Streak'}
                </p>
            </div>
        </div>

        <div className="text-right">
             <div className="flex items-center justify-end space-x-1 text-indigo-600 dark:text-indigo-400 mb-0.5">
                <Zap size={16} fill="currentColor" />
                <span className="text-lg font-black">{user.xpToday} / {user.dailyGoal}</span>
             </div>
             <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                XP {language === 'vi' ? 'Hôm nay' : 'Today'}
             </p>
        </div>
      </div>

      {/* Week Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {user.streakStatus.map((status, index) => {
            const isToday = index === 3; // Mocking today as the 4th item for demo
            
            return (
                <div key={index} className="flex flex-col items-center space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{days[index]}</span>
                    
                    <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                        {status === 'completed' ? (
                            <div className="w-full h-full bg-orange-500 rounded-full shadow-[0_4px_0_rgb(194,65,12)] flex items-center justify-center text-white transform active:translate-y-1 active:shadow-none transition-all">
                                <Check size={20} strokeWidth={4} />
                            </div>
                        ) : status === 'frozen' ? (
                             <div className="w-full h-full bg-blue-400 rounded-full shadow-[0_4px_0_rgb(29,78,216)] flex items-center justify-center text-white">
                                <Snowflake size={20} />
                            </div>
                        ) : isToday ? (
                            // Today's Progress Ring
                            <div className="relative w-full h-full flex items-center justify-center">
                                <svg className="transform -rotate-90 w-full h-full">
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="transparent"
                                        className="text-gray-200 dark:text-gray-700"
                                    />
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r={radius}
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="text-orange-500 transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {progressPercentage >= 100 ? (
                                        <Check size={16} className="text-orange-500 font-bold" />
                                    ) : (
                                        <Flame size={16} className="text-gray-300 dark:text-gray-600" />
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Future/Missed Day
                            <div className="w-full h-full rounded-full border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                <Flame size={18} className="text-gray-200 dark:text-gray-700" />
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
      
      {/* Motivational Text */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
             {progressPercentage >= 100 
                ? (language === 'vi' ? '🔥 Bạn đang bùng cháy! Đã hoàn thành mục tiêu!' : '🔥 You are on fire! Daily goal reached!')
                : (language === 'vi' ? '💪 Chỉ còn một chút nữa để giữ lửa chuỗi!' : '💪 Just a bit more to keep the streak alive!')
             }
          </p>
      </div>
    </div>
  );
};

export default StreakTracker;