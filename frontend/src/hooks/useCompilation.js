import { useState } from 'react';
import ApiService from '../services/ApiService';
import { parseLatexLogs } from '../utils/LogParser';

export const useCompilation = (project, resolveFiles, apiUrl, showAlert, setLoading, t) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [compilationErrors, setCompilationErrors] = useState([]);
  const [showErrorPanel, setShowErrorPanel] = useState(false);

  const handleCompile = async () => {
    if (!project.currentFile || !project.currentFile.endsWith('.tex')) {
      showAlert(
        t.invalidFileTitle,
        t.invalidFileMsg
      );
      return;
    }

    setLoading(true);
    setCompilationErrors([]);
    try {
      const files = resolveFiles().map(f => ({ path: f.path, content: f.content }));
      const result = await ApiService.compile(apiUrl, files, project.currentFile);

      setPdfUrl(result.pdfUrl);

      if (result.hasErrors) {
        const errors = parseLatexLogs(result.logs);
        setCompilationErrors(errors);
        setShowErrorPanel(true);
      }
    } catch (err) {
      const errors = parseLatexLogs(err.logs || '');
      setCompilationErrors(errors);
      setShowErrorPanel(true);
      showAlert(
        t.compilationErrorTitle,
        t.compilationErrorMsg(err.message)
      );
    }
    setLoading(false);
  };

  return {
    pdfUrl,
    compilationErrors,
    showErrorPanel,
    setShowErrorPanel,
    handleCompile
  };
};
