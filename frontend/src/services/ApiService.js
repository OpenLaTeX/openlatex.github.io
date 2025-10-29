import AuthService from './AuthService';

class ApiService {
  static async compileGuest(apiUrl, files, mainFile) {
    const response = await fetch(`${apiUrl}/compile-guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ files, mainFile })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'erreur compilation');
    }

    return await response.blob();
  }

  static async compileSaved(apiUrl, pno, mainFile) {
    const token = AuthService.getToken();

    const response = await fetch(`${apiUrl}/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pno, mainFile })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'erreur compilation');
    }

    return await response.blob();
  }

  static async health(apiUrl) {
    const response = await fetch(`${apiUrl}/health`);
    return await response.json();
  }
}

export default ApiService;
