
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CourseGenerator from './pages/CourseGenerator';
import CourseDetail from './pages/CourseDetail';
import ChatTutor from './pages/ChatTutor';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Auth from './pages/Auth';
import NotificationPanel from './components/NotificationPanel';
import { Course, Tab, User, Language, AppNotification, AuthUser } from './types';
import config from './config.json';
import { auth, db, logout as firebaseLogout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, updateDoc, deleteDoc } from 'firebase/firestore';

// Mock Data
const TRANSLATIONS = {
  vi: {
    nav: { home: 'Trang chủ', search: 'Khám phá', create: 'Tạo mới', chat: 'Chat', settings: 'Cài đặt' },
    home: { hello: 'Chào', ready: 'Sẵn sàng học chưa?', goal: 'Mục tiêu tuần', continue: 'Tiếp tục học', seeAll: 'Xem hết', recommended: 'Gợi ý' },
    search: { title: 'Tìm kiếm', placeholder: 'Tìm khóa học, chủ đề...', all: 'Tất cả', results: 'kết quả', noResults: 'Không tìm thấy kết quả', tryAdjusting: 'Hãy thử thay đổi từ khóa hoặc bộ lọc', clearFilters: 'Xóa bộ lọc' },
    generator: { 
      title: 'Tạo khóa học', 
      tabCreate: 'Tạo mới', 
      tabMyCourses: 'Của tôi', 
      modeAI: 'Sáng tạo AI', 
      modeAIDesc: 'Tạo lộ trình bằng trí tuệ nhân tạo',
      modeManual: 'Thủ công',
      modeManualDesc: 'Tự xây dựng giáo trình riêng',
      modeUpload: 'Tải tài liệu',
      modeUploadDesc: 'Tạo khóa học từ file PDF/Ảnh',
      label: 'Chủ đề bạn muốn học',
      placeholder: 'Ví dụ: Lập trình Python cơ bản...',
      button: 'Bắt đầu tạo',
      generating: 'Đang khởi tạo...',
      ideas: 'Gợi ý cho bạn',
      save: 'Lưu khóa học',
      updateManual: 'Cập nhật khóa học',
      curriculum: 'Giáo trình',
      moduleTitle: 'Tên chương',
      lessonTitle: 'Tên bài học',
      addLesson: 'Thêm bài học',
      addModule: 'Thêm chương',
      courseTitle: 'Tên khóa học',
      courseDesc: 'Mô tả ngắn',
      category: 'Danh mục',
      duration: 'Thời lượng',
      coverImage: 'Ảnh bìa',
      changeCover: 'Đổi ảnh',
      editContent: 'Soạn nội dung',
      backToCurriculum: 'Quay lại',
      uploadLabel: 'Chọn tài liệu của bạn',
      selectFile: 'Nhấn để chọn file',
      supportedFormats: 'Hỗ trợ PDF, TXT, PNG, JPG (Tối đa 5MB)',
      fileSelected: 'Đã chọn tài liệu thành công',
      error: 'Có lỗi xảy ra, vui lòng thử lại.',
      generateFromFile: 'Tạo bài học từ File',
      uploading: 'Đang xử lý...'
    },
    chat: { 
      title: 'Gia sư AI Neuro', 
      online: 'Đang trực tuyến', 
      welcome: 'Chào bạn! Mình là Neuro, mình có thể giúp gì cho bạn trong việc học tập hôm nay?', 
      placeholder: 'Nhập câu hỏi của bạn...', 
      thinking: 'Neuro đang suy nghĩ...',
      error: 'Kết nối bị gián đoạn, hãy thử lại nhé!' 
    },
    settings: { 
      title: 'Cài đặt', 
      studentType: 'Học viên năng nổ', 
      points: 'Điểm', 
      account: 'Tài khoản', 
      personalInfo: 'Thông tin cá nhân', 
      security: 'Bảo mật', 
      general: 'Chung', 
      notifications: 'Thông báo', 
      darkMode: 'Chế độ tối', 
      language: 'Ngôn ngữ', 
      help: 'Hỗ trợ', 
      helpFeedback: 'Trợ giúp & Phản hồi', 
      logout: 'Đăng xuất', 
      version: 'Phiên bản',
      profile: { header: 'Thông tin cá nhân', name: 'Họ và tên', email: 'Email', avatar: 'URL Ảnh đại diện', save: 'Lưu thay đổi', saved: 'Đã lưu!' },
      securityPage: { header: 'Bảo mật', currentPass: 'Mật khẩu hiện tại', newPass: 'Mật khẩu mới', confirmPass: 'Xác nhận mật khẩu', changePass: 'Đổi mật khẩu', success: 'Thành công!' }
    },
    auth: { loginTitle: 'Đăng nhập', welcomeBack: 'Chào mừng trở lại', welcomeNew: 'Chào mừng bạn mới', email: 'Email', password: 'Mật khẩu', loginButton: 'Vào học', signupButton: 'Đăng ký', demoHint: 'Nhập bất kỳ để vào hệ thống', fullName: 'Họ và tên', forgotPassword: 'Quên mật khẩu?', or: 'Hoặc', googleButton: 'Tiếp tục với Google', noAccount: 'Chưa có tài khoản?', hasAccount: 'Đã có tài khoản?', registerNow: 'Đăng ký ngay', loginNow: 'Đăng nhập' },
    common: { edit: 'Chỉnh sửa', save: 'Lưu lại', cancel: 'Hủy bỏ', editing: 'Đang soạn thảo', markdownSupport: 'Hỗ trợ Markdown' }
  },
  en: {
    nav: { home: 'Home', search: 'Search', create: 'Create', chat: 'Chat', settings: 'Settings' },
    home: { hello: 'Hello', ready: 'Ready to learn?', goal: 'Weekly Goal', continue: 'Continue Learning', seeAll: 'See all', recommended: 'Recommended' },
    search: { title: 'Search', placeholder: 'Search courses, topics...', all: 'All', results: 'results', noResults: 'No results found', tryAdjusting: 'Try adjusting your keywords or filters', clearFilters: 'Clear filters' },
    generator: { 
      title: 'Course Creator', 
      tabCreate: 'Create New', 
      tabMyCourses: 'My Courses', 
      modeAI: 'AI Creative', 
      modeAIDesc: 'Generate with Artificial Intelligence',
      modeManual: 'Manual',
      modeManualDesc: 'Build your own curriculum',
      modeUpload: 'Upload Files',
      modeUploadDesc: 'Create from PDF or Images',
      label: 'What do you want to learn?',
      placeholder: 'E.g. Basic Python Programming...',
      button: 'Start Generating',
      generating: 'Initializing...',
      ideas: 'Ideas for you',
      save: 'Save Course',
      updateManual: 'Update Course',
      curriculum: 'Curriculum',
      moduleTitle: 'Module Title',
      lessonTitle: 'Lesson Title',
      addLesson: 'Add Lesson',
      addModule: 'Add Module',
      courseTitle: 'Course Title',
      courseDesc: 'Description',
      category: 'Category',
      duration: 'Duration',
      coverImage: 'Cover Image',
      changeCover: 'Change',
      editContent: 'Edit Content',
      backToCurriculum: 'Back',
      uploadLabel: 'Select your materials',
      selectFile: 'Click to select file',
      supportedFormats: 'Supports PDF, TXT, PNG, JPG (Max 5MB)',
      fileSelected: 'File selected successfully',
      error: 'Something went wrong, please try again.',
      generateFromFile: 'Generate from File',
      uploading: 'Processing...'
    },
    chat: { 
      title: 'Neuro AI Tutor', 
      online: 'Online', 
      welcome: 'Hello! I am Neuro, how can I help you with your studies today?', 
      placeholder: 'Type your question...', 
      thinking: 'Neuro is thinking...',
      error: 'Connection lost, please try again!' 
    },
    settings: { 
      title: 'Settings', 
      studentType: 'Active Student', 
      points: 'Points', 
      account: 'Account', 
      personalInfo: 'Personal Info', 
      security: 'Security', 
      general: 'General', 
      notifications: 'Notifications', 
      darkMode: 'Dark Mode', 
      language: 'Language', 
      help: 'Help', 
      helpFeedback: 'Help & Feedback', 
      logout: 'Logout', 
      version: 'Version',
      profile: { header: 'Personal Info', name: 'Full Name', email: 'Email', avatar: 'Avatar URL', save: 'Save Changes', saved: 'Saved!' },
      securityPage: { header: 'Security', currentPass: 'Current Password', newPass: 'New Password', confirmPass: 'Confirm Password', changePass: 'Change Password', success: 'Success!' }
    },
    auth: { loginTitle: 'Sign In', welcomeBack: 'Welcome Back', welcomeNew: 'Welcome', email: 'Email', password: 'Password', loginButton: 'Sign In', signupButton: 'Sign Up', demoHint: 'Enter anything to login', fullName: 'Full Name', forgotPassword: 'Forgot Password?', or: 'Or', googleButton: 'Continue with Google', noAccount: "Don't have an account?", hasAccount: 'Already have an account?', registerNow: 'Register Now', loginNow: 'Login' },
    common: { edit: 'Edit', save: 'Save', cancel: 'Cancel', editing: 'Editing', markdownSupport: 'Markdown Support' }
  }
};

const App: React.FC = () => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [publicCourses, setPublicCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User>(config.user as User);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(config.settings.isDarkMode);
  const [language, setLanguage] = useState<Language>(config.settings.language as Language);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const allCourses = React.useMemo(() => {
    const userCourseIds = new Set(courses.map(c => c.id));
    const merged = [...courses];
    for (const pc of publicCourses) {
      if (!userCourseIds.has(pc.id)) {
        merged.push(pc);
      }
    }
    return merged;
  }, [courses, publicCourses]);

  const t = (TRANSLATIONS as any)[language];

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsAuthenticated(true);
        
        // Listen to User Profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            setUser(userData);
            if (userData.settings) {
              setIsDarkMode(userData.settings.isDarkMode ?? false);
              setLanguage(userData.settings.language ?? 'vi');
            }
          } else {
            // Create initial user profile
            const newUser: User = {
              ...config.user,
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || config.user.name,
              avatar: firebaseUser.photoURL || config.user.avatar,
              settings: { isDarkMode: config.settings.isDarkMode, language: config.settings.language },
              authDetails: {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || config.user.name,
                email: firebaseUser.email || ''
              }
            } as any;
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        });

        // Listen to Courses
        const coursesRef = collection(db, 'users', firebaseUser.uid, 'courses');
        const unsubscribeCourses = onSnapshot(coursesRef, (snapshot) => {
          const loadedCourses = snapshot.docs.map(doc => doc.data() as Course);
          setCourses(loadedCourses);
        });

        // Listen to Notifications
        const notifsRef = collection(db, 'users', firebaseUser.uid, 'notifications');
        const unsubscribeNotifs = onSnapshot(notifsRef, (snapshot) => {
          const loadedNotifs = snapshot.docs.map(doc => doc.data() as AppNotification);
          // Sort by timestamp descending
          loadedNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(loadedNotifs);
        });

        // Listen to Public Courses
        const publicCoursesRef = collection(db, 'publicCourses');
        const unsubscribePublicCourses = onSnapshot(publicCoursesRef, (snapshot) => {
          const loadedPublicCourses = snapshot.docs.map(doc => doc.data() as Course);
          // Fallback to config if empty (for demo purposes)
          if (loadedPublicCourses.length === 0) {
            setPublicCourses(config.courses.filter(c => c.visibility === 'public') as Course[]);
          } else {
            setPublicCourses(loadedPublicCourses);
          }
        });

        setIsAuthReady(true);

        return () => {
          unsubscribeUser();
          unsubscribeCourses();
          unsubscribeNotifs();
          unsubscribePublicCourses();
        };
      } else {
        setIsAuthenticated(false);
        setUser(config.user as User);
        setCourses([]);
        setNotifications([]);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = (authUser: AuthUser) => {
    // Handled by onAuthStateChanged
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      setCurrentTab('home');
      setActiveCourse(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { 'settings.isDarkMode': newMode });
    }
  };

  const toggleLanguage = async () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, { 'settings.language': newLang });
    }
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!auth.currentUser) return;
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    const notifRef = doc(db, 'users', auth.currentUser.uid, 'notifications', newNotif.id);
    await setDoc(notifRef, newNotif);
  };

  const markNotifRead = async (id: string) => {
    if (!auth.currentUser) return;
    const notifRef = doc(db, 'users', auth.currentUser.uid, 'notifications', id);
    await updateDoc(notifRef, { read: true });
  };

  const clearNotifications = async () => {
    // In a real app, you'd batch delete or delete one by one. For simplicity here:
    if (!auth.currentUser) return;
    notifications.forEach(async (n) => {
      // Note: deleting documents should ideally be done via batch or a cloud function
      // For now, we'll just mark them read or leave as is since we don't have a delete function imported
      const notifRef = doc(db, 'users', auth.currentUser!.uid, 'notifications', n.id);
      await updateDoc(notifRef, { read: true }); 
    });
    // Or just clear local state temporarily
    setNotifications([]);
  };

  const handleCourseGenerated = async (newCourse: Course) => {
    if (!auth.currentUser) return;
    const courseRef = doc(db, 'users', auth.currentUser.uid, 'courses', newCourse.id);
    await setDoc(courseRef, newCourse);
    setActiveCourse(newCourse);
    setCourseToEdit(null);
  };

  const handleUpdateCourse = async (updatedCourse: Course) => {
    if (!auth.currentUser) return;
    const courseRef = doc(db, 'users', auth.currentUser.uid, 'courses', updatedCourse.id);
    await setDoc(courseRef, updatedCourse);
    if (activeCourse?.id === updatedCourse.id) setActiveCourse(updatedCourse);
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Auth 
        onLogin={handleLogin} 
        onToggleLanguage={toggleLanguage} 
        language={language} 
        t={t} 
      />
    );
  }

  return (
    <div className={`h-screen w-full bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      {/* Ẩn Sidebar khi đang xem chi tiết khóa học */}
      {!activeCourse && (
        <Sidebar 
          currentTab={currentTab} 
          onTabChange={setCurrentTab} 
          user={user} 
          labels={t.nav} 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={toggleDarkMode} 
          language={language} 
          onToggleLanguage={toggleLanguage} 
          onLogout={handleLogout} 
        />
      )}
      
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
            {activeCourse ? (
              <CourseDetail 
                course={activeCourse} 
                allCourses={allCourses} 
                onBack={() => setActiveCourse(null)} 
                language={language}
                onCourseUpdate={handleUpdateCourse}
                onEditCourse={(c) => {
                  setCourseToEdit(c);
                  setActiveCourse(null);
                  setCurrentTab('create');
                }}
                onLessonComplete={async (cid, mid, lid) => {
                    if (!auth.currentUser) return;
                    const courseRef = doc(db, 'users', auth.currentUser.uid, 'courses', cid);
                    const courseToUpdate = allCourses.find(c => c.id === cid);
                    if (courseToUpdate) {
                      const updatedModules = courseToUpdate.modules.map(m => {
                        if (m.id === mid) {
                          return {
                            ...m,
                            lessons: m.lessons.map(l => l.id === lid ? { ...l, isCompleted: true } : l)
                          };
                        }
                        return m;
                      });
                      
                      const totalLessons = updatedModules.reduce((acc, m) => acc + m.lessons.length, 0);
                      const completedLessons = updatedModules.reduce((acc, m) => acc + m.lessons.filter(l => l.isCompleted).length, 0);
                      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

                      const updatedCourse = { ...courseToUpdate, modules: updatedModules, progress };
                      await setDoc(courseRef, updatedCourse);
                      
                      // Also update user XP
                      const userRef = doc(db, 'users', auth.currentUser.uid);
                      await updateDoc(userRef, { 
                        xpToday: (user.xpToday || 0) + 10,
                        points: (user.points || 0) + 10
                      });
                    }
                    addNotification({ title: 'Bài học hoàn tất!', message: 'Chúc mừng bạn đã hoàn thành một bài học mới. +10 XP!', type: 'achievement' });
                }}
                commonT={t.common}
              />
            ) : (
                <>
                {currentTab === 'home' && <Home user={user} courses={allCourses} onCourseClick={setActiveCourse} t={t.home} language={language} onOpenNotif={() => setIsNotifOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />}
                {currentTab === 'search' && <Search courses={allCourses} onCourseClick={setActiveCourse} t={t.search} language={language} />}
                {currentTab === 'create' && <CourseGenerator onCourseGenerated={handleCourseGenerated} t={t.generator} language={language} courses={allCourses} onCourseClick={setActiveCourse} initialData={courseToEdit} onCancel={() => setCourseToEdit(null)} onDeleteCourse={async (id) => {
                  if (!auth.currentUser) return;
                  await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'courses', id));
                  setCourseToEdit(null);
                  setCurrentTab('home');
                }} />}
                {currentTab === 'chat' && <ChatTutor t={t.chat} language={language} />}
                {currentTab === 'settings' && <Settings user={user} onUpdateUser={async (updatedUser) => {
                  setUser(updatedUser);
                  if (auth.currentUser) {
                    const userRef = doc(db, 'users', auth.currentUser.uid);
                    await updateDoc(userRef, { name: updatedUser.name, avatar: updatedUser.avatar });
                  }
                }} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} language={language} onToggleLanguage={toggleLanguage} onLogout={handleLogout} t={t.settings} />}
                </>
            )}
        </div>
      </main>

      <NotificationPanel 
        notifications={notifications}
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onMarkRead={markNotifRead}
        onClearAll={clearNotifications}
        language={language}
      />
      
      {/* Ẩn BottomNav khi đang xem chi tiết khóa học */}
      {!activeCourse && <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} labels={t.nav} />}
    </div>
  );
};

export default App;
