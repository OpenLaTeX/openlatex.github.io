import { getApiUrl } from '../config/settings';

class ProjectService {
    static async getProjects() {
        const response = await fetch(`${getApiUrl()}/projects`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            throw new Error('Session expired — please log in again');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load projects');
        }

        return data;
    }

    static async createProject(name, description, files) {
        const body = JSON.stringify({ name, description, files });
        if (body.length > 10 * 1024 * 1024) {
            throw new Error('Project exceeds the 10 MB limit');
        }

        const response = await fetch(`${getApiUrl()}/projects`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body
        });

        if (response.status === 401) {
            throw new Error('Session expired — please log in again');
        }

        if (response.status === 413) {
            throw new Error('Project exceeds the 10 MB limit');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create project');
        }

        return data;
    }

    static async getProject(pno) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            credentials: 'include'
        });

        if (response.status === 401) {
            throw new Error('Session expired — please log in again');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load project');
        }

        return data;
    }

    static async updateProject(pno, name, description, files) {
        const body = JSON.stringify({ name, description, files });
        if (body.length > 10 * 1024 * 1024) {
            throw new Error('Project exceeds the 10 MB limit');
        }

        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body
        });

        if (response.status === 401) {
            throw new Error('Session expired — please log in again');
        }

        if (response.status === 413) {
            throw new Error('Project exceeds the 10 MB limit');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update project');
        }

        return data;
    }

    static async deleteProject(pno) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.status === 401) {
            throw new Error('Session expired — please log in again');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete project');
        }

        return data;
    }
}

export default ProjectService;
