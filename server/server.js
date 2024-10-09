const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

//importing other files
const userAPI = require('./userAPI.js');
const { createRoom, joinRoom, leaveRoom, disconnectRoom } = require('./functions/socket_functions/roomCJL.js');
const{ kickPlayer, changeBetSize, startGame } = require('./functions/socket_functions/roomHostFunctions.js')
const { getPlayersList } = require('./functions/helper_functions/roomHelper.js');
const { playerHits, playerStands, playerMessages } = require("./functions/socket_functions/roomPlayersFunctions.js");

//middleware config
const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
app.use(cors({ origin: "*" }));
app.use(express.static("public"));
app.use(express.json());
app.use('/api', userAPI);

//Database connection and server initialization
mongoose
    .connect(
        "mongodb+srv://ronitsavadimathrs:cH1EeucAIUhxPLJa@cluster0.k5wrb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    .then(() => {
        console.log("DB success");
        server.listen(8000, () => {
            console.log("Port 8000 running");
        });
    })
    .catch((error) => {
        console.log("Failed: ", error);
    });


//socket functions
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("createRoom", (username, avatar, balance = 1000) => createRoom(socket, username, avatar, balance, io));
    socket.on("joinRoom", (roomId, username, avatar) => joinRoom(socket, roomId, username, avatar, io));
    socket.on("leaveRoom", (roomId) => leaveRoom(socket, roomId, io));
    socket.on("disconnect", () => disconnectRoom(socket, io));
    socket.on("kickPlayer", (roomId, playerId) => kickPlayer(socket, roomId, playerId, io));
    socket.on("betSizeChanged", (roomId, betSize) => changeBetSize(socket, roomId, betSize, io));
    socket.on("startGame", (roomId) => startGame(socket, roomId, io));
    socket.on("hit", (roomId, playerId) => playerHits(socket, roomId, playerId, io));
    socket.on("stand", (roomId, playerId) => playerStands(socket, roomId, playerId, io));
    socket.on("getPlayerList", (roomid) => getPlayersList(socket, roomid, io));
    socket.on("sendMessage", (roomId, playerId, message = "") => playerMessages(socket, roomId, playerId, message, io));
});
