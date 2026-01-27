import { AuthHeaders } from './AuthHeaders';

export class HttpClient {
  static async post(url, body, headers = {}) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AuthHeaders.create(),
        ...headers
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error = new Error(errorData.error || 'Request failed');
      error.data = errorData;
      throw error;
    }

    return response.json();
  }

  static async get(url, headers = {}) {
    const response = await fetch(url, {
      headers: {
        ...AuthHeaders.create(),
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  }
}
