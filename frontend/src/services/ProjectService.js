import AuthService from './AuthService';

const API_URL = localStorage.getItem('apiUrl') || 'http://159.65.196.71:8000';

class ProjectService {
    static getHeaders() {
        const token = AuthService.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    static async getProjects() {
        const response = await fetch(`${API_URL}/projects`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('erreur chargement projets');
        }

        return await response.json();
    }

    static async createProject(name, description, files) {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ name, description, files })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur creation projet');
        }

        return data;
    }

    static async getProject(pno) {
        const response = await fetch(`${API_URL}/projects/${pno}`, {
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error('erreur chargement projet');
        }

        return await response.json();
    }

    static async updateProject(pno, name, description, files) {
        const response = await fetch(`${API_URL}/projects/${pno}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ name, description, files })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur mise a jour projet');
        }

        return data;
    }

    static async deleteProject(pno) {
        const response = await fetch(`${API_URL}/projects/${pno}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur suppression projet');
        }

        return data;
    }
}

export default ProjectService;
