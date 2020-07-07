const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const axios = require('axios')


const computerName = require('computer-name');

const documents = {}
let users = []
let index = 0
let cards = []
let deckArray = []
let openCards = []
let playersCards = []

let hostName = "localhost";
io.on("connection", socket => {

    let distributeIndex = 0;

    socket.on("addUser", obj => {
        users[index++] = {'name': obj.name, 'folded': false};

        axios.post('http://'+hostName+':8102/api/get-room-by-id', {
            id: obj.roomId
        }).then((res) => {
            users = res.data.playersList;
            io.emit("users", users);
        }).then((res) => {
            io.emit("users", users);
        }).catch((error) => {
            console.error(error)
        });

        if(users !== undefined){io.emit("distributeIndex", distributeIndex%(users.length));}
    });

    socket.on("getRooms", obj => {
        axios.post('http://'+hostName+':8102/api/get-rooms', {
            id: obj.roomId
        }).then((res) => {
            users = res.data.playersList;
        }).then((res) => {
            io.emit("users", users);
        }).catch((error) => {
            console.error(error)
        });
        io.emit("users", users);
    });


    socket.on("updateUsers", obj => {
        console.log(obj);
        axios.post('http://'+hostName+':8102/api/get-room-by-id', {
            id: obj.roomId
        }).then((res) => {
            users = res.data.playersList;
        }).then((res) => {
            io.emit("users", users);
        }).catch((error) => {
            console.error(error)
        });
    });

    socket.on("deleteRoom", roomsId => {
        users = [];
        index = 0;
        io.emit("users", users);
    });

    socket.on("updateOpenCard", card => {
        openCards = [];
        openCards.push(card);
        io.emit("openCardEmitter", openCards);
    });

    socket.on("joker", joker => {
        io.emit("jokerEmitter", joker);
    });

    socket.on("updateDeck", deck => {
        deckArray = deck;
        io.emit("deckEmitter", deckArray);
    });


    socket.on("startGame", ary => {
        cards = ary;
        console.log(cards);
        console.log(distributeIndex);
        io.emit("users", users);
        io.emit("gameStarted", true);
        io.emit("declaredFlag", false);
        io.emit("cards", cards);
        io.emit("currentIndex", (distributeIndex+1)%users.length);
        io.emit("currentPlayer", users[(distributeIndex+1)%users.length]);

        for (let i = 0; i < users.length; i++) {
            playersCards[i] = { "cards" : cards[i].cards, "foldedFlag" :false, "playerName": cards[i].name};
        }
    });

    socket.on("showCards", index => {
        io.emit("gameEnded", true);
        io.emit("declaredFlag", true);
        io.emit("finalShowCards", playersCards);
        io.emit("winnerIndex" , index);
        io.emit("winnerPlayer", playersCards[index].playerName);
    });

    socket.on("updateFinalCardsResponse", data => {
        io.emit("finalShowCards", playersCards);
        io.emit("showCards", data);
    });

    socket.on("deletePlayer", roomId => {
        axios.post('http://'+hostName+':8102/api/get-room-by-id', {
            id: roomId
        }).then((res) => {
            users = res.data.playersList;
            io.emit("users", users);
        }).catch((error) => {
            console.error(error)
        });
    });

    socket.on("deletePlayerIndex", index => {
        if(distributeIndex >= index) {
            distributeIndex--;
        }
        playersCards.splice(index, 1);
        io.emit("distributeIndex", distributeIndex);
    });

    socket.on("updatePlayersCards", ary => {
        let index = ary[0];
        playersCards[index] = { "cards" : ary[1], "foldedFlag" : users[index].folded, "playerName": users[index].name};
    });

    socket.on("winnerIndexEmit", index => {
        io.emit("winnerIndex" , index);
    });

    socket.on("changePlayer", currentIndex => {
        let len = users.length;
        currentIndex = currentIndex + 1;
        currentIndex = currentIndex%len;

        if(users[currentIndex].folded) {
            currentIndex = currentIndex + 1;
            currentIndex = currentIndex%len;
        }

        io.emit("currentIndex", currentIndex);
        io.emit("currentPlayer", users[currentIndex]);
    });

    socket.on("continuePlaying", txt => {
        distributeIndex++;
        io.emit("distributeIndex", distributeIndex%(users.length));
    });


    socket.on("updateIsFoldedFlag", index => {
        users[index].folded = true;
        io.emit("users", users);
    });

    io.emit("users", users);
    io.emit("startIndex", distributeIndex);

});

http.listen(4444);

