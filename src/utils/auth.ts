// Authentication and Admin Users Management
import { 
  AdminUserAccount, 
  AdminAuditLog, 
  UserPermissionsMap, 
  AppSectionKey, 
  SectionPermissions,
  RoleType,
  UserAccountStatus 
} from '../types';

export interface AuthSession {
  isAuthenticated: boolean;
  userId: string;
  username: string;
  fullName: string;
  role: RoleType;
  roleTitle: string;
  mustChangePasswordOnFirstLogin: boolean;
  loginTime: string;
  permissions: UserPermissionsMap;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  lockoutRemainingSeconds?: number;
  mustChangePasswordOnFirstLogin?: boolean;
}

const ADMIN_CREDENTIALS_KEY = 'e2s_admin_credentials'; // Legacy fallback
const ADMIN_USERS_KEY = 'e2s_admin_users';
const ADMIN_AUDIT_LOGS_KEY = 'e2s_admin_audit_logs';
const AUTH_SESSION_KEY = 'e2s_auth_session';
const FAILED_ATTEMPTS_KEY = 'e2s_failed_login_attempts';

const DEFAULT_SALT = 'e2s_rabat_yaacoub_mansour_salt_2026';
export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@2026!';

/**
 * Default Permissions Map for Super Admin (Full Access)
 */
export const DEFAULT_SUPER_ADMIN_PERMISSIONS: UserPermissionsMap = {
  students: { view: true, add: true, edit: true, delete: true, export: true },
  animators: { view: true, add: true, edit: true, delete: true, export: true },
  schedule: { view: true, add: true, edit: true, delete: true, export: true },
  attendance: { view: true, add: true, edit: true, delete: true, export: true },
  tracking: { view: true, add: true, edit: true, delete: true, export: true },
  violations: { view: true, add: true, edit: true, delete: true, export: true },
  reports: { view: true, add: true, edit: true, delete: true, export: true },
  settings: { view: true, add: true, edit: true, delete: true, export: true },
  users: { view: true, add: true, edit: true, delete: true, export: true },
  backup: { view: true, add: true, edit: true, delete: true, export: true },
};

/**
 * Default Permissions Map for Regular Admin User (General Staff)
 */
export const DEFAULT_ADMIN_USER_PERMISSIONS: UserPermissionsMap = {
  students: { view: true, add: true, edit: true, delete: false, export: true },
  animators: { view: true, add: false, edit: false, delete: false, export: true },
  schedule: { view: true, add: true, edit: true, delete: false, export: true },
  attendance: { view: true, add: true, edit: true, delete: false, export: true },
  tracking: { view: true, add: true, edit: true, delete: false, export: true },
  violations: { view: true, add: true, edit: true, delete: false, export: true },
  reports: { view: true, add: false, edit: false, delete: false, export: true },
  settings: { view: false, add: false, edit: false, delete: false, export: false },
  users: { view: false, add: false, edit: false, delete: false, export: false },
  backup: { view: false, add: false, edit: false, delete: false, export: false },
};

/**
 * SHA-256 Password Hashing using Web Crypto API with JS fallback
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const saltedText = salt + '::' + password + '::' + salt;
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(saltedText);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback
    }
  }

  // Pure JS Fallback Hash
  let hash = 0;
  for (let i = 0; i < saltedText.length; i++) {
    const char = saltedText.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'js_hash_' + Math.abs(hash).toString(16) + '_' + saltedText.length;
}

/**
 * Get all stored admin users or initialize default list if empty
 */
export async function getStoredAdminUsers(): Promise<AdminUserAccount[]> {
  try {
    const stored = localStorage.getItem(ADMIN_USERS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as AdminUserAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore error
  }

  // Migration from legacy single admin credentials if present
  let legacyHash = '';
  let legacySalt = DEFAULT_SALT;
  let legacyUsername = DEFAULT_ADMIN_USERNAME;

  try {
    const legacyStored = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (legacyStored) {
      const legacyParsed = JSON.parse(legacyStored);
      if (legacyParsed && legacyParsed.passwordHash) {
        legacyHash = legacyParsed.passwordHash;
        legacySalt = legacyParsed.salt || DEFAULT_SALT;
        legacyUsername = legacyParsed.username || DEFAULT_ADMIN_USERNAME;
      }
    }
  } catch {
    // Ignore
  }

  if (!legacyHash) {
    legacyHash = await hashPassword(DEFAULT_ADMIN_PASSWORD, DEFAULT_SALT);
  }

  const defaultSuperAdmin: AdminUserAccount = {
    id: 'ADM-001',
    fullName: 'مدير النظام الرئيسي',
    username: legacyUsername,
    passwordHash: legacyHash,
    salt: legacySalt,
    role: 'super_admin',
    roleTitle: 'المدير المسؤول',
    phone: '0600000000',
    status: 'نشط',
    mustChangePasswordOnFirstLogin: false,
    permissions: { ...DEFAULT_SUPER_ADMIN_PERMISSIONS },
    createdAt: new Date().toISOString(),
    notes: 'الحساب الرئيسي الافتراضي للنظام',
  };

  const initialUsersList = [defaultSuperAdmin];
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(initialUsersList));
  return initialUsersList;
}

/**
 * Save admin users list to LocalStorage
 */
export function saveStoredAdminUsers(users: AdminUserAccount[]): void {
  localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(users));
}

/**
 * Get stored audit logs
 */
export function getStoredAdminAuditLogs(): AdminAuditLog[] {
  try {
    const stored = localStorage.getItem(ADMIN_AUDIT_LOGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Save audit log entry
 */
export function addAuditLog(
  performedBy: string,
  actionType: AdminAuditLog['actionType'],
  details: string,
  targetUsername?: string
): void {
  const logs = getStoredAdminAuditLogs();
  const newLog: AdminAuditLog = {
    id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    performedBy,
    targetUsername,
    actionType,
    details,
  };
  const updatedLogs = [newLog, ...logs].slice(0, 500); // Keep last 500 logs
  localStorage.setItem(ADMIN_AUDIT_LOGS_KEY, JSON.stringify(updatedLogs));
}

/**
 * Progressive Delay / Rate Limiting logic for failed attempts
 */
export function getFailedLoginAttemptsInfo(): { count: number; lockUntil: number } {
  try {
    const data = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        count: parsed.count || 0,
        lockUntil: parsed.lockUntil || 0,
      };
    }
  } catch {
    // Ignore
  }
  return { count: 0, lockUntil: 0 };
}

function recordFailedLoginAttempt(): { count: number; lockoutSeconds: number } {
  const info = getFailedLoginAttemptsInfo();
  const newCount = info.count + 1;
  const now = Date.now();
  
  let delayMs = 0;
  if (newCount >= 5) {
    delayMs = 30000; // 30 seconds
  } else if (newCount === 4) {
    delayMs = 15000; // 15 seconds
  } else if (newCount === 3) {
    delayMs = 5000;  // 5 seconds
  }

  const lockUntil = now + delayMs;
  localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({ count: newCount, lockUntil }));

  return { count: newCount, lockoutSeconds: Math.ceil(delayMs / 1000) };
}

function clearFailedLoginAttempts(): void {
  localStorage.removeItem(FAILED_ATTEMPTS_KEY);
}

/**
 * Verify Login Credentials against multi-user accounts
 */
export async function verifyLogin(usernameInput: string, passwordInput: string): Promise<LoginResult> {
  const failedInfo = getFailedLoginAttemptsInfo();
  const now = Date.now();
  if (failedInfo.lockUntil > now) {
    const remainingSecs = Math.ceil((failedInfo.lockUntil - now) / 1000);
    return {
      success: false,
      message: `تم تجاوز عدد محاولات الدخول الخاطئة. يرجى الانتظار ${remainingSecs} ثانية قبل المحاولة مجدداً.`,
      lockoutRemainingSeconds: remainingSecs,
    };
  }

  const users = await getStoredAdminUsers();
  const cleanInputUser = usernameInput.trim().toLowerCase();

  const user = users.find((u) => u.username.trim().toLowerCase() === cleanInputUser);

  if (!user) {
    const fail = recordFailedLoginAttempt();
    return {
      success: false,
      message: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات المدخلة.',
      lockoutRemainingSeconds: fail.lockoutSeconds > 0 ? fail.lockoutSeconds : undefined,
    };
  }

  const inputHash = await hashPassword(passwordInput, user.salt);
  if (inputHash !== user.passwordHash) {
    const fail = recordFailedLoginAttempt();
    return {
      success: false,
      message: 'اسم المستخدم أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات المدخلة.',
      lockoutRemainingSeconds: fail.lockoutSeconds > 0 ? fail.lockoutSeconds : undefined,
    };
  }

  // Check Account Active Status
  if (user.status === 'غير نشط') {
    return {
      success: false,
      message: 'هذا الحساب الإداري معطل حالياً من طرف إدارة النظام. يرجى التواصل مع المسؤول الرئيسي.',
    };
  }

  // Success
  clearFailedLoginAttempts();

  // Update last login timestamp
  user.lastLoginAt = new Date().toISOString();
  saveStoredAdminUsers(users);

  // Add audit log
  addAuditLog(user.username, 'تسجيل الدخول', `تم تسجيل الدخول بنجاح للحساب (${user.fullName})`);

  const session: AuthSession = {
    isAuthenticated: true,
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    roleTitle: user.roleTitle,
    mustChangePasswordOnFirstLogin: user.mustChangePasswordOnFirstLogin,
    loginTime: new Date().toISOString(),
    permissions: user.permissions || (user.role === 'super_admin' ? DEFAULT_SUPER_ADMIN_PERMISSIONS : DEFAULT_ADMIN_USER_PERMISSIONS),
  };

  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));

  return {
    success: true,
    mustChangePasswordOnFirstLogin: user.mustChangePasswordOnFirstLogin,
  };
}

/**
 * Get active auth session
 */
export function getStoredAuthSession(): AuthSession | null {
  try {
    const data = localStorage.getItem(AUTH_SESSION_KEY);
    if (data) {
      const parsed = JSON.parse(data) as AuthSession;
      if (parsed && parsed.isAuthenticated) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Logout session
 */
export function logoutAdminSession(): void {
  const session = getStoredAuthSession();
  if (session) {
    addAuditLog(session.username, 'تسجيل الدخول', 'تم تسجيل الخروج من النظام');
  }
  localStorage.removeItem(AUTH_SESSION_KEY);
}

/**
 * User CRUD Operations with Audit Logging and Guard Logic
 */

// Add New Admin User
export async function addAdminUser(
  userData: {
    fullName: string;
    username: string;
    password: string;
    role: RoleType;
    roleTitle: string;
    phone?: string;
    status: UserAccountStatus;
    mustChangePasswordOnFirstLogin: boolean;
    permissions: UserPermissionsMap;
    notes?: string;
  },
  currentUsername: string
): Promise<{ success: boolean; message: string; newUser?: AdminUserAccount }> {
  const users = await getStoredAdminUsers();
  const cleanUsername = userData.username.trim();

  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, message: 'اسم المستخدم يجب أن يتكون من 3 أحرف على الأقل.' };
  }

  if (users.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    return { success: false, message: 'اسم المستخدم (Login) مستعمل بالفعل. يرجى اختيار اسم مستخدم آخر.' };
  }

  if (!userData.password || userData.password.length < 6) {
    return { success: false, message: 'كلمة المرور يجب أن تتكون من 6 عناصر على الأقل.' };
  }

  const salt = 'e2s_salt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  const passwordHash = await hashPassword(userData.password, salt);

  // Auto Generate ID: ADM-001, ADM-002...
  const nextNum = users.length + 1;
  const id = `ADM-${String(nextNum).padStart(3, '0')}`;

  const newUser: AdminUserAccount = {
    id,
    fullName: userData.fullName.trim(),
    username: cleanUsername,
    passwordHash,
    salt,
    role: userData.role,
    roleTitle: userData.roleTitle.trim() || (userData.role === 'super_admin' ? 'مدير ممتاز' : 'مستخدم إداري'),
    phone: userData.phone?.trim(),
    status: userData.status,
    mustChangePasswordOnFirstLogin: userData.mustChangePasswordOnFirstLogin,
    permissions: userData.permissions,
    createdAt: new Date().toISOString(),
    notes: userData.notes?.trim(),
  };

  users.push(newUser);
  saveStoredAdminUsers(users);

  addAuditLog(
    currentUsername,
    'إنشاء حساب',
    `تم إنشاء حساب إداري جديد باسم (${newUser.fullName}) وصلاحية (${newUser.roleTitle})`,
    newUser.username
  );

  return { success: true, message: 'تم إضافة المستخدم الإداري بنجاح!', newUser };
}

// Update Admin User Details
export async function updateAdminUser(
  userId: string,
  updatedFields: Partial<Omit<AdminUserAccount, 'id' | 'passwordHash' | 'salt' | 'createdAt'>>,
  currentUsername: string
): Promise<{ success: boolean; message: string }> {
  const users = await getStoredAdminUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, message: 'المستخدم الإداري غير موجود.' };
  }

  const targetUser = users[userIndex];

  // If changing username, ensure uniqueness
  if (updatedFields.username && updatedFields.username.trim().toLowerCase() !== targetUser.username.toLowerCase()) {
    const cleanName = updatedFields.username.trim();
    if (users.some((u) => u.id !== userId && u.username.toLowerCase() === cleanName.toLowerCase())) {
      return { success: false, message: 'اسم المستخدم (Login) الجديد مستعمل بالفعل من طرف حساب آخر.' };
    }
  }

  // Guard: Cannot disable or change role of the last active Super Admin
  if (targetUser.role === 'super_admin') {
    const superAdmins = users.filter((u) => u.role === 'super_admin' && u.status === 'نشط');
    if (superAdmins.length <= 1) {
      if (updatedFields.status === 'غير نشط') {
        return { success: false, message: 'لا يمكن تعطيل الحساب الوحيد للمسؤول الرئيسي (Super Admin) في النظام.' };
      }
      if (updatedFields.role === 'admin_user') {
        return { success: false, message: 'لا يمكن تغيير درجة صلاحية المسؤول الرئيسي الوحيد في النظام.' };
      }
    }
  }

  const updatedUser: AdminUserAccount = {
    ...targetUser,
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  users[userIndex] = updatedUser;
  saveStoredAdminUsers(users);

  addAuditLog(
    currentUsername,
    'تعديل حساب',
    `تم تعديل بيانات الحساب الإداري (${updatedUser.fullName})`,
    updatedUser.username
  );

  // If modifying active session user, update session
  const activeSession = getStoredAuthSession();
  if (activeSession && activeSession.userId === userId) {
    const newSession: AuthSession = {
      ...activeSession,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      roleTitle: updatedUser.roleTitle,
      mustChangePasswordOnFirstLogin: updatedUser.mustChangePasswordOnFirstLogin,
      permissions: updatedUser.permissions,
    };
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
  }

  return { success: true, message: 'تم تحديث بيانات المستخدم بنجاح!' };
}

// Toggle Admin User Status (Active / Inactive)
export async function toggleAdminUserStatus(
  userId: string,
  currentUsername: string
): Promise<{ success: boolean; message: string }> {
  const users = await getStoredAdminUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, message: 'المستخدم غير موجود.' };
  }

  const newStatus: UserAccountStatus = user.status === 'نشط' ? 'غير نشط' : 'نشط';

  // Guard against disabling last active Super Admin
  if (user.role === 'super_admin' && newStatus === 'غير نشط') {
    const activeSuperAdmins = users.filter((u) => u.role === 'super_admin' && u.status === 'نشط');
    if (activeSuperAdmins.length <= 1) {
      return { success: false, message: 'لا يمكن تعطيل حساب المسؤول الرئيسي الوحيد النشط في النظام.' };
    }
  }

  user.status = newStatus;
  user.updatedAt = new Date().toISOString();
  saveStoredAdminUsers(users);

  addAuditLog(
    currentUsername,
    'تغيير الحالة',
    `تم تغيير حالة الحساب (${user.fullName}) إلى: ${newStatus}`,
    user.username
  );

  return {
    success: true,
    message: `تم ${newStatus === 'نشط' ? 'تفعيل' : 'تعطيل'} حساب (${user.fullName}) بنجاح!`,
  };
}

// Reset Admin User Password (by Super Admin)
export async function resetAdminUserPassword(
  userId: string,
  newPasswordInput: string,
  mustChangeOnFirstLogin: boolean,
  currentUsername: string
): Promise<{ success: boolean; message: string }> {
  if (!newPasswordInput || newPasswordInput.trim().length < 6) {
    return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 عناصر على الأقل.' };
  }

  const users = await getStoredAdminUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, message: 'المستخدم غير موجود.' };
  }

  const newSalt = 'e2s_salt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  const newHash = await hashPassword(newPasswordInput, newSalt);

  user.passwordHash = newHash;
  user.salt = newSalt;
  user.mustChangePasswordOnFirstLogin = mustChangeOnFirstLogin;
  user.updatedAt = new Date().toISOString();

  saveStoredAdminUsers(users);

  addAuditLog(
    currentUsername,
    'إعادة تعيين كلمة المرور',
    `تم إعادة تعيين كلمة المرور للحساب (${user.fullName})`,
    user.username
  );

  return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح!' };
}

// Delete Admin User
export async function deleteAdminUser(
  userId: string,
  currentUsername: string
): Promise<{ success: boolean; message: string }> {
  const users = await getStoredAdminUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, message: 'المستخدم غير موجود.' };
  }

  // Guard against deleting last Super Admin
  if (user.role === 'super_admin') {
    const superAdmins = users.filter((u) => u.role === 'super_admin');
    if (superAdmins.length <= 1) {
      return { success: false, message: 'لا يمكن حذف الحساب الوحيد للمسؤول الرئيسي (Super Admin) في النظام.' };
    }
  }

  // Guard against deleting self
  const activeSession = getStoredAuthSession();
  if (activeSession && activeSession.userId === userId) {
    return { success: false, message: 'لا يمكن حذف الحساب المسجل به دخولا حالياً.' };
  }

  const filtered = users.filter((u) => u.id !== userId);
  saveStoredAdminUsers(filtered);

  addAuditLog(
    currentUsername,
    'حذف حساب',
    `تم حذف الحساب الإداري (${user.fullName}) [${user.username}]`,
    user.username
  );

  return { success: true, message: 'تم حذف الحساب الإداري بنجاح.' };
}

// Compulsory Change Password on First Login
export async function changeUserPasswordOnFirstLogin(
  userId: string,
  newPasswordInput: string
): Promise<{ success: boolean; message: string }> {
  if (!newPasswordInput || newPasswordInput.trim().length < 6) {
    return { success: false, message: 'كلمة المرور الجديدة يجب أن تتكون من 6 عناصر على الأقل.' };
  }

  const users = await getStoredAdminUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, message: 'المستخدم غير موجود.' };
  }

  const newSalt = 'e2s_salt_' + Math.random().toString(36).substring(2) + '_' + Date.now();
  const newHash = await hashPassword(newPasswordInput, newSalt);

  user.passwordHash = newHash;
  user.salt = newSalt;
  user.mustChangePasswordOnFirstLogin = false;
  user.updatedAt = new Date().toISOString();

  saveStoredAdminUsers(users);

  addAuditLog(
    user.username,
    'تغيير كلمة المرور الشخصية',
    `قام المستخدم (${user.fullName}) بتغيير كلمة المرور الإلزامية عند أول تسجيل دخول`
  );

  // Update active session
  const activeSession = getStoredAuthSession();
  if (activeSession && activeSession.userId === userId) {
    activeSession.mustChangePasswordOnFirstLogin = false;
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(activeSession));
  }

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن استخدام التطبيق بشكل كامل.' };
}

/**
 * Legacy Support Wrapper Functions
 */
export async function initializeAdminAccount(): Promise<{ username: string }> {
  const users = await getStoredAdminUsers();
  const primary = users[0] || { username: DEFAULT_ADMIN_USERNAME };
  return { username: primary.username };
}

export async function getStoredAdminCredentials() {
  const users = await getStoredAdminUsers();
  const primary = users[0];
  return {
    username: primary.username,
    passwordHash: primary.passwordHash,
    salt: primary.salt,
    updatedAt: primary.updatedAt || primary.createdAt,
  };
}

export async function changeAdminPassword(currentPasswordInput: string, newPasswordInput: string) {
  const activeSession = getStoredAuthSession();
  if (!activeSession) {
    return { success: false, message: 'لم يتم العثور على جلسة دخول حالية.' };
  }
  const users = await getStoredAdminUsers();
  const user = users.find((u) => u.id === activeSession.userId);
  if (!user) {
    return { success: false, message: 'المستخدم غير موجود.' };
  }

  const currentInputHash = await hashPassword(currentPasswordInput, user.salt);
  if (currentInputHash !== user.passwordHash) {
    return { success: false, message: 'كلمة المرور الحالية غير صحيحة.' };
  }

  const res = await changeUserPasswordOnFirstLogin(user.id, newPasswordInput);
  return res;
}

export async function changeAdminUsername(newUsername: string) {
  const activeSession = getStoredAuthSession();
  if (!activeSession) {
    return { success: false, message: 'لم يتم العثور على جلسة دخول حالية.' };
  }
  return await updateAdminUser(activeSession.userId, { username: newUsername }, activeSession.username);
}

/**
 * Permission Checker Helper
 */
export function hasPermission(
  session: AuthSession | null,
  section: AppSectionKey,
  action: keyof SectionPermissions = 'view'
): boolean {
  if (!session) return false;
  if (session.role === 'super_admin') return true;
  if (!session.permissions || !session.permissions[section]) return false;
  return !!session.permissions[section][action];
}
