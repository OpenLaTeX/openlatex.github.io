import i18n from '../i18n';
import type {
  AuthSession,
  Collaborator,
  CompileResult,
  FileType,
  ProjectDto,
  ProjectFile,
  ProjectSummary
} from '../types';

const defaultApiUrl = window.location.origin.replace(/github\.io$/, 'blavogiez.fr');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 0,
    readonly data?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const getApiUrl = () => localStorage.getItem('apiUrl') || defaultApiUrl;

export const setApiUrl = (url: string) => {
  const value = url.trim().replace(/\/$/, '');
  new URL(value);
  localStorage.setItem('apiUrl', value);
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new ApiError(i18n.t('networkError'));
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new ApiError(String(data.error ?? i18n.t('requestFailed')), response.status, data);
  }
  return data as T;
};

const serializeFiles = (files: ProjectFile[]) =>
  files.map((file) => ({
    filename: file.path,
    content: file.content,
    file_type: (file.type === 'jpeg' ? 'jpg' : file.type) as FileType
  }));

export const api = {
  register: (email: string, password: string) =>
    request<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  login: (email: string, password: string) =>
    request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  verify: () => request<AuthSession>('/auth/verify'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  projects: () => request<ProjectSummary[]>('/projects'),
  project: (id: string) => request<ProjectDto>(`/projects/${id}`),
  createProject: (name: string, files: ProjectFile[]) =>
    request<{ pno: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description: null, files: serializeFiles(files) })
    }),
  updateProject: (id: string, name: string, files: ProjectFile[]) =>
    request<{ message: string }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description: null, files: serializeFiles(files) })
    }),
  deleteProject: (id: string) => request(`/projects/${id}`, { method: 'DELETE' }),
  collaborators: (id: string) => request<Collaborator[]>(`/projects/${id}/collaborators`),
  invite: (id: string, email: string) =>
    request(`/projects/${id}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  removeCollaborator: (id: string, email: string) =>
    request(`/projects/${id}/collaborators/${encodeURIComponent(email)}`, {
      method: 'DELETE'
    }),
  compile: (files: ProjectFile[], mainFile: string) =>
    request<CompileResult>('/compile', {
      method: 'POST',
      body: JSON.stringify({
        files: files.map(({ path, content }) => ({ path, content })),
        mainFile
      })
    })
};
