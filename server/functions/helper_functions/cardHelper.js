let rooms = require('../../global_data/roomData.js')

//create deck
function createDeck() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    let deck = [];

    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

//shuffle card 
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

//after shuffling the cards, take the last card from the array and pop it
function drawCards(deck, n) {
    let drawnCards = [];
    for (let i = 0; i < n; i++) {
        drawnCards.push(deck.pop());
    }
    return drawnCards;
}

//calculate sum of cards which players have
function calculateCardSum(cards) {
    let sum = 0;
    let aceCount = 0;

    cards.forEach((card) => {
        if (card.value === "A") {
            aceCount += 1;
            sum += 11;
        } else if (["K", "Q", "J"].includes(card.value)) {
            sum += 10;
        } else {
            sum += parseInt(card.value, 10);
        }
    });

    //changes ACE value to 1 if sum exceeds 21
    while (sum > 21 && aceCount > 0) {
        sum -= 10;
        aceCount -= 1;
    }

    return sum;
}


module.exports = {
    createDeck,
    shuffleDeck,
    drawCards,
    calculateCardSum,
};
