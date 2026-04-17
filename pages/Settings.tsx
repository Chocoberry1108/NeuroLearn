import React, { useState } from 'react';
import { User, Bell, Moon, Globe, Shield, HelpCircle, LogOut, ChevronRight, Edit2, ArrowLeft, Save, CheckCircle, Lock } from 'lucide-react';
import { User as UserType, Language } from '../types';

interface SettingsProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  language: Language;
  onToggleLanguage: () => void;
  onLogout: () => void;
  t: any; 
}

type SettingsView = 'main' | 'profile' | 'security';

const Settings: React.FC<SettingsProps> = ({ 
    user, 
    onUpdateUser,
    isDarkMode, 
    onToggleDarkMode, 
    language, 
    onToggleLanguage,
    onLogout,
    t 
}) => {
  const [currentView, setCurrentView] = useState<SettingsView>('main');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
      name: user.name,
      avatar: user.avatar,
      email: user.authDetails?.email || 'user@example.com'
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
      current: '',
      new: '',
      confirm: ''
  });
  const [securitySaved, setSecuritySaved] = useState(false);

  const handleHelpClick = () => {
    window.open('https://vi.wikipedia.org/wiki/D%E1%BA%A5u_ch%E1%BA%A5m_h%E1%BB%8Fi', '_blank');
  };

  const handleSaveProfile = () => {
      onUpdateUser({
          ...user,
          name: profileForm.name,
          avatar: profileForm.avatar
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleSaveSecurity = () => {
      // Logic would go here in a real app
      setSecurityForm({ current: '', new: '', confirm: '' });
      setSecuritySaved(true);
      setTimeout(() => setSecuritySaved(false), 2000);
  };

  const SettingSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">{title}</h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        {children}
      </div>
    </div>
  );

  const SettingItem: React.FC<{ 
    icon: React.ElementType; 
    label: string; 
    value?: string; 
    isToggle?: boolean; 
    isActive?: boolean;
    onToggle?: () => void;
    onClick?: () => void;
    isLast?: boolean; 
    color?: string 
  }> = ({ 
    icon: Icon, label, value, isToggle, isActive, onToggle, onClick, isLast, color 
  }) => {
    const iconColorClass = color 
        ? color 
        : 'text-gray-600 dark:text-gray-300';
        
    return (
        <div 
          onClick={isToggle ? onToggle : onClick}
          className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''} active:bg-gray-50 dark:active:bg-gray-700 transition-colors cursor-pointer select-none`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full ${color === 'text-red-500' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-700'} flex items-center justify-center transition-colors`}>
              <Icon size={16} className={iconColorClass} />
            </div>
            <span className={`text-sm font-medium ${color === 'text-red-500' ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>{label}</span>
          </div>
          <div className="flex items-center space-x-2">
            {value && <span className="text-xs text-gray-400">{value}</span>}
            {isToggle ? (
               <div className={`w-10 h-6 rounded-full p-1 relative transition-colors duration-200 ease-in-out ${isActive ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
               </div>
            ) : (
               <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            )}
          </div>
        </div>
      );
  };

  const renderProfileView = () => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 pt-4 px-5 transition-colors duration-200">
          <div className="flex items-center space-x-4 mb-6">
              <button onClick={() => setCurrentView('main')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeft className="text-gray-700 dark:text-white" size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.profile.header}</h1>
          </div>

          <div className="flex flex-col items-center mb-8">
              <div className="relative">
                <img src={profileForm.avatar} alt={profileForm.name} className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-md" />
                <button className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white border-2 border-white dark:border-gray-800">
                    <Edit2 size={14} />
                </button>
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.profile.name}</label>
                  <input 
                    type="text" 
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.profile.email}</label>
                  <input 
                    type="email" 
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.profile.avatar}</label>
                  <input 
                    type="text" 
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({...profileForm, avatar: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
              </div>
          </div>

          <button 
            onClick={handleSaveProfile}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
             {profileSaved ? <CheckCircle size={20} /> : <Save size={20} />}
             <span>{profileSaved ? t.profile.saved : t.profile.save}</span>
          </button>
      </div>
  );

  const renderSecurityView = () => (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 pt-4 px-5 transition-colors duration-200">
          <div className="flex items-center space-x-4 mb-6">
              <button onClick={() => setCurrentView('main')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeft className="text-gray-700 dark:text-white" size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.securityPage.header}</h1>
          </div>

          <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Shield size={40} />
              </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.securityPage.currentPass}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        value={securityForm.current}
                        onChange={(e) => setSecurityForm({...securityForm, current: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
              </div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-700 my-2"></div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.securityPage.newPass}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        value={securityForm.new}
                        onChange={(e) => setSecurityForm({...securityForm, new: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.securityPage.confirmPass}</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        value={securityForm.confirm}
                        onChange={(e) => setSecurityForm({...securityForm, confirm: e.target.value})}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl pl-11 pr-4 py-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
              </div>
          </div>

          <button 
            onClick={handleSaveSecurity}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
          >
             {securitySaved ? <CheckCircle size={20} /> : <Save size={20} />}
             <span>{securitySaved ? t.securityPage.success : t.securityPage.changePass}</span>
          </button>
      </div>
  );

  // Main Render
  if (currentView === 'profile') return renderProfileView();
  if (currentView === 'security') return renderSecurityView();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 pt-14 px-5 transition-colors duration-200">
      <div className="mb-6">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center space-x-4">
              <div className="relative">
                  <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-600 shadow-sm" />
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full border-2 border-white dark:border-gray-800">
                      <Edit2 size={10} />
                  </div>
              </div>
              <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.studentType}</p>
              </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-800/30">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{user.points} {t.points}</span>
          </div>
      </div>

      <SettingSection title={t.account}>
         <SettingItem 
            icon={User} 
            label={t.personalInfo} 
            onClick={() => setCurrentView('profile')}
         />
         <SettingItem 
            icon={Shield} 
            label={t.security} 
            onClick={() => setCurrentView('security')}
         />
      </SettingSection>

      <SettingSection title={t.general}>
         <SettingItem 
            icon={Bell} 
            label={t.notifications} 
            isToggle 
            isActive={notificationsEnabled}
            onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
         />
         <SettingItem 
            icon={Moon} 
            label={t.darkMode} 
            isToggle 
            isActive={isDarkMode}
            onToggle={onToggleDarkMode}
         />
         <SettingItem 
            icon={Globe} 
            label={t.language} 
            value={language === 'vi' ? 'Tiếng Việt' : 'English'} 
            onClick={onToggleLanguage}
         />
      </SettingSection>

      <SettingSection title={t.help}>
         <SettingItem 
            icon={HelpCircle} 
            label={t.helpFeedback} 
            onClick={handleHelpClick}
         />
      </SettingSection>

      <div className="mt-8">
         <button 
             onClick={onLogout}
             className="w-full bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 rounded-xl p-4 flex items-center justify-center space-x-2 text-red-500 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm active:scale-[0.98]"
         >
             <LogOut size={18} />
             <span>{t.logout}</span>
         </button>
         <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4">{t.version} 1.0.0</p>
      </div>
    </div>
  );
};

export default Settings;