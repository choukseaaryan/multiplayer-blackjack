const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const USER = require("./models/user.js");
const Deck = require("./public/algorithm_drawCards.js");

const app = express();
app.use(bodyParser.json());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

app.use(
    cors({
        origin: "*",
    })
);
app.use(express.static("public"));
app.use(express.json());

let rooms = {};
let usernames = {};
const roomIDS = new Set();


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

app.post("/api/login", async (req, res) => {
    try {
        const { username, balance } = req.body;
        const findUser = await USER.findOne({ username });

        if (findUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        const user = await USER.create({ username, balance });
        res.status(200).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/getallusers", async (req, res) => {
    try {
        const users = await USER.find({});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("createRoom", (username, avatar, balance = 1000) => {
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
            img: avatar
        };

        rooms[roomId].players[socket.id] = {
            id: socket.id,
            username,
            ...usernames[socket.id],
        };

        socket.join(roomId);
        socket.emit("roomCreated", roomId);
        updatePlayerList(roomId);
    });

    socket.on("joinRoom", (roomId, username, avatar) => {
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
        updatePlayerList(roomId);
    });

    socket.on("leaveRoom", (roomId) => {
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
                    io.to(roomId).emit("newHostAssigned", "info", `${newHost.username} is now the host!`);
                }

            }
            delete rooms[roomId].players[socket.id];
            rooms[roomId].player_count--;
            socket.leave(roomId);

            io.to(roomId).emit("playerLeft", "warning", `${player?.username} left the room!`);
            updatePlayerList(roomId);

            if (Object.keys(rooms[roomId].players).length === 0) {
                if (roomIDS.has(roomId)) {
                    roomIDS.delete(roomId);
                }
                delete rooms[roomId];
            }
        }
    });

    socket.on("disconnect", () => {

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
                        io.to(roomId).emit("newHostAssigned", "info", `${newHost.username} is now the host!`);
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
                updatePlayerList(roomId);

                if (Object.keys(rooms[roomId].players).length === 0) {
                    if (roomIDS.has(roomId)) {
                        roomIDS.delete(roomId);
                    }
                    delete rooms[roomId];
                }
            }
        }
    });

    socket.on("kickPlayer", (roomId, playerId) => {
        const room = rooms[roomId];

        if (room) {
            const playerToKick = room.players?.[playerId];

            if (playerToKick) {
                io.to(playerId).emit("kicked", "error", "You have been kicked from the room!");
                delete room.players[playerId];
                room.player_count--;
                updatePlayerList(roomId);
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
    });


    socket.on("updateBetSize", (roomId, betSize) => {
        if (rooms[roomId]) {
            rooms[roomId].bet_size = betSize;
            io.to(roomId).emit(
                "betSizeUpdated",
                "info",
                `Bet size updated to $${betSize}`
            );
        }
    });

    socket.on("betSizeChanged", (roomId, betSize) => {
        if (rooms[roomId]) {
            rooms[roomId].bet_size = betSize;
            io.to(roomId).emit("betSizeUpdated", betSize);
        }
    });

    socket.on("startGame", (roomId) => {
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
    });

    socket.on("hit", (roomId, playerId) => {
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
            }
            checkGameStatus(roomId);
            updatePlayerList(roomId);
            toggleChance(roomId, room, playerId);
        }
    });

    socket.on("stand", (roomId, playerId) => {
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
            toggleChance(roomId, room, playerId); // Call toggleChance to move to the next player
            checkGameStatus(roomId); // Check game status after a player stands
        }
        checkGameStatus(roomId);
    });

    socket.on("getPlayerList", (roomid) => {
        if (roomid) {
            let playerList =
                rooms[roomid]?.players && Object.values(rooms[roomid]?.players);
            socket.emit("returningPlayerList", playerList);
        }
    });

    socket.on("sendMessage", (roomId, playerId, message = "") => {
        const player = rooms[roomId]?.players[playerId];
        if (player) {
            io.to(roomId).emit("receiveMessage", {
                id: playerId,
                username: player.username,
                message: message,
                time: new Date().toLocaleTimeString(),
            });
        }
    });


    function generateRoomID() {
        const chars = '1234567890';
        let roomID;

        do {
            roomID = '';
            for (let i = 0; i < 6; i++) {
                const randomIndex = Math.floor(Math.random() * chars.length);
                roomID += chars[randomIndex];
            }
        } while (roomIDS.has(roomID));

        roomIDS.add(roomID);
        return roomID;
    }

    function toggleChance(roomId, room, currentPlayerId) {
        const playerIds = Object.keys(room.players);
        const currentIndex = playerIds.indexOf(currentPlayerId);
        let nextIndex = (currentIndex + 1) % playerIds.length; // Start with the next player
        if (room.players[playerIds[nextIndex]].cards_sum == 21) {
            room.players[playerIds[nextIndex]].is_stand = true;
        }
        // Loop until we find a player who can take their turn
        while (
            room.players[playerIds[nextIndex]].is_stand ||
            room.players[playerIds[nextIndex]].is_out ||
            room.players[playerIds[nextIndex]].cards_sum == 21
        ) {
            nextIndex = (nextIndex + 1) % playerIds.length; // Move to the next player
            if (nextIndex === currentIndex) {
                checkGameStatus(roomId);
                return;
            }
        }

        const nextPlayerId = playerIds[nextIndex];

        room.players[currentPlayerId].is_chance = false; // Current player loses chance
        room.players[nextPlayerId].is_chance = true; // Next player gets chance

        io.to(roomId).emit("updatePlayers", Object.values(room.players)); // Emit update with the correct roomId
    }

    // Function to check the game status
    let gameStatusChecked = false;

    function checkGameStatus(roomId) {
      const room = rooms[roomId];
      const allPlayersStood = Object.values(room.players).every(
        (player) => player.is_stand || player.is_out
      );
  
      if (allPlayersStood && !gameStatusChecked) {
        gameStatusChecked = true; // Set flag to true
        const winners = determineWinner(room.players, roomId);
        io.to(roomId).emit("gameEnded", winners); // Emit winners and amounts
        rooms[roomId].can_join = true;
      } else if (!allPlayersStood) {
        gameStatusChecked = false; // Reset flag if players can still play
      }
    }



    function createDeck() {
        const suits = ["hearts", "diamonds", "clubs", "spades"];
        const values = [
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "J",
            "Q",
            "K",
            "A",
        ];
        let deck = [];

        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        return deck;
    }


    //Fisher-Yates shuffle algorithn
    function shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function drawCards(deck, n) {
        let drawnCards = [];
        for (let i = 0; i < n; i++) {
            drawnCards.push(deck.pop());
        }
        return drawnCards;
    }

    function calculateCardSum(cards) {
        let sum = 0;
        let aceCount = 0;

        cards.forEach((card) => {
            if (card.value === "A") {
                aceCount += 1;
                sum += 11; // Initially treat Ace as 11
            } else if (["K", "Q", "J"].includes(card.value)) {
                sum += 10; // Face cards are worth 10
            } else {
                sum += parseInt(card.value, 10); // Numeric cards are their face value
            }
        });

        while (sum > 21 && aceCount > 0) {
            sum -= 10; // Change an Ace from 11 to 1
            aceCount -= 1;
        }

        return sum;
    }

    function isUsernameTakenInRoom(roomId, username) {
        if (rooms[roomId] && typeof rooms[roomId].players === "object") {
            return Object.values(rooms[roomId].players).some(
                (player) => player.username === username
            );
        }
        return false;
    }

    function updatePlayerList(roomId) {
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
    
        winners.forEach(winner => {
            const player = Object.values(players).find(p => p.username === winner.name);
            if (player) {
                player.balance += distribution;
                winner.amount = distribution; // Store the amount won by each winner
            }
        });
    
        rooms[roomId].pot_amount = 0;
    
        return winners;
    }
    
});
