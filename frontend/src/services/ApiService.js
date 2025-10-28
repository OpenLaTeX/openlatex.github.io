class ApiService {
  static async compile(apiUrl, files, mainFile) {
    const response = await fetch(`${apiUrl}/compile`, {
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

  static async health(apiUrl) {
    const response = await fetch(`${apiUrl}/health`);
    return await response.json();
  }
}

export default ApiService;
