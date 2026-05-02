const Y = require('yjs');
const { setPersistence } = require('y-websocket/bin/utils');
const { SQLquery } = require('../db/pool');

setPersistence({
    bindState: async (docName, ydoc) => {
        const filesResult = await SQLquery(
            'select filename, content, file_type from files where pno = $1',
            [docName]
        );
        const filesMap = ydoc.getMap('files');
        const filesMeta = ydoc.getMap('filesMeta');
        for (const file of filesResult.rows) {
            const isBinary = ['png', 'jpg', 'jpeg', 'pdf'].includes(file.file_type);
            if (isBinary) {
                const base64 = file.content.toString('base64');
                filesMeta.set(file.filename, JSON.stringify({ type: file.file_type, content: base64 }));
            } else {
                const yText = new Y.Text();
                yText.insert(0, file.content.toString('utf-8'));
                filesMap.set(file.filename, yText);
                filesMeta.set(file.filename, JSON.stringify({ type: file.file_type }));
            }
        }
    },
    writeState: async () => {}
});
