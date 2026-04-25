const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execPromise = util.promisify(exec);

class Compiler {
    static async compile(workDir, mainFile) {
        const mainFileDir = path.dirname(path.join(workDir, mainFile));
        const mainFileName = path.basename(mainFile);

        if (!/^[a-zA-Z0-9_\-\.]+$/.test(mainFileName)) {
            throw new Error('Invalid file name');
        }

        const pdfFileName = mainFileName.replace(/\.tex$/, '.pdf');
        const pdfFilePath = path.join(mainFileDir, pdfFileName);

        const cmd = `pdflatex -interaction=nonstopmode -no-shell-escape ${mainFileName}`;

        console.log('lancement pdflatex...');

        try {
            const { stdout, stderr } = await execPromise(cmd, {
                cwd: mainFileDir,
                maxBuffer: 10 * 1024 * 1024,
                timeout: 30000,
                env: {
                    PATH: process.env.PATH,
                    HOME: mainFileDir,
                    TEXMFOUTPUT: mainFileDir,
                    openin_any: 'p',
                    openout_any: 'p',
                }
            });

            console.log('pdflatex terminé');
            console.log('--- logs pdflatex ---');
            console.log(stdout);
            if (stderr) {
                console.log('stderr:', stderr);
            }

            const pdfBuffer = await fs.readFile(pdfFilePath);
            console.log('pdf ok, taille:', pdfBuffer.length, 'octets');

            return {
                success: true,
                pdf: pdfBuffer,
                logs: stdout,
                hasErrors: false
            };
        } catch (error) {
            console.log('erreur compilation:', error.message);
            if (error.stdout) {
                console.log('--- logs pdflatex (échec)---');
                console.log(error.stdout);
            }
            if (error.stderr) {
                console.log('stderr:', error.stderr);
            }

            const pdfExists = await this.fileExists(pdfFilePath);
            if (pdfExists) {
                console.log('pdf généré malgré les erreurs');
                const pdfBuffer = await fs.readFile(pdfFilePath);
                return {
                    success: true,
                    pdf: pdfBuffer,
                    logs: error.stdout || error.stderr || '',
                    hasErrors: true
                };
            }

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
