import { UserStorage } from '../storage/UserStorage';

export class AuthHeaders {
  static create() {
    const token = UserStorage.getToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
  }
}
