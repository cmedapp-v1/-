import React from 'react';
import { AppSettings } from '../types';

interface OfficialHeaderProps {
  settings: AppSettings;
  className?: string;
  variant?: 'full' | 'compact';
}

export const OfficialHeader: React.FC<OfficialHeaderProps> = ({ 
  settings, 
  className = '', 
  variant = 'full' 
}) => {
  return (
    <div className={`flex justify-between items-start w-full bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 ${className}`} dir="rtl">
      {/* Right Side: Ministry Info */}
      <div className="flex items-center gap-4">
        {settings.ministryLogoDataURL && (
          <img 
            src={settings.ministryLogoDataURL} 
            alt="شعار الوزارة" 
            className="h-20 w-auto object-contain"
          />
        )}
        <div className="flex flex-col text-right space-y-0.5">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{settings.kingdom || 'المملكة المغربية'}</span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{settings.ministry || 'وزارة التربية الوطنية والتعليم الأولي والتكوين المهني والتأهيل'}</span>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{settings.delegation || 'المديرية الإقليمية الرباط'}</span>
          <span className="text-[12px] font-black text-slate-900 dark:text-white pt-0.5">{settings.schoolName || 'مدرسة الفرصة الثانية الجيل الجديد يعقوب المنصور'}</span>
        </div>
      </div>

      {/* Center: Optional School Logo or Title */}
      <div className="flex flex-col items-center justify-center text-center">
        {variant === 'full' && (
          <>
            <div className="flex items-center gap-3 mb-2">
              {settings.schoolLogoDataURL && (
                <img 
                  src={settings.schoolLogoDataURL} 
                  alt="شعار المدرسة" 
                  className="h-16 w-auto object-contain"
                />
              )}
            </div>
            <div className="px-3.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
              السنة الدراسية: {settings.schoolYear}
            </div>
          </>
        )}
      </div>

      {/* Left Side: Association Info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col text-left items-end">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">الجمعية المسيرة / الهيئة المرافقة</span>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">مدرسة الفرصة الثانية الجيل الجديد</span>
        </div>
        {settings.associationLogoDataURL && (
          <img 
            src={settings.associationLogoDataURL} 
            alt="شعار الهيئة" 
            className="h-20 w-auto object-contain"
          />
        )}
      </div>
    </div>
  );
};
