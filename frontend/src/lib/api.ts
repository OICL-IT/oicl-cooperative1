/**
 * API client for OICL Cooperative application
 */

class ApiClient {
  private baseUrl = `${((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '')}/api`;
  private token: string | null = localStorage.getItem('oicl-token');
  private user: any | null = JSON.parse(localStorage.getItem('oicl-user') || 'null');

  async fetch(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  auth = {
    login: async (credentials: any) => {
      const data = await this.fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('oicl-token', data.token);
      localStorage.setItem('oicl-user', JSON.stringify(data.user));
      return data;
    },
    logout: () => {
      this.token = null;
      this.user = null;
      localStorage.removeItem('oicl-token');
      localStorage.removeItem('oicl-user');
      window.location.href = '/login';
    },
    register: async (userData: any) => {
      return await this.fetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    forgotPassword: (email: string) => this.fetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
    resetPassword: (token: string, password: string) => this.fetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
    getUser: () => this.user,
    isAuthenticated: () => !!this.token,
  };

  admin = {
    getSummary: () => this.fetch('/admin/summary'),
    getMembers: () => this.fetch('/admin/members'),
    updateMemberStatus: (memberId: string, action: string, comment = '', registrationFeePaid = false) =>
      this.fetch(`/admin/members/${memberId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action, comment, registrationFeePaid }),
      }),
    processPayroll: (period: string) => this.fetch('/admin/payroll', { // Corrected endpoint and added body
      method: 'POST',
      body: JSON.stringify({ period }),
    }),
    getPayrollStatus: (period: string) => this.fetch(`/admin/payroll/status?period=${encodeURIComponent(period)}`),
    setPayrollLock: (period: string, locked: boolean, note = '') => this.fetch('/admin/payroll/lock', {
      method: 'PATCH',
      body: JSON.stringify({ period, locked, note }),
    }),
    getPayrollTemplate: (period: string) => this.fetch(`/admin/payroll/template?period=${encodeURIComponent(period)}`),
    uploadPayroll: (period: string, rows: Record<string, string>[]) => this.fetch('/admin/payroll/upload', {
      method: 'POST',
      body: JSON.stringify({ period, rows }),
    }),
    getStaff: () => this.fetch('/admin/staff'),
    updateStaff: (id: string, data: any) => this.fetch(`/admin/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    importStaff: (employees: any[]) => this.fetch('/admin/staff/import', {
      method: 'POST',
      body: JSON.stringify({ employees }),
    }),
  };

  loans = {
    getMyLoans: () => this.fetch('/loans/my-loans'),
    getCategories: () => this.fetch('/loans/categories'),
    apply: (data: any) => this.fetch('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (loanId: string, status: string, comment: string) => 
      this.fetch(`/admin/loans/${loanId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, comment }),
      }),
  };

  savings = {
    getHistory: () => this.fetch('/savings/me'),
    contribute: (payload: any) => this.fetch('/savings/contribute', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  };

  financialStatus = {
    getMine: (period?: string) => this.fetch(`/financial-status/me${period ? `?period=${encodeURIComponent(period)}` : ''}`),
    getReport: (period?: string) => this.fetch(`/financial-status/report${period ? `?period=${encodeURIComponent(period)}` : ''}`),
    updateRemarks: (memberId: string, remarks: string) => this.fetch(`/financial-status/members/${memberId}/remarks`, {
      method: 'PATCH',
      body: JSON.stringify({ remarks }),
    }),
  };

  governance = {
    getOverview: () => this.fetch('/governance'),
    createMeeting: (data: any) => this.fetch('/governance/meetings', { method: 'POST', body: JSON.stringify(data) }),
    completeMeeting: (id: string, data: any) => this.fetch(`/governance/meetings/${id}/complete`, { method: 'PATCH', body: JSON.stringify(data) }),
    createSpecialLevy: (data: any) => this.fetch('/governance/special-levies', { method: 'POST', body: JSON.stringify(data) }),
  };

  onboarding = {
    verifyStaff: (officialEmail: string) => 
      this.fetch('/onboarding/verify-staff', {
        method: 'POST',
        body: JSON.stringify({ officialEmail }),
      }),
    checkStatus: (officialEmail: string) =>
      this.fetch('/onboarding/application-status', {
        method: 'POST',
        body: JSON.stringify({ officialEmail }),
      }),
  };
}

export const api = new ApiClient();
