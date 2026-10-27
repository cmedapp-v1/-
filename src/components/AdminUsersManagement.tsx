import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  KeyRound, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  History, 
  Lock, 
  Power,
  Info,
  Phone,
  Clock,
  UserCheck
} from 'lucide-react';
import { AdminUserAccount, RoleType, UserAccountStatus } from '../types';
import { 
  getStoredAdminUsers, 
  toggleAdminUserStatus, 
  deleteAdminUser 
} from '../utils/auth';
import { AdminUserModal } from './AdminUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { AuditLogsModal } from './AuditLogsModal';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminUsersManagementProps {
  currentAdminUsername: string;
}

export const AdminUsersManagement: React.FC<AdminUsersManagementProps> = ({
  currentAdminUsername,
}) => {
  const [users, setUsers] = useState<AdminUserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<AdminUserAccount | null>(null);

  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<AdminUserAccount | null>(null);

  const [isAuditLogsModalOpen, setIsAuditLogsModalOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirm dialog state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
  });

  const loadUsers = async () => {
    const loaded = await getStoredAdminUsers();
    setUsers(loaded);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.roleTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Toggle Active/Inactive Status
  const handleToggleStatus = (user: AdminUserAccount) => {
    const isActivating = user.status === 'غير نشط';
    setConfirmConfig({
      isOpen: true,
      title: isActivating ? 'تأكيد تفعيل الحساب' : 'تأكيد تعطيل الحساب',
      message: isActivating
        ? `هل أنت متأكد من تفعيل الحساب الإداري (${user.fullName})؟ سيتمكن المستخدم من الدخول للتطبيق.`
        : `هل أنت متأكد من تعطيل الحساب الإداري (${user.fullName})؟ لن يتمكن المستخدم من الدخول حتى إعادة تفعيله.`,
      type: isActivating ? 'info' : 'warning',
      onConfirm: async () => {
        const res = await toggleAdminUserStatus(user.id, currentAdminUsername);
        if (res.success) {
          showToast('success', res.message);
          loadUsers();
        } else {
          showToast('error', res.message);
        }
      },
    });
  };

  // Delete User
  const handleDeleteUser = (user: AdminUserAccount) => {
    setConfirmConfig({
      isOpen: true,
      title: 'تأكيد حذف الحساب الإداري',
      message: `هل أنت متأكد تماماً من حذف حساب المستخدم (${user.fullName}) [@${user.username}]؟ هذا الإجراء لا يمكن التراجع عنه.`,
      type: 'danger',
      onConfirm: async () => {
        const res = await deleteAdminUser(user.id, currentAdminUsername);
        if (res.success) {
          showToast('success', res.message);
          loadUsers();
        } else {
          showToast('error', res.message);
        }
      },
    });
  };

  // Stats
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.status === 'نشط').length;
  const inactiveUsersCount = users.filter((u) => u.status === 'غير نشط').length;
  const superAdminsCount = users.filter((u) => u.role === 'super_admin').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`p-4 rounded-xl text-white font-bold text-xs flex items-center justify-between shadow-lg ${
          toastMsg.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-white hover:opacity-80">✕</button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmLabel="نعم، تنفيذ الإجراء"
        cancelLabel="إلغاء"
      />

      {/* Header Banner & Quick Actions */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30 shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
              <span>تدبير المستخدمين الإداريين والحسابات</span>
              <span className="text-xs px-3 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                Gestion des Utilisateurs
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              إدارة حسابات الدخول، تخصيص درجات الصلاحيات، متابعة سجل الأنشطة والحفاظ على أمان التطبيق
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuditLogsModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer"
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>سجل العمليات</span>
          </button>

          <button
            onClick={() => {
              setUserToEdit(null);
              setIsUserModalOpen(true);
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مستخدم إداري</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 rounded-xl font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">إجمالي الحسابات</div>
            <div className="text-lg font-extrabold text-slate-900 dark:text-white">{totalUsersCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-xl font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الحسابات النشطة</div>
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{activeUsersCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 rounded-xl font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">الحسابات المعطلة</div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{inactiveUsersCount}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 rounded-xl font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">المسؤولين الرئيسييين</div>
            <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{superAdminsCount}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم الكامل، اسم المستخدم (Login)، أو الصفة الإدارية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="نشط">نشط فقط</option>
            <option value="غير نشط">معطل فقط</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer"
          >
            <option value="all">جميع الصلاحيات</option>
            <option value="super_admin">مسؤول رئيسي (Super Admin)</option>
            <option value="admin_user">مستخدم إداري (Admin User)</option>
          </select>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">الرقم</th>
                <th className="p-3.5">المستخدم والصفة الإدارية</th>
                <th className="p-3.5">اسم الدخول (Login)</th>
                <th className="p-3.5">مستوى الصلاحية</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">تاريخ الإنشاء / أخر دخول</th>
                <th className="p-3.5 text-center">العمليات الإدارية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                    لا يوجد مستخدمين مطابقين لمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentLoggedUser = u.username.toLowerCase() === currentAdminUsername.toLowerCase();

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      
                      {/* ID */}
                      <td className="p-3.5 font-mono font-extrabold text-slate-500">
                        {u.id}
                      </td>

                      {/* Name & Role Title */}
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.fullName}</span>
                          {isCurrentLoggedUser && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold">
                              حسابك الحالي
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                          {u.roleTitle} {u.phone && `· 📱 ${u.phone}`}
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        @{u.username}
                      </td>

                      {/* Role Level */}
                      <td className="p-3.5">
                        {u.role === 'super_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold border border-indigo-200 dark:border-indigo-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>مسؤول رئيسي</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold border border-slate-200 dark:border-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                            <span>مستخدم إداري</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        {u.status === 'نشط' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-extrabold border border-rose-200 dark:border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>معطل</span>
                          </span>
                        )}
                      </td>

                      {/* Timestamps */}
                      <td className="p-3.5 text-[11px] text-slate-500 font-medium">
                        <div>أنشئ: {new Date(u.createdAt).toLocaleDateString('ar-MA')}</div>
                        {u.lastLoginAt ? (
                          <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            آخر دخول: {new Date(u.lastLoginAt).toLocaleDateString('ar-MA')}
                          </div>
                        ) : (
                          <div className="text-slate-400 italic mt-0.5">لم يسجل الدخول بعد</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* Edit User */}
                          <button
                            onClick={() => {
                              setUserToEdit(u);
                              setIsUserModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                            title="تعديل البيانات والصلاحيات"
                          >
                            <Edit3 className="w-4 h-4 text-blue-600" />
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setUserToResetPassword(u);
                              setIsResetPasswordModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold transition cursor-pointer"
                            title="إعادة تعيين كلمة المرور"
                          >
                            <KeyRound className="w-4 h-4 text-indigo-600" />
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg font-bold transition cursor-pointer ${
                              u.status === 'نشط'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                            }`}
                            title={u.status === 'نشط' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrentLoggedUser}
                            className={`p-1.5 rounded-lg font-bold transition ${
                              isCurrentLoggedUser
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400'
                                : 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 cursor-pointer'
                            }`}
                            title={isCurrentLoggedUser ? 'لا يمكن حذف الحساب الحالي' : 'حذف الحساب'}
                          >
                            <Trash2 className="w-4 h-4 text-rose-600" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Modals */}
      {isUserModalOpen && (
        <AdminUserModal
          userToEdit={userToEdit}
          currentAdminUsername={currentAdminUsername}
          onClose={() => {
            setIsUserModalOpen(false);
            setUserToEdit(null);
          }}
          onSuccess={(msg) => {
            showToast('success', msg);
            loadUsers();
          }}
        />
      )}

      {isResetPasswordModalOpen && userToResetPassword && (
        <ResetPasswordModal
          user={userToResetPassword}
          currentAdminUsername={currentAdminUsername}
          onClose={() => {
            setIsResetPasswordModalOpen(false);
            setUserToResetPassword(null);
          }}
          onSuccess={(msg) => {
            showToast('success', msg);
            loadUsers();
          }}
        />
      )}

      {isAuditLogsModalOpen && (
        <AuditLogsModal onClose={() => setIsAuditLogsModalOpen(false)} />
      )}

    </div>
  );
};
