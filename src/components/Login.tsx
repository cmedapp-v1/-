import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  School, 
  AlertCircle, 
  Moon, 
  Sun, 
  Info,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { AppSettings } from '../types';
import { verifyLogin, DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_PASSWORD, getFailedLoginAttemptsInfo } from '../utils/auth';

interface LoginProps {
  settings: AppSettings;
  onLoginSuccess: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({
  settings,
  onLoginSuccess,
  darkMode,
  setDarkMode,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCredentialsHelp, setShowCredentialsHelp] = useState(false);

  // Lockout Countdown State
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Check lockout on mount
  useEffect(() => {
    const info = getFailedLoginAttemptsInfo();
    const now = Date.now();
    if (info.lockUntil > now) {
      setLockoutSeconds(Math.ceil((info.lockUntil - now) / 1000));
    }
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMsg(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!username.trim()) {
      setErrorMsg('يرجى إدخال اسم المستخدم.');
      return;
    }
    if (!password) {
      setErrorMsg('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Brief timeout to give tactile feedback and hash securely
      const result = await verifyLogin(username, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMsg(result.message || 'بيانات الدخول غير صحيحة.');
        if (result.lockoutRemainingSeconds) {
          setLockoutSeconds(result.lockoutRemainingSeconds);
        }
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع أثناء معالجة تسجيل الدخول. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDefaultCreds = () => {
    setUsername(DEFAULT_ADMIN_USERNAME);
    setPassword(DEFAULT_ADMIN_PASSWORD);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-hidden selection:bg-emerald-500 selection:text-white" dir="rtl">
      
      {/* Decorative Background Elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Theme Switch & Language */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/80 backdrop-blur-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>منظومة الولوج الآمن للإدارة</span>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
          title={darkMode ? 'المظهر الفاتح' : 'المظهر الداكن'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Login Card Container */}
      <div className="my-auto py-8 z-10 flex flex-col items-center justify-center">
        
        {/* Official Moroccan Institutional Header */}
        <div className="w-full max-w-md mb-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            {settings.ministryLogoDataURL ? (
              <img
                src={settings.ministryLogoDataURL}
                alt="شعار الوزارة"
                className="h-16 w-auto object-contain drop-shadow-xs"
              />
            ) : null}
            {settings.associationLogoDataURL ? (
              <img
                src={settings.associationLogoDataURL}
                alt="شعار الهيئة"
                className="h-16 w-auto object-contain drop-shadow-xs"
              />
            ) : null}
          </div>

          <div className="space-y-0.5 text-xs text-slate-300 font-semibold leading-relaxed">
            <p className="font-bold text-sm text-slate-100">{settings.kingdom || 'المملكة المغربية'}</p>
            <p>{settings.ministry || 'وزارة التربية الوطنية والتعليم الأولي والتكوين المهني والتأهيل'}</p>
            <p className="text-emerald-400 font-bold">{settings.delegation || 'المديرية الإقليمية الرباط'}</p>
            <p className="font-extrabold text-sm text-white pt-1">
              {settings.schoolName || 'مدرسة الفرصة الثانية الجيل الجديد يعقوب المنصور'}
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/90 rounded-3xl shadow-2xl backdrop-blur-md p-6 sm:p-8 space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-1">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-3">
              <School className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">تسجيل الدخول — الإدارة</h2>
            <p className="text-xs text-slate-400">
              يرجى إدخال اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-start gap-3 text-rose-200 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">فشل إثبات الهوية</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Rate Limit Lockout Banner */}
          {lockoutSeconds > 0 && (
            <div className="p-3.5 bg-amber-950/80 border border-amber-800/80 rounded-2xl flex items-center gap-3 text-amber-200 text-xs">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold block">موقع الدخول مؤمن مؤقتاً</span>
                <span>يرجى الانتظار <strong className="text-amber-300 font-mono text-sm px-1">{lockoutSeconds}</strong> ثانية قبل إعادة المحاولة.</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم (Login)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  disabled={isLoading || lockoutSeconds > 0}
                  className="w-full pr-11 pl-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور (Mot de passe)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={isLoading || lockoutSeconds > 0}
                  className="w-full pr-11 pl-11 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                isLoading || lockoutSeconds > 0
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-blue-600/20 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري التحقق...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>

          {/* First Time Setup Helper Dropdown */}
          <div className="pt-2 border-t border-slate-700/80 text-center">
            <button
              type="button"
              onClick={() => setShowCredentialsHelp(!showCredentialsHelp)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition cursor-pointer font-medium"
            >
              <Info className="w-4 h-4" />
              <span>بيانات الدخول الأولية لـ أول تشغيل؟</span>
            </button>

            {showCredentialsHelp && (
              <div className="mt-3 p-3 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-right space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-slate-300 font-bold border-b border-slate-800 pb-1.5">
                  <span>حساب المدير الافتراضي:</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-800/80">Administrateur</span>
                </div>
                <div className="font-mono text-slate-200 space-y-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-left" dir="ltr">
                  <div><span className="text-slate-500 text-[10px] mr-2">Login:</span><strong>admin</strong></div>
                  <div><span className="text-slate-500 text-[10px] mr-2">Password:</span><strong>Admin@2026!</strong></div>
                </div>
                <button
                  type="button"
                  onClick={handleFillDefaultCreds}
                  className="w-full py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-emerald-500/30 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ملء بيانات الدخول الأولية تلقائياً</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer Notice */}
      <footer className="w-full max-w-md mx-auto text-center text-xs text-slate-500 space-y-1 z-10 pt-4">
        <p>تطبيق تدبير المتعلمين والحضور · {settings.schoolName}</p>
        <p className="text-[11px]">السنة الدراسية {settings.schoolYear} · جميع الحقوق محفوظة للإدارة التربوية</p>
      </footer>

    </div>
  );
};
