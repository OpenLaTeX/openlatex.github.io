import { HttpClient } from '../utils/HttpClient';
import { AuthHeaders } from '../utils/AuthHeaders';
import { PdfDataTransformer } from '../utils/PdfDataTransformer';

class ApiService {
  static async compile(apiUrl, files, mainFile) {
    const headers = AuthHeaders.create();

    try {
      const data = await HttpClient.post(
        `${apiUrl}/compile`,
        { files, mainFile },
        headers
      );

      return {
        pdfUrl: PdfDataTransformer.toDataUrl(data.pdf),
        logs: data.logs,
        hasErrors: data.hasErrors
      };
    } catch (error) {
      const compilationError = new Error(error.message || 'erreur compilation');
      compilationError.logs = error.data?.logs;
      throw compilationError;
    }
  }

  static async health(apiUrl) {
    return HttpClient.get(`${apiUrl}/health`);
  }
}

export default ApiService;
