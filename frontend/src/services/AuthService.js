import { getApiUrl } from '../config/settings';

class AuthService {
    static async register(email, password) {
        const response = await fetch(`${getApiUrl()}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur inscription');
        }

        return data;
    }

    static async login(email, password) {
        const response = await fetch(`${getApiUrl()}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'erreur connexion');
        }

        localStorage.setItem('token', data.token);
        return data;
    }

    static logout() {
        localStorage.removeItem('token');
    }

    static getToken() {
        return localStorage.getItem('token');
    }

    static isAuthenticated() {
        return !!this.getToken();
    }
}

export default AuthService;
