export class ClipboardUtil {
  static async readImageFromClipboard() {
    let clipboardItems;
    try {
      clipboardItems = await navigator.clipboard.read();
    } catch {
      throw new Error('Accès au presse-papiers refusé. Autorisez l\'accès et réessayez.');
    }

    for (const item of clipboardItems) {
      for (const type of item.types) {
        if (type.startsWith('image/')) {
          const blob = await item.getType(type);
          const base64 = await this.blobToBase64(blob);
          const extension = this.getExtensionFromMimeType(type);
          return { base64, extension, mimeType: type };
        }
      }
    }
    return null;
  }

  static blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Erreur lecture fichier'));
      reader.readAsDataURL(blob);
    });
  }

  static getExtensionFromMimeType(mimeType) {
    const map = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg'
    };
    return map[mimeType] || 'png';
  }
}
