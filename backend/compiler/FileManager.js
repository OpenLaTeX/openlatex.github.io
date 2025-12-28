const fs = require('fs').promises;
const path = require('path');

class FileManager {
    static async createProjectDir(projectId) {
        const dir = path.join('/tmp', `latex-${projectId}`);
        await fs.mkdir(dir, { recursive: true });
        return dir;
    }

    static async writeFiles(workDir, files) {
        for (const file of files) {
            if (file.path.includes('..') || path.isAbsolute(file.path)) {
                throw new Error('chemin de fichier invalide');
            }

            const filePath = path.join(workDir, file.path);
            const normalizedPath = path.normalize(filePath);

            if (!normalizedPath.startsWith(path.normalize(workDir))) {
                throw new Error('chemin de fichier en dehors du répertoire de travail');
            }

            const fileDir = path.dirname(filePath);
            await fs.mkdir(fileDir, { recursive: true });

            const isBinary = this.isBinaryContent(file.path);
            console.log(`  écriture ${file.path} (${isBinary ? 'binaire' : 'texte'})`);

            if (isBinary) {
                const buffer = Buffer.from(file.content, 'base64');
                await fs.writeFile(filePath, buffer);
            } else {
                await fs.writeFile(filePath, file.content, 'utf-8');
            }
        }
    }

    static async cleanup(dir) {
        try {
            await fs.rm(dir, { recursive: true, force: true });
        } catch (error) {
            console.error(`erreur nettoyage ${dir}:`, error);
        }
    }

    static isBinaryContent(filePath) {
        const binaryExtensions = ['.png', '.jpg', '.jpeg', '.pdf', '.gif', '.bmp', '.ico'];
        const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'));
        return binaryExtensions.includes(ext);
    }
}

module.exports = FileManager;
