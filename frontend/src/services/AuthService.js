import { AuthApi } from '../api/AuthApi';
import { TokenStorage } from '../storage/TokenStorage';
import { UserStorage } from '../storage/UserStorage';

class AuthService {
    static async register(email, password) {
        const data = await AuthApi.register(email, password);
        return data;
    }

    static async login(email, password) {
        const data = await AuthApi.login(email, password);
        TokenStorage.save(data.token);
        return data;
    }

    static logout() {
        TokenStorage.remove();
        UserStorage.clear();
    }

    static getToken() {
        return TokenStorage.get();
    }

    static isAuthenticated() {
        return TokenStorage.exists();
    }
}

export default AuthService;
