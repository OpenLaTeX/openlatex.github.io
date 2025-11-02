import AuthService from './AuthService';

class ApiService {
  static async compile(apiUrl, files, mainFile) {
    const token = AuthService.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}/compile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ files, mainFile })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'erreur compilation');
      error.logs = errorData.logs;
      throw error;
    }

    const data = await response.json();
    return { pdfUrl: `data:application/pdf;base64,${data.pdf}`, logs: data.logs, hasErrors: data.hasErrors };
  }

  static async health(apiUrl) {
    const response = await fetch(`${apiUrl}/health`);
    return await response.json();
  }
}

export default ApiService;
