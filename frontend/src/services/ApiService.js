const API_URL = 'http://159.65.196.71:8000';

class ApiService {
  static async compile(files, mainFile) {
    const response = await fetch(`${API_URL}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, mainFile })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Compilation failed');
    }

    return await response.blob();
  }

  static async health() {
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  }
}

export default ApiService;
