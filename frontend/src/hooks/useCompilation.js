import { useState } from 'react';
import ApiService from '../services/ApiService';
import { parseLatexLogs } from '../utils/LogParser';

export const useCompilation = (project, apiUrl, showAlert, setLoading) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [compilationErrors, setCompilationErrors] = useState([]);
  const [showErrorPanel, setShowErrorPanel] = useState(false);

  const handleCompile = async () => {
    if (!project.currentFile || !project.currentFile.endsWith('.tex')) {
      showAlert(
        'Fichier invalide',
        'Veuillez sélectionner un fichier .tex pour compiler.'
      );
      return;
    }

    setLoading(true);
    setCompilationErrors([]);
    try {
      const compileRequest = project.toCompileRequest(project.currentFile);
      const result = await ApiService.compile(apiUrl, compileRequest.files, compileRequest.mainFile);

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
        'Erreur de compilation',
        `La compilation a échoué : ${err.message}`
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
