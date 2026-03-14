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
      console.error('Failed to clear storage:', error);
    }
  }

  static savePanelWidths(sidebarWidth, pdfWidth) {
    try {
      localStorage.setItem('panelWidths', JSON.stringify({ sidebarWidth, pdfWidth }));
    } catch (error) {
      console.error('Failed to save panel widths:', error);
    }
  }

  static getPanelWidths() {
    try {
      const stored = localStorage.getItem('panelWidths');
      return stored ? JSON.parse(stored) : { sidebarWidth: 280, pdfWidth: 600 };
    } catch (error) {
      console.error('Failed to get panel widths:', error);
      return { sidebarWidth: 280, pdfWidth: 600 };
    }
  }

  static saveProjectDraft(project, name) {
    try {
      localStorage.setItem('projectDraft', JSON.stringify({
        name: name ?? project.name,
        files: project.files,
        currentFile: project.currentFile,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Failed to save project draft:', error);
      return false;
    }
  }

  static getProjectDraft() {
    try {
      const stored = localStorage.getItem('projectDraft');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get project draft:', error);
      return null;
    }
  }

  static clearProjectDraft() {
    try {
      localStorage.removeItem('projectDraft');
    } catch (error) {
      console.error('Failed to clear project draft:', error);
    }
  }

  static saveLastProject(pno, name, isOwner) {
    try {
      if (pno) {
        localStorage.setItem('lastProject', JSON.stringify({ pno, name, isOwner: isOwner ?? true }));
      } else {
        localStorage.removeItem('lastProject');
      }
    } catch (error) {
      console.error('Failed to save last project:', error);
    }
  }

  static getLastProject() {
    try {
      const stored = localStorage.getItem('lastProject');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get last project:', error);
      return null;
    }
  }
}
