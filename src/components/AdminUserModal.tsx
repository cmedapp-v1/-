import React, { useState } from 'react';
import { 
  X, 
  Save, 
  ShieldCheck, 
  UserPlus, 
  UserCheck, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square, 
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  AdminUserAccount, 
  UserPermissionsMap, 
  AppSectionKey, 
  SectionPermissions,
  RoleType,
  UserAccountStatus 
} from '../types';
import { 
  DEFAULT_SUPER_ADMIN_PERMISSIONS, 
  DEFAULT_ADMIN_USER_PERMISSIONS,
  addAdminUser,
  updateAdminUser
} from '../utils/auth';

interface AdminUserModalProps {
  userToEdit?: AdminUserAccount | null;
  currentAdminUsername: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const SECTION_LABELS: Record<AppSectionKey, { name: string; desc: string }> = {
  students: { name: 'إدارة المتعلمين', desc: 'إضافة وتعديل وحذف بيانات المتعلمين والملفات الشخصية' },
  animators: { name: 'تدبير المنشطين والمؤطرين', desc: 'إدارة أطقم التكوين ومجالات التخصص والمسندات' },
  schedule: { name: 'التخطيط الأسبوعي', desc: 'إعداد وحينتة جداول الحصص والتكوينات الأسبوعية' },
  attendance: { name: 'ورقة النداء اليومية', desc: 'تسجيل الحضور والغياب اليومي وتصدير أوراق النداء' },
  tracking: { name: 'تدبير الغيابات والتأخرات', desc: 'متابعة رصيد غيابات المتعلمين وإصدار رخص الخروج وزيارات العيادة' },
  violations: { name: 'تدبير المخالفات والالتزامات', desc: 'تسجيل المخالفات التأديبية وتوليد صيغ الالتزامات الخطية' },
  reports: { name: 'التقارير والإحصائيات', desc: 'الاطلاع وتصدير التقارير الإحصائية ومخططات المواظبة' },
  settings: { name: 'إعدادات النظام والمؤسسة', desc: 'تعديل بيانات المؤسسة والشعب والأقسام' },
  users: { name: 'تدبير المستخدمين الإداريين', desc: 'إنشاء وتعديل الحسابات والتحكم في مصفوفة الصلاحيات' },
  backup: { name: 'النسخ الاحتياطي وتصحيح البيانات', desc: 'تصدير واستعادة النسخ الاحتياطية وإجراء التعديلات الهيكلية' },
};

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  userToEdit,
  currentAdminUsername,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!userToEdit;

  // Basic Details State
  const [fullName, setFullName] = useState(userToEdit?.fullName || '');
  const [username, setUsername] = useState(userToEdit?.username || '');
  const [roleTitle, setRoleTitle] = useState(userToEdit?.roleTitle || 'حارس عام');
  const [phone, setPhone] = useState(userToEdit?.phone || '');
  const [role, setRole] = useState<RoleType>(userToEdit?.role || 'admin_user');
  const [status, setStatus] = useState<UserAccountStatus>(userToEdit?.status || 'نشط');
  const [notes, setNotes] = useState(userToEdit?.notes || '');
  const [mustChangePasswordOnFirstLogin, setMustChangePasswordOnFirstLogin] = useState(
    userToEdit ? userToEdit.mustChangePasswordOnFirstLogin : true
  );

  // Password Fields (Required on Creation, Optional on Edit)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Permissions Matrix State
  const [permissions, setPermissions] = useState<UserPermissionsMap>(
    userToEdit?.permissions || { ...DEFAULT_ADMIN_USER_PERMISSIONS }
  );

  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission Checkbox Toggle Helper
  const handleTogglePermission = (
    section: AppSectionKey,
    action: keyof SectionPermissions
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [action]: !prev[section][action],
      },
    }));
  };

  // Toggle all actions for a specific section
  const handleToggleSectionAll = (section: AppSectionKey) => {
    const sectionPerms = permissions[section];
    const allChecked = Object.values(sectionPerms).every(Boolean);
    const newValue = !allChecked;

    setPermissions((prev) => ({
      ...prev,
      [section]: {
        view: newValue,
        add: newValue,
        edit: newValue,
        delete: newValue,
        export: newValue,
      },
    }));
  };

  // Presets Handlers
  const applyPreset = (preset: 'all' | 'none' | 'guard' | 'read_only') => {
    if (preset === 'all') {
      setPermissions({ ...DEFAULT_SUPER_ADMIN_PERMISSIONS });
    } else if (preset === 'none') {
      const empty: Partial<UserPermissionsMap> = {};
      (Object.keys(SECTION_LABELS) as AppSectionKey[]).forEach((s) => {
        empty[s] = { view: false, add: false, edit: false, delete: false, export: false };
      });
      setPermissions(empty as UserPermissionsMap);
    } else if (preset === 'guard') {
      setPermissions({ ...DEFAULT_ADMIN_USER_PERMISSIONS });
    } else if (preset === 'read_only') {
      const readOnlyMap: Partial<UserPermissionsMap> = {};
      (Object.keys(SECTION_LABELS) as AppSectionKey[]).forEach((s) => {
        readOnlyMap[s] = { view: true, add: false, edit: false, delete: false, export: true };
      });
      setPermissions(readOnlyMap as UserPermissionsMap);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('يرجى إدخال الاسم الكامل للمستخدم.');
      setActiveTab('info');
      return;
    }

    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل.');
      setActiveTab('info');
      return;
    }

    if (!isEditing) {
      if (!password || password.length < 6) {
        setErrorMsg('كلمة المرور يجب أن تتكون من 6 عناصر على الأقل.');
        setActiveTab('info');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('كلمة المرور وتأكيدها غير متطابقين.');
        setActiveTab('info');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isEditing && userToEdit) {
        const res = await updateAdminUser(
          userToEdit.id,
          {
            fullName: fullName.trim(),
            username: username.trim(),
            roleTitle: roleTitle.trim(),
            phone: phone.trim(),
            role,
            status,
            mustChangePasswordOnFirstLogin,
            permissions,
            notes: notes.trim(),
          },
          currentAdminUsername
        );

        if (res.success) {
          onSuccess(res.message);
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } else {
        const res = await addAdminUser(
          {
            fullName: fullName.trim(),
            username: username.trim(),
            password,
            roleTitle: roleTitle.trim(),
            phone: phone.trim(),
            role,
            status,
            mustChangePasswordOnFirstLogin,
            permissions,
            notes: notes.trim(),
          },
          currentAdminUsername
        );

        if (res.success) {
          onSuccess(res.message);
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch {
      setErrorMsg('حدث خطأ غير متوقع أثناء حفظ حساب المستخدم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full h-[90vh] shadow-2xl flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-extrabold text-base sm:text-lg">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {isEditing ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3>{isEditing ? `تعديل بيانات الحساب (${userToEdit.fullName})` : 'إضافة مستخدم إداري جديد'}</h3>
              <p className="text-xs text-slate-400 font-normal">
                {isEditing ? 'تعديل البيانات الشخصية ومستوى الصلاحيات' : 'إنشاء حساب دخول جديد وتخصيص صلاحياته'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex gap-2 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'info'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>1. البيانات الشخصية والدخول</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. مصفوفة الصلاحيات والأذونات</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5">
          {activeTab === 'info' ? (
            <div className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الاسم الكامل للمستخدم *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عبد الرحيم العلمي"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    اسم المستخدم (Login) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: a.alami"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    dir="ltr"
                  />
                </div>

                {/* Job Title / Role Title */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المهمة أو الصفة الإدارية *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: حارس عام / مقتصد / ناظر / مسؤول توجيه"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    placeholder="06XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Role Level */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مستوى الصلاحيات الرئيسية *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as RoleType;
                      setRole(newRole);
                      if (newRole === 'super_admin') {
                        setPermissions({ ...DEFAULT_SUPER_ADMIN_PERMISSIONS });
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="admin_user">مستخدم إداري عادي (محدد بالصلاحيات)</option>
                    <option value="super_admin">مسؤول رئيسي (Super Admin - صلاحيات كاملة)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الحساب *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserAccountStatus)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
                  >
                    <option value="نشط">نشط (يمكنه تسجيل الدخول)</option>
                    <option value="غير نشط">غير نشط (معطل ومحظر من الدخول)</option>
                  </select>
                </div>
              </div>

              {/* Password Fields for New User */}
              {!isEditing && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span>تعيين كلمة المرور الأولية</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        كلمة المرور *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required={!isEditing}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تأكيد كلمة المرور *
                      </label>
                      <input
                        type="password"
                        required={!isEditing}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Force Password Change Checkbox */}
              <label className="flex items-center gap-2.5 p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustChangePasswordOnFirstLogin}
                  onChange={(e) => setMustChangePasswordOnFirstLogin(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  إلزام المستخدم بتغيير كلمة المرور الشخصية عند أول تسجيل دخول
                </span>
              </label>

              {/* Administrative Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات إدارية
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات توضيحية حول مسؤوليات هذا المستخدم..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Presets Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>نماذج صلاحيات جاهزة:</span>
                </span>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 rounded-lg font-bold border border-emerald-300 dark:border-emerald-800"
                  >
                    صلاحيات كاملة
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('guard')}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 hover:bg-blue-200 rounded-lg font-bold border border-blue-300 dark:border-blue-800"
                  >
                    نموذج الحارس العام
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('read_only')}
                    className="px-3 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 hover:bg-amber-200 rounded-lg font-bold border border-amber-300 dark:border-amber-800"
                  >
                    قراءة وتصدير فقط
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('none')}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 rounded-lg font-bold"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              {/* Permissions Matrix Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">الأقسام والوظائف</th>
                      <th className="p-3 text-center">عرض</th>
                      <th className="p-3 text-center">إضافة</th>
                      <th className="p-3 text-center">تعديل</th>
                      <th className="p-3 text-center">حذف</th>
                      <th className="p-3 text-center">تصدير</th>
                      <th className="p-3 text-center">القسم كاملاً</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(Object.keys(SECTION_LABELS) as AppSectionKey[]).map((secKey) => {
                      const label = SECTION_LABELS[secKey];
                      const secPerms = permissions[secKey] || { view: false, add: false, edit: false, delete: false, export: false };
                      const isAllChecked = Object.values(secPerms).every(Boolean);

                      return (
                        <tr key={secKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900 dark:text-white">{label.name}</div>
                            <div className="text-[11px] text-slate-400 font-normal">{label.desc}</div>
                          </td>

                          {(['view', 'add', 'edit', 'delete', 'export'] as (keyof SectionPermissions)[]).map((act) => (
                            <td key={act} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={secPerms[act]}
                                onChange={() => handleTogglePermission(secKey, act)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                          ))}

                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSectionAll(secKey)}
                              className={`p-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                isAllChecked
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isAllChecked ? 'محدد كاملاً' : 'تحديد الكل'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'تحديث الحساب والصلاحيات' : 'حفظ وإنشاء الحساب الإداري'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
