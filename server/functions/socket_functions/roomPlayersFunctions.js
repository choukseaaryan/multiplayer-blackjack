const { rooms, usernames, roomIDS } = require('../../global_data/roomData.js')
const Deck = require("../../public/algorithm_drawCards.js");
const {
    shuffleDeck,
    calculateCardSum,
} = require('../helper_functions/cardHelper.js');

const {
    toggleChance,
    checkGameStatus,
    updatePlayerList,
} = require('../helper_functions/roomHelper.js')


function playerHits(socket, roomId, playerId, io) {
    const room = rooms[roomId];

    if (room.players[playerId].is_out) {
        socket.emit("playerOutError", "error", "Can't hit. You are busted!");
        return;
    }

    if (!room.players[playerId].is_chance) {
        socket.emit("notChanceError", "error", "Wait for your chance to hit!");
        return;
    }

    if (room && room.players[playerId]) {
        shuffleDeck(room.card_deck);
        const player = room.players[playerId];
        const newCardString = room.card_deck.pop(); // Draw a new card from the deck

        // Parse the new card
        const [value, suit] = newCardString.split(" of ");

        // Convert face card values to their appropriate single-character representation
        let cardValue;
        if (value === "Jack") {
            cardValue = "J";
        } else if (value === "Queen") {
            cardValue = "Q";
        } else if (value === "King") {
            cardValue = "K";
        } else if (value === "Ace") {
            cardValue = "A";
        } else {
            cardValue = value;
        }

        // Create the card object in the desired format
        const newCard = { suit: suit.toLowerCase(), value: cardValue };

        // Allocate the new card to the player's hand
        player.cards_in_hand.push(newCard); // Assuming player.cards_in_hand is an array

        // Update the player's sum
        player.cards_sum = calculateCardSum(player.cards_in_hand);

        io.to(roomId).emit("playerHit", "info", `${player.username} hit!`);

        if (player.cards_sum > 21) {
            io.to(roomId).emit(
                "userBusted",
                "info",
                `${player.username} is busted`
            );
            player.is_out = true;
            player.is_busted = true;
        } else if (player.cards_sum === 21) {
          player.is_stand = true;
        }
        checkGameStatus(roomId, io);
        updatePlayerList(roomId, io);
        toggleChance(roomId, playerId, io);
    }
}

function playerStands(socket, roomId, playerId, io) {
    const room = rooms[roomId];

    if (room.players[playerId].is_out) {
        socket.emit("playerOutError", "error", "Can't stand. You are busted!");
        return;
    }

    if (!room.players[playerId].is_chance) {
        socket.emit("notChanceError", "error", "Wait for your chance to stand!");
        return;
    }

    if (room && room.players[playerId]) {
        const player = room.players[playerId];
        player.is_stand = true; // Mark player as standing
        io.to(roomId).emit("playerStood", playerId, room.players);
        toggleChance(roomId, playerId, io); // Call toggleChance to move to the next player
    }
    checkGameStatus(roomId, io);
}

function playerMessages(roomId, playerId, message, io) {
    const player = rooms[roomId]?.players[playerId];
    if (player) {
        io.to(roomId).emit("receiveMessage", {
            id: playerId,
            username: player.username,
            message: message,
            time: new Date().toLocaleTimeString(),
        });
    }
}

module.exports = {
    playerHits,
    playerStands,
    playerMessages,
}