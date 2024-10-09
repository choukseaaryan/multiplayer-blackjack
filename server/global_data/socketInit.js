const { Server } = require('socket.io');

let ioInstance;

function initSocketServer(server) {
    if (!ioInstance) {
        ioInstance = new Server(server);
    }
    return ioInstance;
}

function getSocketServer() {
    return ioInstance;
}

module.exports = {
    initSocketServer,
    getSocketServer,
};
