import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save, KeyRound, ShieldAlert } from 'lucide-react';
import { changeUserPasswordOnFirstLogin } from '../utils/auth';

interface MustChangePasswordModalProps {
  userId: string;
  username: string;
  fullName: string;
  onSuccess: () => void;
}

export const MustChangePasswordModal: React.FC<MustChangePasswordModalProps> = ({
  userId,
  username,
  fullName,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('كلمة المرور الجديدة يجب أن تحتوي على 6 عناصر/أحرف على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeUserPasswordOnFirstLogin(userId, newPassword);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع أثناء تحديث كلمة المرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scaleUp space-y-6">
        
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            تغيير كلمة المرور الأولية
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            مرحباً بك <strong className="text-slate-800 dark:text-slate-200">{fullName}</strong> (<span className="font-mono">{username}</span>). لدواعي أمان النظام، يرجى تعيين كلمة مرور جديدة لحسابك قبل البدء في الاستخدام.
          </p>
        </div>

        {/* Mandatory Banner */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center gap-3 text-xs text-amber-800 dark:text-amber-200 font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <span>هذا الإجراء إجباري لأول تسجيل دخول بالحساب المحدد.</span>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-bold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور جديدة قوية"
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="إعادة إدخال كلمة المرور"
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-amber-500"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-600/30"
          >
            <Save className="w-4 h-4" />
            <span>حفظ كلمة المرور والبدء</span>
          </button>
        </form>

      </div>
    </div>
  );
};
