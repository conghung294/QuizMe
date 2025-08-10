const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface Question {
  id: string;
  content: string;
  explanation?: string;
  type: string;
  order: number;
  choices: Choice[];
  correctAnswers: CorrectAnswer[];
}

export interface Choice {
  id: string;
  label: string;
  content: string;
  order: number;
}

export interface CorrectAnswer {
  id: string;
  choiceLabel: string;
}

export interface QuestionSet {
  id: string;
  title: string;
  subject: string;
  tone?: string;
  difficulty?: string;
  type: string;
  fileName?: string;
  fileContent?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  questions?: Question[]; // Optional because getQuestionSets() doesn't include questions
  textProcessingInfo?: {
    wasTruncated: boolean;
    originalLength: number;
    truncatedLength: number;
  };
}

export interface GenerateQuestionsRequest {
  subject: string;
  questionCount: number;
  questionType: string;
  tone?: string;
  difficulty?: string;
  title?: string;
}

export interface GenerateMultipleQuestionsRequest {
  subject: string;
  questionCount: number;
  questionTypes: string[];
  tone?: string;
  difficulty?: string;
  title?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        return false
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update stored user data with fresh data from server
          localStorage.setItem('auth_user', JSON.stringify(data.data))
          return true
        }
      }

      // Token is invalid, clear storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      return false
    } catch (error) {
      console.error('Error refreshing token:', error)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      return false
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    let response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });

    // If we get a 401 and have a token, try to refresh it
    if (response.status === 401 && localStorage.getItem('auth_token')) {
      const refreshed = await this.refreshTokenIfNeeded();
      if (refreshed) {
        // Retry the request with the refreshed token
        response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders(),
            ...options.headers,
          },
          ...options,
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async generateQuestions(
    file: File,
    data: GenerateQuestionsRequest
  ): Promise<ApiResponse<QuestionSet>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', data.subject);
    formData.append('questionCount', data.questionCount.toString());
    formData.append('questionType', data.questionType);

    if (data.tone) formData.append('tone', data.tone);
    if (data.difficulty) formData.append('difficulty', data.difficulty);
    if (data.title) formData.append('title', data.title);

    const response = await fetch(`${API_BASE_URL}/questions/generate`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async generateMultipleQuestions(
    file: File,
    data: GenerateMultipleQuestionsRequest
  ): Promise<ApiResponse<QuestionSet>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', data.subject);
    formData.append('questionCount', data.questionCount.toString());
    formData.append('questionTypes', JSON.stringify(data.questionTypes));

    if (data.tone) formData.append('tone', data.tone);
    if (data.difficulty) formData.append('difficulty', data.difficulty);
    if (data.title) formData.append('title', data.title);

    const response = await fetch(`${API_BASE_URL}/questions/generate-multiple`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getQuestionSets(userId?: string): Promise<ApiResponse<QuestionSet[]>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<QuestionSet[]>(`/questions/sets${params}`);
  }

  async getQuestionSet(id: string): Promise<ApiResponse<QuestionSet>> {
    return this.request<QuestionSet>(`/questions/sets/${id}`);
  }

  async deleteQuestionSet(id: string, userId?: string): Promise<ApiResponse<void>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<void>(`/questions/sets/${id}${params}`, {
      method: 'DELETE',
    });
  }

  // Practice API methods
  async startPractice(questionSetId: string, userId?: string): Promise<ApiResponse<any>> {
    return this.request<any>('/practice/start', {
      method: 'POST',
      body: JSON.stringify({ questionSetId, userId }),
    });
  }

  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedChoices: string[]
  ): Promise<ApiResponse<any>> {
    return this.request<any>('/practice/answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionId, selectedChoices }),
    });
  }

  async completePractice(sessionId: string): Promise<ApiResponse<any>> {
    return this.request<any>('/practice/complete', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async getPracticeSession(sessionId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/practice/sessions/${sessionId}`);
  }

  async getPracticeSessions(userId?: string): Promise<ApiResponse<any[]>> {
    const params = userId ? `?userId=${userId}` : '';
    return this.request<any[]>(`/practice/sessions${params}`);
  }
}

export const apiService = new ApiService();
