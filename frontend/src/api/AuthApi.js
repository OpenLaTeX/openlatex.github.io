import { getApiUrl } from '../config/settings';
import { UserStorage } from '../storage/UserStorage';
import { AuthHeaders } from '../utils/AuthHeaders';

export class AuthApi {
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

    if (data.token) {
      UserStorage.saveToken(data.token);
    }

    return data;
  }

  static async verify() {
    const response = await fetch(`${getApiUrl()}/auth/verify`, {
      method: 'GET',
      headers: {
        ...AuthHeaders.create()
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Vérification de session échouée');
    }

    return data;
  }

  static async logout() {
    const response = await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        ...AuthHeaders.create()
      }
    });

    UserStorage.clearToken();

    if (!response.ok) {
      throw new Error('Erreur déconnexion');
    }

    return await response.json();
  }
}
