
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import CourseGenerator from './pages/CourseGenerator';
import CourseDetail from './pages/CourseDetail';
import ChatTutor from './pages/ChatTutor';
import Settings from './pages/Settings';
import Search from './pages/Search';
import NotificationPanel from './components/NotificationPanel';
import { Course, Tab, User, Language, AppNotification } from './types';

// Mock Data
const MOCK_USER: User = {
  name: 'Alex',
  avatar: 'https://ui-avatars.com/api/?name=Alex',
  streak: 12,
  points: 450,
  xpToday: 35,
  dailyGoal: 50,
  streakStatus: ['completed', 'completed', 'frozen', 'active', 'missed', 'missed', 'missed']
};

const MOCK_COURSES: Course[] = [
  {
    id: '1',
    title: 'Cơ bản về Thiết kế UI',
    description: 'Học các kiến thức cơ bản về thiết kế Giao diện Người dùng bao gồm lý thuyết màu sắc, kiểu chữ và bố cục.',
    thumbnail: 'https://picsum.photos/seed/design/400/300',
    author: 'Sarah Design',
    category: 'Thiết kế',
    rating: 4.8,
    students: 1205,
    modules: [
        {
            id: 'm1', title: 'Giới thiệu', lessons: [
                { id: 'l1', title: 'UI là gì?', description: 'Kiến thức cơ bản', duration: '5 phút', isCompleted: true, userRating: 5 },
                { id: 'l2', title: 'Công cụ hành nghề', description: 'Figma và những thứ khác', duration: '10 phút', isCompleted: false },
            ]
        }
    ],
    progress: 45,
    status: 'published',
    visibility: 'public',
    isCreatedByUser: false
  },
  {
    id: '2',
    title: 'React.js từ Số 0 đến Chuyên gia',
    description: 'Làm chủ React.js bằng cách xây dựng các dự án thực tế.',
    thumbnail: 'https://picsum.photos/seed/react/400/300',
    author: 'Code Master',
    category: 'Lập trình',
    rating: 4.9,
    students: 8500,
    modules: [],
    progress: 10,
    status: 'published',
    visibility: 'public',
    isCreatedByUser: false
  }
];

const TRANSLATIONS = {
  vi: {
    nav: { home: 'Trang chủ', search: 'Khám phá', create: 'Tạo mới', chat: 'Gia sư', settings: 'Cài đặt' },
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
    nav: { home: 'Home', search: 'Search', create: 'Create', chat: 'Tutor', settings: 'Settings' },
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
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<User>(MOCK_USER);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', title: 'Hạn chót sắp tới!', message: 'Bài học "Công cụ hành nghề" trong khóa UI Design sẽ hết hạn trong 2 giờ.', timestamp: new Date().toISOString(), read: false, type: 'deadline' },
    { id: '2', title: 'Thành tích mới!', message: 'Bạn đã đạt được chuỗi 12 ngày học tập liên tục. Tuyệt vời!', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true, type: 'achievement' }
  ]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const t = (TRANSLATIONS as any)[language];

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => setNotifications([]);

  const handleCourseGenerated = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev.filter(c => c.id !== newCourse.id)]);
    setActiveCourse(newCourse);
    setCourseToEdit(null);
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
    if (activeCourse?.id === updatedCourse.id) setActiveCourse(updatedCourse);
  };

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
          onToggleLanguage={() => setLanguage(l => l === 'vi' ? 'en' : 'vi')} 
          onLogout={() => {}} 
        />
      )}
      
      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
            {activeCourse ? (
              <CourseDetail 
                course={activeCourse} 
                allCourses={courses} 
                onBack={() => setActiveCourse(null)} 
                language={language}
                onCourseUpdate={handleUpdateCourse}
                onEditCourse={(c) => {
                  setCourseToEdit(c);
                  setActiveCourse(null);
                  setCurrentTab('create');
                }}
                onLessonComplete={(cid, mid, lid) => {
                    addNotification({ title: 'Bài học hoàn tất!', message: 'Chúc mừng bạn đã hoàn thành một bài học mới. +10 XP!', type: 'achievement' });
                }}
                commonT={t.common}
              />
            ) : (
                <>
                {currentTab === 'home' && <Home user={user} courses={courses} onCourseClick={setActiveCourse} t={t.home} language={language} onOpenNotif={() => setIsNotifOpen(true)} unreadCount={notifications.filter(n => !n.read).length} />}
                {currentTab === 'search' && <Search courses={courses} onCourseClick={setActiveCourse} t={t.search} language={language} />}
                {currentTab === 'create' && <CourseGenerator onCourseGenerated={handleCourseGenerated} t={t.generator} language={language} courses={courses} onCourseClick={setActiveCourse} initialData={courseToEdit} onCancel={() => setCourseToEdit(null)} />}
                {currentTab === 'chat' && <ChatTutor t={t.chat} language={language} />}
                {currentTab === 'settings' && <Settings user={user} onUpdateUser={setUser} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} language={language} onToggleLanguage={() => setLanguage(l => l === 'vi' ? 'en' : 'vi')} onLogout={() => {}} t={t.settings} />}
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
