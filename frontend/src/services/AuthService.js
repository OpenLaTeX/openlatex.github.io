import { AuthApi } from '../api/AuthApi';
import { UserStorage } from '../storage/UserStorage';
import { getApiUrl } from '../config/settings';

class AuthService {
    static async register(email, password) {
        const data = await AuthApi.register(email, password);
        return data;
    }

    static async login(email, password) {
        const data = await AuthApi.login(email, password);
        return data;
    }

    static async logout() {
        await fetch(`${getApiUrl()}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        UserStorage.clear();
    }

    static isAuthenticated() {
        return false;
    }
}

export default AuthService;
