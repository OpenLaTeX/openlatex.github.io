const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execPromise = util.promisify(exec);

class Compiler {
    static async compile(workDir, mainFile) {
        const mainFilePath = path.join(workDir, mainFile);
        const pdfFileName = mainFile.replace(/\.tex$/, '.pdf');
        const pdfFilePath = path.join(workDir, pdfFileName);

        const cmd = `pdflatex -interaction=nonstopmode -output-directory=${workDir} ${mainFilePath}`;

        try {
            const { stdout, stderr } = await execPromise(cmd, {
                maxBuffer: 10 * 1024 * 1024,
                timeout: 30000
            });

            const pdfExists = await this.fileExists(pdfFilePath);
            if (!pdfExists) {
                throw new Error('PDF non généré, erreur de compilation');
            }

            const pdfBuffer = await fs.readFile(pdfFilePath);

            return {
                success: true,
                pdf: pdfBuffer,
                logs: stdout
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                logs: error.stdout || error.stderr || ''
            };
        }
    }

    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = Compiler;
