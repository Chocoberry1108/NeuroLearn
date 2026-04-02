import React from 'react';
import { Home, Search, PlusSquare, MessageSquare, Settings } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  labels: {
    home: string;
    search: string;
    create: string;
    chat: string;
    settings: string;
  };
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, labels }) => {
  const navItems: { id: Tab; icon: React.FC<any>; label: string }[] = [
    { id: 'home', icon: Home, label: labels.home },
    { id: 'search', icon: Search, label: labels.search },
    { id: 'create', icon: PlusSquare, label: labels.create },
    { id: 'chat', icon: MessageSquare, label: labels.chat },
    { id: 'settings', icon: Settings, label: labels.settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-3 pb-safe z-50 transition-colors duration-200">
      <div className="flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
              }`}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;