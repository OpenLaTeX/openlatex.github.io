// Configuration centralisée de l'application
const DEFAULT_API_URL = 'https://openlatex-api.blavogiez.fr';

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
