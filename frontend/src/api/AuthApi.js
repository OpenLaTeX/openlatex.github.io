import { getApiUrl } from '../config/settings';

export class AuthApi {
  static async register(email, password) {
    const response = await fetch(`${getApiUrl()}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  }

  static async login(email, password) {
    const response = await fetch(`${getApiUrl()}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  }

  static async verify() {
    const response = await fetch(`${getApiUrl()}/auth/verify`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Session verification failed');
    }

    return data;
  }

  static async logout() {
    const response = await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return await response.json();
  }
}
