import React from 'react';
import { Home, Search, PlusSquare, MessageSquare, Settings, LogOut, Moon, Sun, Globe } from 'lucide-react';
import { Tab, User, Language } from '../types';

interface SidebarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  user: User;
  labels: any; // Using the nav translations object
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onTabChange, 
  user, 
  labels,
  isDarkMode,
  onToggleDarkMode,
  language,
  onToggleLanguage,
  onLogout
}) => {
  const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
    { id: 'home', icon: Home, label: labels.home },
    { id: 'search', icon: Search, label: labels.search },
    { id: 'create', icon: PlusSquare, label: labels.create },
    { id: 'chat', icon: MessageSquare, label: labels.chat },
    { id: 'settings', icon: Settings, label: labels.settings },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors duration-200">
      {/* Logo Area */}
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none overflow-hidden">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/2641/2641333.png" 
              alt="Logo" 
              className="w-7 h-7 object-contain brightness-0 invert"
              referrerPolicy="no-referrer"
            />
        </div>
        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">NeuroLearn</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-2 py-4">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User & Utils Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        
        {/* Utilities */}
        <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={onToggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={onToggleLanguage} className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors">
                <Globe size={14} />
                <span>{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600" />
            <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.points} XP</p>
            </div>
            <button onClick={onLogout} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;