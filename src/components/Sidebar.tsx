import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardCheck, 
  History, 
  Settings, 
  Moon, 
  Sun, 
  Calendar, 
  ShieldAlert,
  FileText,
  LogOut,
  Shield,
  User,
  Lock
} from 'lucide-react';
import { TabType, AppSettings, UserPermissionsMap, AppSectionKey, RoleType } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: AppSettings;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currentUser?: string;
  userFullName?: string;
  userRoleTitle?: string;
  userRole?: RoleType;
  userPermissions?: UserPermissionsMap;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  darkMode,
  setDarkMode,
  currentUser = 'admin',
  userFullName,
  userRoleTitle = 'Administrateur',
  userRole = 'super_admin',
  userPermissions,
  onLogout,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems: { id: TabType; label: string; icon: React.ReactNode; sectionKey?: AppSectionKey }[] = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'students', label: 'إدارة المتعلمين', icon: <Users className="w-5 h-5" />, sectionKey: 'students' },
    { id: 'schedule', label: 'التخطيط الأسبوعي', icon: <Calendar className="w-5 h-5" />, sectionKey: 'schedule' },
    { id: 'attendance', label: 'ورقة النداء اليومية', icon: <ClipboardCheck className="w-5 h-5" />, sectionKey: 'attendance' },
    { id: 'tracking', label: 'تدبير الغيابات', icon: <History className="w-5 h-5" />, sectionKey: 'tracking' },
    { id: 'violations', label: 'المخالفات', icon: <ShieldAlert className="w-5 h-5" />, sectionKey: 'violations' },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: <FileText className="w-5 h-5" />, sectionKey: 'reports' },
    { id: 'settings', label: 'الإعدادات والأمان', icon: <Settings className="w-5 h-5" />, sectionKey: 'settings' },
  ];

  // Permission Check
  const isSectionAllowed = (sectionKey?: AppSectionKey) => {
    if (!sectionKey || userRole === 'super_admin') return true;
    if (!userPermissions) return true;
    return !!userPermissions[sectionKey]?.view;
  };

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed right-0 top-0 no-print z-30">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-800">
        <h1 className="text-xs font-black text-white leading-tight">
          {settings.schoolName}
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-bold flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>المديرية الإقليمية الرباط</span>
        </p>
      </div>

      {/* Admin User Info Card */}
      <div className="px-4 py-3 mx-3 mt-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
            <User className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-slate-100 truncate">
              {userFullName || currentUser}
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold truncate">
              {userRoleTitle}
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer shrink-0"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const allowed = isSectionAllowed(item.sectionKey);
          const isActive = activeTab === item.id;

          if (!allowed) {
            return null; // Hide non-permitted tabs for admin users
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[var(--brand-blue)] text-white shadow-md shadow-[var(--brand-blue)]/40 font-bold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle & Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          <span>{darkMode ? 'المظهر الفاتح' : 'المظهر الداكن'}</span>
        </button>

        {onLogout && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20 font-bold text-lg">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تسجيل الخروج من التطبيق</h3>
              <p className="text-xs text-slate-400 mt-1">
                هل أنت تأكد من رغبتك في إنهاء الجلسة الحالية والعودة إلى شاشة الدخول؟
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-600/30"
              >
                تأكيد الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
