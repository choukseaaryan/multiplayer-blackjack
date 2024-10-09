const { rooms } = require("../../global_data/roomData.js");

//generate a 6 digit room ID
function generateRoomID() {
  const chars = "1234567890";
  let roomID;

  do {
    roomID = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      roomID += chars[randomIndex];
    }
  } while (rooms[roomID]);

  return roomID;
}

//toggle chances between players
function toggleChance(roomId, currentPlayerId, io) {
  const room = rooms[roomId];
  const playerIds = room && Object.keys(room.players);
  const currentIndex = playerIds.indexOf(currentPlayerId);
  let nextIndex = (currentIndex + 1) % playerIds.length;

  while (
    room.players[playerIds[nextIndex]].is_stand ||
    room.players[playerIds[nextIndex]].is_out ||
    room.players[playerIds[nextIndex]].cards_sum === 21
  ) {
    nextIndex = (nextIndex + 1) % playerIds.length;
    if (nextIndex === currentIndex) {
      checkGameStatus(roomId, io);
      return;
    }
  }

  const nextPlayerId = playerIds[nextIndex];
  room.players[currentPlayerId].is_chance = false;
  room.players[nextPlayerId].is_chance = true;

  io.to(roomId).emit("updatePlayerList", Object.values(room.players));
}

//check if someone won the game
let gameStatusChecked = false;
function checkGameStatus(roomId, io) {
  const room = rooms[roomId];
  const allPlayersStood = Object.values(room.players).every(
    (player) => player.is_stand || player.is_out
  );

  if (allPlayersStood && !gameStatusChecked) {
    gameStatusChecked = true;
    const winners = determineWinner(room.players, roomId);
    io.to(roomId).emit("gameEnded", winners);
    rooms[roomId].can_join = true;
  } else if (!allPlayersStood) {
    gameStatusChecked = false;
  }
}

function isUsernameTakenInRoom(roomId, username) {
  if (rooms[roomId] && typeof rooms[roomId].players === "object") {
    return Object.values(rooms[roomId].players).some(
      (player) => player.username === username
    );
  }
  return false;
}

//update list of players within a room and emit it to all players within the room
function updatePlayerList(roomId, io) {
  if (rooms[roomId]) {
    const players = Object.values(rooms[roomId].players);
    io.to(roomId).emit("updatePlayerList", players);
  }
}

function determineWinner(players, roomId) {
  let highestScore = 0;
  let winners = [];

  Object.values(players).forEach((player) => {
    if (!player.is_out && player.cards_sum <= 21) {
      if (player.cards_sum > highestScore) {
        highestScore = player.cards_sum;
        winners = [{ name: player.username, amount: 0 }];
      } else if (player.cards_sum === highestScore) {
        winners.push({ name: player.username, amount: 0 });
      }
    }
  });

  const potAmount = rooms[roomId].pot_amount;
  const numberOfWinners = winners.length;
  let distribution = numberOfWinners > 0 ? potAmount / numberOfWinners : 0;

  winners.forEach((winner) => {
    const player = Object.values(players).find(
      (p) => p.username === winner.name
    );
    if (player) {
      player.balance += distribution;
      winner.amount = distribution;
    }
  });

  rooms[roomId].pot_amount = 0;

  return winners;
}

function getPlayersList(socket, roomid) {
  if (roomid) {
    let playerList =
      rooms[roomid]?.players && Object.values(rooms[roomid]?.players);
    socket.emit("returningPlayerList", playerList);
  }
}

module.exports = {
  generateRoomID,
  toggleChance,
  checkGameStatus,
  isUsernameTakenInRoom,
  updatePlayerList,
  determineWinner,
  getPlayersList,
};
