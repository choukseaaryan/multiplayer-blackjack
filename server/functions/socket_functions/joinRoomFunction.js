const { isUsernameTakenInRoom, updatePlayerList } = require('../helper_functions/roomHelper.js')
const { rooms } = require('../../global_data/roomData.js')

function joinRoom(socket, roomId, username, avatar, io){
    if (!rooms[roomId]) {
        socket.emit("roomNotFoundError", "error", "Room not found");
        return;
    }

    if (isUsernameTakenInRoom(roomId, username)) {
        socket.emit(
            "userExistsError",
            "error",
            "Username is already taken in this room"
        );
        return;
    }

    if (!rooms[roomId].can_join) {
        socket.emit("matchStartedError", "error", "Match has already started");
        return;
    }

    if (rooms[roomId].player_count >= 5) {
        socket.emit("lobbyFullError", "error", "Cannot join. Lobby is full!");
        return;
    }

    rooms[roomId].players[socket.id] = {
        id: socket.id,
        username,
        balance: 1000,
        cards_in_hand: [],
        cards_sum: 0,
        is_out: false,
        is_stand: false,
        is_chance: false,
        is_host: false,
        img: avatar
    };

    rooms[roomId].player_count++;

    socket.join(roomId);
    socket.emit("joinedRoom", roomId);
    io.to(roomId).emit(
        "playerJoined",
        "info",
        `${username} has joined the room!`
    );
    updatePlayerList(roomId, io);
}

module.exports = { joinRoom };