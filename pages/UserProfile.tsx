import React from 'react';
import { ArrowLeft, Award, BookOpen, Flame, MapPin, Share2, Star, ShieldCheck, Zap, Heart, Check, Sparkles } from 'lucide-react';
import { Course, Language } from '../types';
import CourseCard from '../components/CourseCard';

interface UserProfileProps {
  profileUser: {
    uid?: string;
    name: string;
    avatar: string;
    headline?: string;
    streak: number;
    points: number;
    xpToday?: number;
    isInstructor?: boolean;
    bio?: string;
    location?: string;
  };
  courses: Course[];
  onBack: () => void;
  onCourseClick: (course: Course) => void;
  language: Language;
}

const UserProfile: React.FC<UserProfileProps> = ({
  profileUser,
  courses,
  onBack,
  onCourseClick,
  language
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  // Filter courses created/authored by this user
  const authoredCourses = courses.filter(
    c => c.author.toLowerCase() === profileUser.name.toLowerCase()
  );

  // If they are not an instructor or don't have authored courses, show learning courses
  const enrolledCourses = courses.filter(
    c => c.progress > 0 && c.author.toLowerCase() !== profileUser.name.toLowerCase()
  );

  const handleShare = () => {
    const url = `${window.location.origin}?userId=${profileUser.uid || encodeURIComponent(profileUser.name)}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const isVi = language === 'vi';

  // Stats summary calculations
  const totalStudents = authoredCourses.reduce((sum, c) => sum + c.students, 0);
  const avgRating = authoredCourses.length > 0
    ? (authoredCourses.reduce((sum, c) => sum + c.rating, 0) / authoredCourses.length).toFixed(1)
    : '4.8';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 transition-colors duration-200">
      {/* Cover / Header Banner */}
      <div className="relative h-44 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
        <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
        
        {/* Navigation Bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            onClick={onBack}
            className="p-2.5 bg-white/20 dark:bg-black/30 backdrop-blur-md text-white rounded-xl hover:bg-white/35 active:scale-95 transition-all shadow-md flex items-center justify-center"
            title={isVi ? 'Quay lại' : 'Back'}
          >
            <ArrowLeft size={20} />
          </button>
          
          <button
            onClick={handleShare}
            className={`p-2.5 backdrop-blur-md rounded-xl text-white transition-all shadow-md flex items-center justify-center ${
              isCopied ? 'bg-green-500/90' : 'bg-white/20 dark:bg-black/30 hover:bg-white/35'
            }`}
            title={isVi ? 'Chia sẻ trang cá nhân' : 'Share Profile'}
          >
            {isCopied ? <Check size={20} /> : <Share2 size={20} />}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-5 -mt-16 relative z-10">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700/50 mb-6 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-5">
              {/* Avatar container */}
              <div className="relative">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-700"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(profileUser.name)}`;
                  }}
                />
                {profileUser.isInstructor && (
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1 rounded-lg shadow-md border-2 border-white dark:border-gray-800" title="Verified Instructor">
                    <ShieldCheck size={16} />
                  </div>
                )}
              </div>

              {/* Bio details */}
              <div className="pt-1">
                <div className="flex flex-col sm:flex-row items-center space-y-1.5 sm:space-y-0 sm:space-x-2">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                    {profileUser.name}
                  </h1>
                  {profileUser.isInstructor && (
                    <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50">
                      {isVi ? 'Giảng viên' : 'Instructor'}
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1">
                  {profileUser.headline || (profileUser.isInstructor ? (isVi ? 'Giảng viên công nghệ AI' : 'AI Tech Instructor') : (isVi ? 'Học viên say mê' : 'Avid Learner'))}
                </p>

                <div className="flex items-center space-x-3 justify-center sm:justify-start text-xs text-gray-400 dark:text-gray-500 mt-2.5">
                  <div className="flex items-center space-x-1">
                    <MapPin size={13} />
                    <span>{profileUser.location || (isVi ? 'Việt Nam' : 'Vietnam')}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Award size={13} />
                    <span>{profileUser.isInstructor ? (isVi ? 'Chuyên gia' : 'Expert') : (isVi ? 'Cấp độ 5' : 'Level 5')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100/50 dark:border-gray-700/30 text-center sm:text-left">
            {profileUser.bio || (profileUser.isInstructor 
              ? (isVi 
                ? 'Đam mê truyền đạt kiến thức lập trình vững chắc, tối ưu hóa công nghệ học tập kết hợp AI thông minh để nâng cao kỹ năng cho thế hệ lập trình viên mới.' 
                : 'Passionate about delivering robust programming concepts and combining state-of-the-art AI technology to elevate developer careers worldwide.')
              : (isVi
                ? 'Học hỏi mỗi ngày là chìa khóa mở rộng thế giới tương lai. Tập trung cao độ vào lập trình web và khoa học dữ liệu.'
                : 'Learning every day is the key to unlocking the future. Focused primarily on frontend web architectures and AI engineering.'))}
          </p>

          {/* Quick stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl p-3 text-center border border-orange-100/30 dark:border-orange-900/10 flex flex-col items-center justify-center">
              <Flame size={22} className="text-orange-500 mb-1" fill="currentColor" />
              <span className="text-xl font-extrabold text-gray-800 dark:text-white leading-none">
                {profileUser.streak}
              </span>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-1 uppercase tracking-wider">
                {isVi ? 'Chuỗi ngày' : 'Streak'}
              </span>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-3 text-center border border-indigo-100/30 dark:border-indigo-900/10 flex flex-col items-center justify-center">
              <Zap size={22} className="text-indigo-600 dark:text-indigo-400 mb-1" fill="currentColor" />
              <span className="text-xl font-extrabold text-gray-800 dark:text-white leading-none">
                {profileUser.points.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-wider">
                {isVi ? 'Tích lũy' : 'Points'}
              </span>
            </div>

            <div className="bg-pink-50/50 dark:bg-pink-950/20 rounded-2xl p-3 text-center border border-pink-100/30 dark:border-pink-900/10 flex flex-col items-center justify-center">
              <BookOpen size={22} className="text-pink-500 mb-1" />
              <span className="text-xl font-extrabold text-gray-800 dark:text-white leading-none">
                {profileUser.isInstructor ? authoredCourses.length : enrolledCourses.length}
              </span>
              <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 mt-1 uppercase tracking-wider">
                {profileUser.isInstructor ? (isVi ? 'Khóa học' : 'Courses') : (isVi ? 'Đang học' : 'Learning')}
              </span>
            </div>
          </div>
        </div>

        {/* Instructor extra summary badges */}
        {profileUser.isInstructor && authoredCourses.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/40 rounded-xl text-yellow-500">
                <Star size={18} fill="currentColor" />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{isVi ? 'Đánh giá trung bình' : 'Avg Rating'}</p>
                <p className="text-base font-black text-gray-800 dark:text-white">{avgRating} / 5.0</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex items-center space-x-3 shadow-sm">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-500">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{isVi ? 'Tổng học viên' : 'Total Students'}</p>
                <p className="text-base font-black text-gray-800 dark:text-white">{totalStudents.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Courses List */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>
              {profileUser.isInstructor 
                ? (isVi ? 'Khóa học đã xuất bản' : 'Published Courses')
                : (isVi ? 'Khóa học đang theo học' : 'Ongoing Courses')}
            </span>
            <span className="text-xs px-2.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-full">
              {profileUser.isInstructor ? authoredCourses.length : enrolledCourses.length}
            </span>
          </h2>

          {profileUser.isInstructor ? (
            authoredCourses.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {authoredCourses.map(course => (
                  <CourseCard key={course.id} course={course} onClick={onCourseClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
                <BookOpen className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm font-medium">{isVi ? 'Chưa đăng khóa học nào.' : 'No courses published yet.'}</p>
              </div>
            )
          ) : (
            enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {enrolledCourses.map(course => (
                  <CourseCard key={course.id} course={course} onClick={onCourseClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
                <BookOpen className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-sm font-medium">{isVi ? 'Chưa tham gia học khóa học nào.' : 'Not enrolled in any courses yet.'}</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
