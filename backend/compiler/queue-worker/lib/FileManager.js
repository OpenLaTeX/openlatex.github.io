const fs = require('fs').promises;
const path = require('path');

class FileManager {
    static async createProjectDir() {
        const dir = await fs.mkdtemp(path.join('/tmp', 'latex-'));
        await fs.chmod(dir, 0o700);
        return dir;
    }

    static async writeFiles(workDir, files) {
        for (const file of files) {
            if (file.path.includes('..') || path.isAbsolute(file.path)) {
                throw new Error('Invalid file path');
            }

            const filePath = path.join(workDir, file.path);
            const normalizedPath = path.normalize(filePath);

            if (!normalizedPath.startsWith(path.normalize(workDir))) {
                throw new Error('File path outside working directory');
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
