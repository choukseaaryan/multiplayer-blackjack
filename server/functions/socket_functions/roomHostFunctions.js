const { generateRoomID, isUsernameTakenInRoom, updatePlayerList } = require('../helper_functions/roomHelper.js')
const { rooms, usernames, roomIDS } = require('../../global_data/roomData.js')
const Deck = require("../../public/algorithm_drawCards.js");
const {
    createDeck,
    shuffleDeck,
    drawCards,
    calculateCardSum,
} = require('../helper_functions/cardHelper.js')

function kickPlayer(socket, roomId, playerId, io) {
    const room = rooms[roomId];

    if (room) {
        const playerToKick = room.players?.[playerId];

        if (playerToKick) {
            io.to(playerId).emit("kicked", "error", "You have been kicked from the room!");
            delete room.players[playerId];
            room.player_count--;
            updatePlayerList(roomId, io);
            io.to(roomId).emit("playerKicked", "warning", `${playerToKick.username} has been kicked from the room!`);

            if (Object.keys(room.players).length === 0) {
                delete rooms[roomId];
            }
        } else {
            socket.emit("playerNotFoundError", "error", "Player not found in the room.");
        }
    } else {
        socket.emit("roomNotFoundError", "error", "Room not found.");
    }
}

function changeBetSize(socket, roomId, betSize, io){
    if (rooms[roomId]) {
        rooms[roomId].bet_size = betSize;
        io.to(roomId).emit("betSizeUpdated", betSize);
    }
}

function startGame(socket, roomId, io){

    Object.values(rooms[roomId]?.players).forEach((player) => {
        player.is_out = false;
        player.is_stand = false;
        player.cards_in_hand = [];
        player.cards_sum = 0;
    });

    if (rooms[roomId]) {
        if (rooms[roomId].player_count <= 1) {
            socket.emit(
                "lessPlayersError",
                "error",
                "Two or more players required to start the game"
            );
            return;
        }

        rooms[roomId].can_join = false;
        rooms[roomId].pot_amount = rooms[roomId].bet_size * rooms[roomId].player_count;

        let deck = createDeck();
        shuffleDeck(deck);

        Object.values(rooms[roomId].players).forEach((player) => {
            if (player.balance >= rooms[roomId].bet_size) {
                player.balance -= rooms[roomId].bet_size;

                player.cards_in_hand = drawCards(deck, 2);
                player.cards_sum = calculateCardSum(player.cards_in_hand);

            } else {
                socket.emit(
                    "insufficientBalanceError",
                    "error",
                    `${player.username} does not have enough balance to place the bet.`
                );
                return;
            }
        });

        io.to(roomId).emit("gameStarted", Object.values(rooms[roomId]?.players));

    } else {
        console.log(`Room ${roomId} not found`);
    }

}



module.exports = {
    kickPlayer,
    changeBetSize,
    startGame,
}