import React, { useState } from 'react';
import { Search as SearchIcon, X, Filter, Users, BookOpen, ChevronRight, Star, Flame, Zap } from 'lucide-react';
import { Course, Language } from '../types';
import CourseCard from '../components/CourseCard';

interface SearchProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  onUserClick: (user: any) => void;
  t: any;
  language: Language;
}

const Search: React.FC<SearchProps> = ({ courses, onCourseClick, onUserClick, t, language }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'users'>('courses');

  const isVi = language === 'vi';

  // Extract unique categories
  const categories = Array.from(new Set(courses.map(c => c.category)));

  // Filter courses logic
  const filteredCourses = courses.filter(course => {
    const matchesQuery = (
      course.title.toLowerCase().includes(query.toLowerCase()) || 
      course.category.toLowerCase().includes(query.toLowerCase()) ||
      (course.author && course.author.toLowerCase().includes(query.toLowerCase()))
    );
    const matchesCategory = selectedCategory ? course.category === selectedCategory : true;
    
    return matchesQuery && matchesCategory;
  });

  // Generate dynamic, realistic user profiles for unique course authors
  const authors = React.useMemo(() => {
    const uniqueAuthors = Array.from(new Set(courses.map(c => c.author).filter(Boolean)));
    return uniqueAuthors.map((name, index) => {
      const authorCourses = courses.filter(c => c.author === name);
      const topCategory = authorCourses[0]?.category || "Công nghệ";
      const headline = isVi 
        ? `Giảng viên chuyên ngành ${topCategory}`
        : `Specialist Instructor in ${topCategory}`;
        
      const nameLength = name.length;
      const points = 1200 + (nameLength * 123) % 2000;
      const streak = 3 + (nameLength * 7) % 21;
      
      return {
        uid: `author-${index}`,
        name,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
        headline,
        streak,
        points,
        isInstructor: true,
        bio: isVi
          ? `Chuyên gia đào tạo ${topCategory} với nhiều năm kinh nghiệm thực chiến và giảng dạy.`
          : `Professional ${topCategory} trainer with years of development and mentorship experience.`,
        location: isVi ? 'Việt Nam' : 'Vietnam'
      };
    });
  }, [courses, language]);

  // Filter users/authors logic
  const filteredUsers = authors.filter(author => 
    author.name.toLowerCase().includes(query.toLowerCase()) ||
    author.headline.toLowerCase().includes(query.toLowerCase())
  );

  const clearSearch = () => {
    setQuery('');
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 pt-14 px-5 transition-colors duration-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.title}</h1>
        
        {/* Search Input */}
        <div className="relative mb-4">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isVi ? "Tìm kiếm khóa học, chủ đề, giảng viên..." : "Search courses, topics, instructors..."}
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
            />
            <SearchIcon className="absolute left-4 top-3.5 text-gray-400" size={20} />
            {query && (
                <button 
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X size={18} />
                </button>
            )}
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4 border border-gray-200/40 dark:border-gray-700/30">
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'courses'
                ? 'bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BookOpen size={16} />
            <span>{isVi ? 'Khóa học' : 'Courses'}</span>
            <span className="text-xs px-1.5 py-0.2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-extrabold">
              {filteredCourses.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'users'
                ? 'bg-white dark:bg-gray-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users size={16} />
            <span>{isVi ? 'Tác giả & Giảng viên' : 'Authors & Instructors'}</span>
            <span className="text-xs px-1.5 py-0.2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md font-extrabold">
              {filteredUsers.length}
            </span>
          </button>
        </div>

        {/* Category Chips - only visible for Courses tab */}
        {activeTab === 'courses' && (
          <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar -mx-5 px-5">
              <button
                  onClick={() => setSelectedCategory(null)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                      selectedCategory === null 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}
              >
                  {t.all}
              </button>
              {categories.map(cat => (
                  <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                          selectedCategory === cat 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}
                  >
                      {cat}
                  </button>
              ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div>
        {activeTab === 'courses' ? (
          filteredCourses.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                  {filteredCourses.map(course => (
                      <CourseCard key={course.id} course={course} onClick={onCourseClick} />
                  ))}
              </div>
          ) : (
              <div className="flex flex-col items-center justify-center pt-10 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                      <Filter size={24} />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-bold mb-1">{t.noResults}</h3>
                  <p className="text-gray-500 text-sm mb-4">{t.tryAdjusting}</p>
                  <button 
                      onClick={clearSearch}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline"
                  >
                      {t.clearFilters}
                  </button>
              </div>
          )
        ) : (
          filteredUsers.length > 0 ? (
            <div className="space-y-3">
              {filteredUsers.map(user => {
                const authorCourses = courses.filter(c => c.author === user.name);
                return (
                  <div
                    key={user.uid}
                    onClick={() => onUserClick(user)}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer active:scale-95"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-700"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.name)}`;
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">
                            {user.name}
                          </h3>
                          <span className="shrink-0 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                            {isVi ? 'Giảng viên' : 'Instructor'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
                          {user.headline}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 pl-2">
                      <div className="text-right hidden xs:block">
                        <p className="text-xs font-black text-gray-800 dark:text-gray-200 flex items-center justify-end space-x-0.5">
                          <Zap size={11} className="text-indigo-500" fill="currentColor" />
                          <span>{user.points} XP</span>
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                          {authorCourses.length} {isVi ? 'Khóa học' : 'Courses'}
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-10 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <Users size={24} />
              </div>
              <h3 className="text-gray-900 dark:text-white font-bold mb-1">
                {isVi ? 'Không tìm thấy tác giả nào' : 'No instructors found'}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {isVi ? 'Hãy thử tìm kiếm với tên hoặc chuyên ngành khác' : 'Try searching with another name or specialty'}
              </p>
              <button 
                  onClick={clearSearch}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline"
              >
                  {isVi ? 'Xóa từ khóa' : 'Clear search'}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Search;
