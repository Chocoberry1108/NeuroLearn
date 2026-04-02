import React, { useState } from 'react';
import { Search as SearchIcon, X, Filter } from 'lucide-react';
import { Course, Language } from '../types';
import CourseCard from '../components/CourseCard';

interface SearchProps {
  courses: Course[];
  onCourseClick: (course: Course) => void;
  t: any;
  language: Language;
}

const Search: React.FC<SearchProps> = ({ courses, onCourseClick, t, language }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(courses.map(c => c.category)));

  // Filter logic
  const filteredCourses = courses.filter(course => {
    const matchesQuery = (course.title.toLowerCase().includes(query.toLowerCase()) || 
                          course.category.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = selectedCategory ? course.category === selectedCategory : true;
    
    return matchesQuery && matchesCategory;
  });

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
                placeholder={t.placeholder}
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

        {/* Category Chips */}
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
      </div>

      {/* Results */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {filteredCourses.length} {t.results}
            </h2>
        </div>

        {filteredCourses.length > 0 ? (
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
        )}
      </div>
    </div>
  );
};

export default Search;