const {
  generateRoomID,
  isUsernameTakenInRoom,
  updatePlayerList,
} = require("../helper_functions/roomHelper.js");
const { rooms, usernames, roomIDS } = require("../../global_data/roomData.js");
const Deck = require("../../public/algorithm_drawCards.js");

function createRoom(socket, username, avatar, balance, io) {
  const roomId = generateRoomID();
  let deck = new Deck();

  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: {},
      card_deck: deck.cards,
      pot_amount: 0,
      bet_size: 50,
      can_join: true,
      player_count: 1,
      is_playing: false,
    };
  }

  if (isUsernameTakenInRoom(roomId, username)) {
    socket.emit(
      "usernameTakenError",
      "error",
      "Username is already taken in this room"
    );
    return;
  }

  usernames[socket.id] = {
    username,
    balance,
    cards_in_hand: [],
    cards_sum: 0,
    is_out: false,
    is_stand: false,
    is_chance: true,
    is_host: true,
    img: avatar,
  };

  rooms[roomId].players[socket.id] = {
    id: socket.id,
    username,
    ...usernames[socket.id],
  };

  socket.join(roomId);
  updatePlayerList(roomId, io);
  socket.emit("roomCreated", roomId);
}

function joinRoom(socket, roomId, username, avatar, io) {
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
    img: avatar,
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

function leaveRoom(socket, roomId, io) {
  const player = rooms[roomId]?.players?.[socket.id];
  if (rooms[roomId]) {
    if (player?.is_host) {
      const playersArray = Object.values(rooms[roomId].players);
      if (playersArray.length > 1) {
        const newHost = playersArray[1];
        if (player?.is_chance) {
          newHost.is_chance = true;
        }
        newHost.is_host = true;
        io.to(roomId).emit(
          "newHostAssigned",
          "info",
          `${newHost.username} is now the host!`
        );
      }
    }
    delete rooms[roomId].players[socket.id];
    rooms[roomId].player_count--;
    socket.leave(roomId);

    io.to(roomId).emit(
      "playerLeft",
      "warning",
      `${player?.username} left the room!`
    );
    updatePlayerList(roomId, io);

    if (Object.keys(rooms[roomId].players).length === 0) {
      if (roomIDS.has(roomId)) {
        roomIDS.delete(roomId);
      }
      delete rooms[roomId];
    }
  }
}

function disconnectRoom(socket, io) {
  for (const roomId in rooms) {
    if (rooms[roomId].players[socket.id]) {
      const isHost = rooms[roomId]?.players?.[socket.id]?.is_host;
      if (isHost) {
        const playersArray = Object.values(rooms[roomId].players);
        if (playersArray.length > 1) {
          const newHost = playersArray[1];
          if (rooms[roomId]?.players?.[socket.id]?.is_chance) {
            newHost.is_chance = true;
          }
          newHost.is_host = true;
          io.to(roomId).emit(
            "newHostAssigned",
            "info",
            `${newHost.username} is now the host!`
          );
        }
      }
      const username = rooms[roomId]?.players?.[socket.id]?.username;
      delete rooms[roomId].players[socket.id];
      rooms[roomId].player_count--;
      io.to(roomId).emit(
        "playerLeft",
        "warning",
        `${username} got disconnected!`
      );
      updatePlayerList(roomId, io);

      if (Object.keys(rooms[roomId].players).length === 0) {
        if (roomIDS.has(roomId)) {
          roomIDS.delete(roomId);
        }
        delete rooms[roomId];
      }
    }
  }
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  disconnectRoom,
};
