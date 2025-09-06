// localStorage-based auth system
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  allDepartments?: string[];
  departmentRoles?: Array<{
    departmentId: string;
    roles: string[];
  }>;
}

const AUTH_KEY = 'faculty_user';

export class Auth {
  // Save user to localStorage
  static setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    }
  }

  // Get user from localStorage
  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Remove user from localStorage
  static clearUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
    }
  }

  // Check if user is logged in
  static isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  // Login function
  static async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        this.setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }

  // Logout
  static logout() {
    this.clearUser();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
}