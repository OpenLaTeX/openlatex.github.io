// Configuration centralisée de l'application
// La valeur par défaut vient du fichier settings.prop à la racine du projet
const DEFAULT_API_URL = 'https://openlatex.v0id.nl';

/**
 * Récupère l'URL de l'API.
 * Priorité : localStorage > valeur par défaut
 * Cela permet à l'utilisateur de changer l'URL dans l'interface
 * et que le changement se propage immédiatement partout.
 */
export function getApiUrl() {
    return localStorage.getItem('apiUrl') || DEFAULT_API_URL;
}

/**
 * Met à jour l'URL de l'API dans le localStorage
 */
export function setApiUrl(url) {
    localStorage.setItem('apiUrl', url);
}

export default {
    DEFAULT_API_URL,
    getApiUrl,
    setApiUrl
};
