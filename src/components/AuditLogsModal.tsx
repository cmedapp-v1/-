import React, { useState, useEffect } from 'react';
import { History, Search, X, Shield, Filter } from 'lucide-react';
import { AdminAuditLog } from '../types';
import { getStoredAdminAuditLogs } from '../utils/auth';

interface AuditLogsModalProps {
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    setLogs(getStoredAdminAuditLogs());
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.targetUsername && log.targetUsername.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;

    return matchesSearch && matchesAction;
  });

  const actionTypes = [
    'إنشاء حساب',
    'تعديل حساب',
    'إعادة تعيين كلمة المرور',
    'تغيير الحالة',
    'تحديث الصلاحيات',
    'حذف حساب',
    'تسجيل الدخول',
    'تغيير كلمة المرور الشخصية',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white font-extrabold text-base sm:text-lg">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3>سجل العمليات والأنشطة الإدارية</h3>
              <p className="text-xs text-slate-400 font-normal">
                متابعة دقيقة لجميع الأحداث والتغييرات المنفذة على حسابات المستخدمين والنظام
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

        {/* Filters Bar */}
        <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث باسم المستخدم أو نص العملية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">جميع أنواع العمليات</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-semibold">
              لا توجد سجلات تطابق معايير البحث المحددة.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        {log.performedBy}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-[11px]">
                        {log.actionType}
                      </span>
                      {log.targetUsername && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          [المستهدف: @{log.targetUsername}]
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {log.details}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleString('ar-MA', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0 mt-3">
          <span>إجمالي السجلات المسجلة: {logs.length}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
