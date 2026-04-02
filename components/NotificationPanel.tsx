
import React from 'react';
import { X, Bell, Calendar, Award, Clock, Check } from 'lucide-react';
import { AppNotification, Language } from '../types';

interface NotificationPanelProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  language: Language;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkRead,
  onClearAll,
  language
}) => {
  if (!isOpen) return null;

  const labels = {
    vi: { title: 'Thông báo', empty: 'Không có thông báo mới', clear: 'Xóa hết', today: 'Hôm nay', deadline: 'Hạn chót', achievement: 'Thành tựu', reminder: 'Nhắc nhở' },
    en: { title: 'Notifications', empty: 'No new notifications', clear: 'Clear all', today: 'Today', deadline: 'Deadline', achievement: 'Achievement', reminder: 'Reminder' }
  }[language];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-page-enter">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{labels.title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.length > 0 && (
                <button onClick={onClearAll} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
                    {labels.clear}
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Bell size={48} className="mb-4" />
              <p className="text-sm font-medium">{labels.empty}</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                  notif.read 
                    ? 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700' 
                    : 'bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900/30 shadow-sm ring-1 ring-indigo-50 dark:ring-indigo-900/10'
                }`}
              >
                {!notif.read && <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-600 rounded-full"></div>}
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    notif.type === 'deadline' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                    notif.type === 'achievement' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500' :
                    'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                  }`}>
                    {notif.type === 'deadline' ? <Clock size={18} /> : 
                     notif.type === 'achievement' ? <Award size={18} /> : 
                     <Calendar size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                        {labels[notif.type]}
                    </p>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-1">{notif.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
