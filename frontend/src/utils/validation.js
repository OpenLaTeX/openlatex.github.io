const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1F]/;


export const validateFilePath = (filepath) => {
  if (!filepath || filepath.trim() === '') {
    return 'Le chemin ne peut pas être vide';
  }

  const segments = filepath.trim().split('/');
  for (const segment of segments) {
    const error = validateFilename(segment);
    if (error) return error;
  }

  return null;
};

export const validateFilename = (filename) => {
  if (!filename || filename.trim() === '') {
    return 'Le nom de fichier ne peut pas être vide';
  }

  const trimmed = filename.trim();

  if (INVALID_FILENAME_CHARS.test(trimmed)) {
    return 'Le nom contient des caractères invalides';
  }

  if (trimmed === '.' || trimmed === '..') {
    return 'Nom de fichier invalide';
  }

  if (trimmed.length > 255) {
    return 'Le nom de fichier est trop long';
  }

  return null;
};

export const validateProjectName = (name) => {
  if (!name || name.trim() === '') {
    return 'Le nom du projet ne peut pas être vide';
  }

  const trimmed = name.trim();

  if (INVALID_FILENAME_CHARS.test(trimmed)) {
    return 'Le nom contient des caractères invalides';
  }

  if (trimmed.length > 100) {
    return 'Le nom du projet ne doit pas dépasser 100 caractères';
  }

  return null;
};

export const validateFolderName = (name) => {
  if (!name || name.trim() === '') {
    return 'Le nom du dossier ne peut pas être vide';
  }

  const trimmed = name.trim();

  if (INVALID_FILENAME_CHARS.test(trimmed)) {
    return 'Le nom contient des caractères invalides';
  }

  if (trimmed === '.' || trimmed === '..') {
    return 'Nom de dossier invalide';
  }

  if (trimmed.length > 255) {
    return 'Le nom du dossier est trop long';
  }

  return null;
};
