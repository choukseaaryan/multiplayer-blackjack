const socket = io();
function $(id){ return document.getElementById(id); }

const createRoomBtn = $('createRoom');
const joinRoomBtn = $('joinRoom');
const usernameInput = $('usernameInput');
const roomIdInput = $('roomIdInput');
const lobbyDiv = $('lobby');
const gameRoomDiv = $('gameRoom');
const roomTitle = $('roomTitle');
const playersList = $('playersList');
const leaveRoomBtn = $('leaveRoom');
const playersActionsList = $('playersActionsList');

let currentRoomId = null;

document.addEventListener('DOMContentLoaded', () => {
    const roomTitle = document.getElementById('roomTitle');

    roomTitle.addEventListener('click', () => {
        // Create a temporary input element
        const tempInput = document.createElement('input');
        tempInput.value = roomTitle.textContent; // Get the text content

        // Append to the body
        document.body.appendChild(tempInput);

        // Select the text
        tempInput.select();
        document.execCommand('copy'); // Copy to clipboard

        // Remove the temporary input
        document.body.removeChild(tempInput);

        // Optionally, show a message or feedback
        alert('Room title copied to clipboard!');
    });
});


// Create room
createRoomBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        socket.emit('createRoom', username);
    }else{
        alert('Username is required')
    }
});

// Join room
joinRoomBtn.addEventListener('click', () => {
    const roomId = roomIdInput.value.trim();
    const username = usernameInput.value.trim();
    if (roomId && username) {
        socket.emit('joinRoom', roomId, username);
    }else{
        alert('Username and room id are required')
    }
});

document.querySelectorAll('input[name="betAmount"]').forEach((radio) => {
    radio.addEventListener('change', () => {
        const selectedBet = document.querySelector('input[name="betAmount"]:checked');
        let roomid = roomTitle.innerText;
        if (selectedBet) {
            const betAmount = parseInt(selectedBet.value, 10);
            socket.emit('betSizeChanged', roomid, betAmount);
        }
    });
});

document.getElementById('startGameButton').addEventListener('click', () => {
    console.log('Start Game button clicked'); 
    const selectedBet = document.querySelector('input[name="betAmount"]:checked');
    let roomid = document.getElementById('roomTitle').innerText; // Ensure to get the room title correctly
    if (selectedBet) {
        const betAmount = parseInt(selectedBet.value, 10);
        console.log(`Bet amount selected: $${betAmount}`);
        
        // Emit events to the server
        socket.emit('updateBetSize', roomid, betAmount);
        socket.emit('startGame', roomid);
        
        // Hide the gameRoom div
        document.getElementById('gameRoom').style.display = 'none';
        
    } else {
        console.log('Please select a bet amount before starting the game.');
        alert('Select a bet amount');
    }
});

leaveRoomBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('leaveRoom', currentRoomId);
        lobbyDiv.style.display = 'block';
        gameRoomDiv.style.display = 'none';
        playersList.innerHTML = '';
        currentRoomId = null;
    }
});



socket.on('roomCreated', (roomId) => {
    currentRoomId = roomId;
    roomTitle.textContent = roomId;
    lobbyDiv.style.display = 'none';
    gameRoomDiv.style.display = 'block';
});


socket.on('joinedRoom', (roomId) => {
    currentRoomId = roomId;
    roomTitle.textContent = roomId;
    lobbyDiv.style.display = 'none';
    gameRoomDiv.style.display = 'block';
});


socket.on('updatePlayerList', (players) => {
    playersList.innerHTML = '';
    players.forEach(username => {
        const playerItem = document.createElement('div');
        playerItem.textContent = username;
        playerItem.classList.add('player-item'); // Add the new class
        playersList.appendChild(playerItem);
    });
});


socket.on('betSizeUpdated', (betSize) => {
    const betOptions = document.querySelectorAll('input[name="betAmount"]');
    betOptions.forEach((option) => {
        if (parseInt(option.value, 10) === betSize) {
            option.checked = true; 
        }
    });
});


socket.on('playerLeft', (username) => {
    const playerItems = playersList.querySelectorAll('div');
    playerItems.forEach(item => {
        if (item.textContent.includes(username)) {
            item.remove();
        }
    });
});

socket.on('roomNotFoundError', (message) => {
    alert(message);
});


socket.on('lobbyFullError', ()=>{
    alert('Cannot join lobby. Lobby is full.');
})

socket.on('userExistsError', ()=>{
    alert('Username already exists in the lobby');
})

socket.on('betSizeUpdated', (betSize) => {
    console.log(`The bet size has been updated to $${betSize}.`);
});

socket.on('matchStartedError', ()=>{
    alert('Match already started.')
})

socket.on('lessPlayersError', ()=>{
    alert('Two or more players are required before starting game.')
})

socket.on('gameAlreadyStartedError', ()=>{
    alert('This game is already started.')
})

socket.on('gameStarted', (roomData) => {
    // Show the game actions section
    document.getElementById('gameActions').style.display = 'block';
    document.getElementById('gameRoom').style.display = 'none';
    updatePlayerActionsList(roomData.players, socket.id);
});

// Function to update players' actions list
function updatePlayerActionsList(players, currentPlayerId) {
    playersActionsList.innerHTML = '';

    Object.values(players).forEach(player => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-action'; // Add a class for styling

        if (player.is_busted) {
            playerDiv.classList.add('busted'); // Add a class for busted players
        }

        // Create a string for card images
        const cardImages = player.cards_in_hand.map(card => {
            return `<img src="./assets/images/${card.value}_of_${card.suit}.png" alt="${card.value} of ${card.suit}" class="card-image">`;
        }).join('');

        playerDiv.innerHTML = `
            <div class="player-info">
                <strong>${player.username}</strong>
                <div class="player-cards">${cardImages}</div>
                <div class="player-sum">Sum: ${player.cards_sum}</div>
                ${player.is_chance ? '<span class="your-turn">(Your turn!)</span>' : ''}
                ${player.is_busted ? '<span class="busted-label">(Busted!)</span>' : ''}
            </div>
        `;

        // Only show buttons for the current player and if they're not busted
        if (player.id === currentPlayerId && player.is_chance && !player.is_stand && !player.is_busted) {
            playerDiv.innerHTML += `
                <div class="player-actions">
                    <button class="action-button" onclick="hit('${player.id}')">Hit</button>
                    <button class="action-button" onclick="stand('${player.id}')">Stand</button>
                </div>
            `;
        }

        playersActionsList.appendChild(playerDiv);
    });
}



socket.on('updatePlayers', (players) => {
    updatePlayerActionsList(players, socket.id);
});



function hit(playerId) {
    console.log(`Hit requested for player: ${playerId}`);
    socket.emit('hit', currentRoomId, playerId);
}

function stand(playerId) {
    console.log(`Stand requested for player: ${playerId}`); 
    socket.emit('stand', currentRoomId, playerId);
}

socket.on('playerHit', (playerId, newCard, cardsSum, players) => {
    
    console.log(`${playerId} hit and received ${JSON.stringify(newCard)}. New sum: ${cardsSum}`);
    updatePlayerActionsList(players, socket.id);
    
});

socket.on('playerStood', (playerId, players) => {
    console.log(`${playerId} stood.`);
    updatePlayerActionsList(players,  socket.id);
});

socket.on('playerOutError', ()=>{
    alert('Player is out')
    
})

socket.on('gameEnded', (message) => {
    alert(message); // Show the winners or game end message
});




// // Array of image paths
// const imagePaths = [
//     './assets/images/spadee.png', // Replace with your actual image paths
//     './assets/images/diamondd.png',
//     './assets/images/clubb.png',
//     './assets/images/heartt.png'
// ];

// function createFlyingImage() {
//     const img = document.createElement('img');
    
//     // Select a random image from the array
//     const randomIndex = Math.floor(Math.random() * imagePaths.length);
//     img.src = imagePaths[randomIndex]; 
    
//     img.className = 'flying-image';
    
//     // Set random initial position
//     img.style.left = Math.random() * 100 + 'vw'; // Random horizontal position
//     img.style.top = Math.random() * 100 + 'vh'; // Random vertical position

//     // Set a random duration for the animation
//     const duration = Math.random() * 5 + 5; // Random duration between 5s to 10s
//     img.style.animationDuration = duration + 's';
    
//     // Add the image to the container
//     document.getElementById('flyingImagesContainer').appendChild(img);

//     // Remove the image after it finishes flying
//     img.addEventListener('animationend', () => {
//         img.remove();
//     });
// }

// // Generate flying images at random intervals
// setInterval(createFlyingImage, 1000); // Adjust the interval as needed
