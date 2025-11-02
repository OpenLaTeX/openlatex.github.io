export class TokenStorage {
  static save(token) {
    try {
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Failed to save token:', error);
      throw new Error('Impossible de sauvegarder le token');
    }
  }

  static get() {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  static remove() {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  static exists() {
    return !!this.get();
  }
}
