import { Question, QuestionDraft } from './types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res: Response) => {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }
  if (!res.ok) {
    let errMsg = `API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errMsg = data.error;
    } catch (e) {}
    throw new Error(errMsg);
  }
  return res.json();
};

export const api = {
  login: async (username: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },
  
  me: async () => {
    const res = await fetch('/api/me', { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  getQuestions: async (): Promise<Question[]> => {
    const res = await fetch('/api/questions', { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  addQuestion: async (q: QuestionDraft) => {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...q, correct_answers: q.correctAnswers })
    });
    return handleResponse(res);
  },

  batchAddQuestions: async (questions: QuestionDraft[]) => {
    const res = await fetch('/api/questions/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ questions })
    });
    return handleResponse(res);
  },

  updateQuestion: async (id: number, q: Partial<Question>) => {
    const res = await fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(q)
    });
    return handleResponse(res);
  },

  deleteQuestion: async (id: number) => {
    const res = await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  recordResult: async (id: number, isCorrect: boolean) => {
    const res = await fetch(`/api/questions/${id}/result`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isCorrect })
    });
    return handleResponse(res);
  },

  getPracticeQuestions: async (limit: number): Promise<Question[]> => {
    const res = await fetch(`/api/practice?limit=${limit}`, { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  parseTextWithAI: async (text: string): Promise<QuestionDraft[]> => {
    const res = await fetch('/api/ai/parse', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text })
    });
    const data = await handleResponse(res);
    return data.questions;
  },

  getAISettings: async () => {
    const res = await fetch('/api/settings/ai', { headers: getAuthHeaders() });
    return handleResponse(res);
  },

  updateAISettings: async (settings: { provider?: string, model?: string, apiKey?: string, baseUrl?: string }) => {
    const res = await fetch('/api/settings/ai', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  testAI: async (settings: { provider?: string, model?: string, apiKey?: string, baseUrl?: string }) => {
    const res = await fetch('/api/settings/ai/test', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  },

  updateCredentials: async (credentials: { username?: string, password?: string }) => {
    const res = await fetch('/api/credentials', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  }
};
