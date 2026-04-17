
import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Globe, Loader2 } from 'lucide-react';
import { Language, AuthUser } from '../types';
import { signInWithGoogle } from '../firebase';

interface AuthProps {
  onLogin: (user: AuthUser) => void;
  onToggleLanguage: () => void;
  language: Language;
  t: any;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onToggleLanguage, language, t }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin' : 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate API call for email/password (since we only set up Google Auth)
    setTimeout(() => {
      const mockAuthUser: AuthUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: isLogin ? 'Alex' : name,
        email: email,
        token: 'mock-jwt-token'
      };
      onLogin(mockAuthUser);
      setIsLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      const authUser: AuthUser = {
        id: user.uid,
        name: user.displayName || 'User',
        email: user.email || '',
        token: await user.getIdToken()
      };
      onLogin(authUser);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 transition-colors duration-200">
      {/* Language Toggle */}
      <button 
        onClick={onToggleLanguage}
        className="absolute top-6 right-6 flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-all"
      >
        <Globe size={16} className="text-indigo-600" />
        <span>{language === 'vi' ? 'Tiếng Anh' : 'Vietnamese'}</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none mb-6">
            <ArrowRight size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? t.auth.welcomeBack : t.auth.welcomeNew}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isLogin ? t.auth.loginNow : t.auth.registerNow}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={t.auth.fullName}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-100 transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                placeholder={t.auth.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-100 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                placeholder={t.auth.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-100 transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <span>{isLogin ? t.auth.loginButton : t.auth.signupButton}</span>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-700"></div>
              </div>
              <span className="relative px-4 bg-white dark:bg-gray-800 text-xs text-gray-400 font-bold uppercase tracking-widest">
                {t.auth.or}
              </span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-[0.98]"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              <span>{t.auth.googleButton}</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          {t.auth.demoHint}
        </p>
      </div>
    </div>
  );
};

export default Auth;
