const Y = require('yjs');
const { setPersistence } = require('y-websocket/bin/utils');
const { SQLquery } = require('../db/pool');

const debounceTimers = new Map();

const writeState = async (docName, ydoc) => {
    const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    await SQLquery(
        'insert into yjs_state (pno, state, updated_at) values ($1, $2, now()) on conflict (pno) do update set state = $2, updated_at = now()',
        [docName, state]
    );
};

const scheduleWrite = (docName, ydoc) => {
    if (debounceTimers.has(docName)) clearTimeout(debounceTimers.get(docName));
    debounceTimers.set(docName, setTimeout(() => {
        debounceTimers.delete(docName);
        writeState(docName, ydoc).catch(console.error);
    }, 5000));
};

setPersistence({
    bindState: async (docName, ydoc) => {
        const result = await SQLquery('select state from yjs_state where pno = $1', [docName]);
        if (result.rows.length > 0) {
            Y.applyUpdate(ydoc, result.rows[0].state);
        } else {
            const filesResult = await SQLquery(
                'select filename, content, file_type from files where pno = $1',
                [docName]
            );
            const filesMap = ydoc.getMap('files');
            for (const file of filesResult.rows) {
                const isBinary = ['png', 'jpg', 'pdf'].includes(file.file_type);
                if (!isBinary) {
                    const yText = new Y.Text();
                    yText.insert(0, file.content.toString('utf-8'));
                    filesMap.set(file.filename, yText);
                }
            }
        }
        ydoc.on('update', () => scheduleWrite(docName, ydoc));
    },
    writeState: async (docName, ydoc) => {
        await writeState(docName, ydoc);
    }
});
