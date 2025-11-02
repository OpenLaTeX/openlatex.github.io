import AuthService from '../services/AuthService';

export class AuthHeaders {
  static create() {
    const token = AuthService.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}
