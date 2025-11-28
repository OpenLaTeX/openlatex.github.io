import { getApiUrl } from '../config/settings';

class ProjectService {
    static getHeaders() {
        return {
            'Content-Type': 'application/json'
        };
    }

    static async getProjects() {
        const response = await fetch(`${getApiUrl()}/projects`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('erreur chargement projets');
        }

        return await response.json();
    }

    static async createProject(name, description, files) {
        const response = await fetch(`${getApiUrl()}/projects`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ name, description, files }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur creation projet');
        }

        return data;
    }

    static async getProject(pno) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            headers: this.getHeaders(),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('erreur chargement projet');
        }

        return await response.json();
    }

    static async updateProject(pno, name, description, files) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ name, description, files }),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur mise a jour projet');
        }

        return data;
    }

    static async deleteProject(pno) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur suppression projet');
        }

        return data;
    }
}

export default ProjectService;
