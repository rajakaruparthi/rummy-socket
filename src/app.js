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
let rooms = []
let showCards = []


io.on("connection", socket => {


    console.log(computerName())

    let previousId;

    socket.on("addUser", obj => {

        console.log("came in add user");
        console.log(obj);
        // rooms[index++] = {"roomId": obj.roomId, "users": users};
        users[index++] = {'name': obj.name, 'folded': false};

        axios.post('http://localhost:8102/api/get-room-by-id', {
            id: obj.roomId
        }).then((res) => {
            users = res.data.playersList;
        }).catch((error) => {
            console.error(error)
        });

        // socket.to(obj.roomId).emit("users", users[obj.roomId]);
        io.emit("users", users);
    });

    // socket.on("createRoom", obj => {
    //
    //     axios.get('http://localhost:8102/api/get-rooms')
    //         .then((res) => {
    //         console.log(`statusCode: ${res.statusCode}`)
    //         users = res.data.playersList;
    //     }).catch((error) => {
    //         console.error(error)
    //     });
    //
    //    rooms.push()
    // });

    socket.on("getRooms", obj => {
        axios.post('http://localhost:8102/api/get-rooms', {
            id: obj.roomId
        }).then((res) => {
            console.log(`statusCode: ${res.statusCode}`)
            users = res.data.playersList;
        }).catch((error) => {
            console.error(error)
        });
        io.emit("users", users);
    });


    socket.on("updateUsers", obj => {
        console.log(obj);
        axios.post('http://localhost:8102/api/get-room-by-id', {
            id: obj.roomId
        }).then((res) => {
            console.log(`statusCode: ${res.statusCode}`)
            users = res.data.playersList;
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
        playersCards = [];
        io.emit("users", users);
        io.emit("gameStarted", true);
        io.emit("declaredFlag", false);
        io.emit("cards", cards);
        for (let i = 0; i < users.length; i++) {
            playersCards[i] = { "cards" : cards[i].cards, "foldedFlag" :false, "playerName": cards[i].name};
        }
    });

    socket.on("showCards", flag => {
        io.emit("gameEnded", true);
        io.emit("declaredFlag", flag);
        console.log("---------------------- show cards -----------------------");
        console.log(playersCards);
        io.emit("finalShowCards", playersCards);
    });

    socket.on("updateFinalCardsResponse", data => {
        io.emit("finalShowCards", playersCards);
        io.emit("showCards", data);
    });

    socket.on("deletePlayer", roomId => {
        axios.post('http://localhost:8102/api/get-room-by-id', {
            id: roomId
        }).then((res) => {
            console.log(`statusCode: ${res.statusCode}`)
            users = res.data.playersList;
            io.emit("users", users);
        }).catch((error) => {
            console.error(error)
        });
    });

    socket.on("updatePlayersCards", ary => {
        let index = ary[0];
        playersCards[index] = { "cards" : ary[1], "foldedFlag" : users[index].folded, "playerName": users[index].name};
        console.log("------------------------- update player cards --------------------");
        console.log(playersCards);
    });

    socket.on("winnerIndexEmit", index => {
        io.emit("winnerIndex" , index);
    });

    socket.on("changePlayer", currentIndex => {
        let len = users.length;
        currentIndex = currentIndex + 1;
        currentIndex = currentIndex%len;

        if(users[currentIndex].folded) {
            // skip this player
            currentIndex = currentIndex + 1;
            currentIndex = currentIndex%len;
        }

        io.emit("currentIndex", currentIndex);
        io.emit("currentPlayer", users[currentIndex]);
    });


    socket.on("updateIsFoldedFlag", index => {
        users[index].folded = true;
        io.emit("users", users)
    });


    socket.on("getDoc", docId => {
        // safeJoin(docId);
        socket.emit("document", documents[docId]);
    });


    socket.on("addDoc", doc => {
        documents[doc.id] = doc;
        // safeJoin(doc.id);
        io.emit("documents", Object.keys(documents));
        socket.emit("document", doc);
    });

    socket.on("editDoc", doc => {
        documents[doc.id] = doc;
        socket.to(doc.id).emit("document", doc);
    });

    io.emit("documents", Object.keys(documents));
    io.emit("users", users);
    // io.emit("finalShowCards", playersCards);
    // io.emit("showCards", showCards);
});

http.listen(4444);

