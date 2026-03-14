import { AuthApi } from '../api/AuthApi';
import { UserStorage } from '../storage/UserStorage';

class AuthService {
    static async register(email, password) {
        const data = await AuthApi.register(email, password);
        return data;
    }

    static async login(email, password) {
        const data = await AuthApi.login(email, password);
        return data;
    }

    static async verify() {
        const result = await AuthApi.verify();
        return result;
    }

    static async logout() {
        try {
            await AuthApi.logout();
            UserStorage.clear();
        } catch (err) {
            console.error('Erreur logout:', err);
            UserStorage.clear();
        }
    }

}

export default AuthService;
