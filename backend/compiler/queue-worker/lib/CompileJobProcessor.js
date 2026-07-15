const FileManager = require('./FileManager');
const Compiler = require('./Compiler');

class CompileJobProcessor {
    static async process({ files, mainFile }) {
        let workDir;

        try {
            workDir = await FileManager.createProjectDir();
            await FileManager.writeFiles(workDir, files);

            const result = await Compiler.compile(workDir, mainFile);

            await FileManager.cleanup(workDir);
            workDir = null;

            return result;
        } catch (error) {
            if (workDir) {
                await FileManager.cleanup(workDir);
            }
            throw error;
        }
    }
}

module.exports = CompileJobProcessor;
