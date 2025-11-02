export class UserStorage {
  static saveEmail(email) {
    try {
      localStorage.setItem('userEmail', email);
    } catch (error) {
      console.error('Failed to save email:', error);
      throw new Error('Impossible de sauvegarder l\'email');
    }
  }

  static getEmail() {
    try {
      return localStorage.getItem('userEmail') || '';
    } catch (error) {
      console.error('Failed to get email:', error);
      return '';
    }
  }

  static clear() {
    try {
      localStorage.removeItem('userEmail');
    } catch (error) {
      console.error('Failed to clear email:', error);
    }
  }
}
