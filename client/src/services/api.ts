const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...customOptions } = options;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage if not explicitly passed
  const authToken = token || localStorage.getItem('aether_task_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...customOptions,
    headers: {
      ...headers,
      ...customOptions.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data as T;
}

export const api = {
  auth: {
    signup: (body: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<any>('/auth/me'),
  },
  projects: {
    list: () => request<any>('/projects'),
    get: (id: string) => request<any>(`/projects/${id}`),
    create: (body: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
    addMember: (id: string, body: any) => request<any>(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(body) }),
    removeMember: (id: string, userId: string) => request<any>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  },
  tasks: {
    create: (projectId: string, body: any) => request<any>(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),
    getComments: (taskId: string) => request<any>(`/tasks/${taskId}/comments`),
    addComment: (taskId: string, body: any) => request<any>(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  },
  dashboard: {
    getStats: () => request<any>('/dashboard/stats'),
  },
};
