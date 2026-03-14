require('dotenv').config();
require('./lib/CollabManager');

const http = require('http');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const authMiddleware = require('./middleware/auth');

const PORT = process.env.PORT || 7000;

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'healthy' }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req, projectId) => {
    setupWSConnection(ws, req, { docName: projectId, gc: true });
});

server.on('upgrade', async (req, socket, head) => {
    const match = req.url.match(/^\/collab\/([^/?]+)/);
    if (!match) {
        socket.destroy();
        return;
    }

    const projectId = match[1];
    const userId = await authMiddleware(req, projectId);

    if (!userId) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req, projectId);
    });
});

server.listen(PORT, () => {
    console.log('collab demarre sur le port', PORT);
});
