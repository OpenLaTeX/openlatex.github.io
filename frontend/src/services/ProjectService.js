import { getApiUrl } from '../config/settings';
import { AuthHeaders } from '../utils/AuthHeaders';

class ProjectService {
    static getHeaders() {
        return {
            'Content-Type': 'application/json',
            ...AuthHeaders.create()
        };
    }

    static async getProjects() {
        const response = await fetch(`${getApiUrl()}/projects`, {
            headers: this.getHeaders()
        });

        if (response.status === 401) {
            throw new Error('Session expirée - reconnexion requise');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur chargement projets');
        }

        return data;
    }

    static async createProject(name, description, files) {
        const body = JSON.stringify({ name, description, files });
        if (body.length > 10 * 1024 * 1024) {
            throw new Error('Le projet dépasse la limite de 10 Mo');
        }

        const response = await fetch(`${getApiUrl()}/projects`, {
            method: 'POST',
            headers: this.getHeaders(),
            body
        });

        if (response.status === 401) {
            throw new Error('Session expirée - reconnexion requise');
        }

        if (response.status === 413) {
            throw new Error('Le projet dépasse la limite de 10 Mo');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur creation projet');
        }

        return data;
    }

    static async getProject(pno) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            headers: this.getHeaders()
        });

        if (response.status === 401) {
            throw new Error('Session expirée - reconnexion requise');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur chargement projet');
        }

        return data;
    }

    static async updateProject(pno, name, description, files) {
        const body = JSON.stringify({ name, description, files });
        if (body.length > 10 * 1024 * 1024) {
            throw new Error('Le projet dépasse la limite de 10 Mo');
        }

        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body
        });

        if (response.status === 401) {
            throw new Error('Session expirée - reconnexion requise');
        }

        if (response.status === 413) {
            throw new Error('Le projet dépasse la limite de 10 Mo');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur mise a jour projet');
        }

        return data;
    }

    static async deleteProject(pno) {
        const response = await fetch(`${getApiUrl()}/projects/${pno}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        if (response.status === 401) {
            throw new Error('Session expirée - reconnexion requise');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur suppression projet');
        }

        return data;
    }
}

export default ProjectService;
