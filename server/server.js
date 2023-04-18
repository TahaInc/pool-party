const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const mongo = require("mongodb");
const MongoDBStore = require("connect-mongodb-session")(session);
const bcrypt = require("bcrypt");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);
const path = require("path");

const PORT = process.env.PORT || 8080;

const mongoURL = "mongodb://127.0.0.1:27017/";
const matchInfo = { 2: { wagerAmount: [5, 10, 25, 50, 100], resultTeaseRange: [30, 34], selectionPeriod: 15000, houseCommission: 0.05, playerReturn: 1.9 }, 3: { wagerAmount: [5, 10, 25, 50, 100], resultTeaseRange: [30, 34], selectionPeriod: 20000, houseCommission: 0.1, playerReturn: 2.7 }, 5: { wagerAmount: [3, 5, 10, 25, 50], resultTeaseRange: [30, 34], selectionPeriod: 25000, houseCommission: 0.15, playerReturn: 4.25 } };
const colors = ["#d1361b", "#4169e1", "#32CD32", "#e8cc15", "#8a2be2"]; // Red, Blue, Green, Yellow, Purple

let matchmakingData = { 2: { 5: {}, 10: {}, 25: {}, 50: {}, 100: {} }, 3: { 5: {}, 10: {}, 25: {}, 50: {}, 100: {} }, 5: { 3: {}, 5: {}, 10: {}, 25: {}, 50: {} } };
let allGamesData = {};

let database;
let MongoClient = mongo.MongoClient;
let mongoStore = new MongoDBStore({
  uri: mongoURL,
  databaseName: "pool-party",
  collection: "users-sessions",
});

const sessionMiddleware = session({ secret: "pool-party-secret-key", resave: true, saveUninitialized: true, store: mongoStore });

app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/build")));

app.post("/login", async (req, res) => {
  if (await validCredentials(req.body.username, req.body.password)) {
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    res.status(200).send();
  } else {
    res.status(401).send();
  }
});

app.post("/register", async (req, res) => {
  if (await userExists(req.body.username)) {
    res.status(400).send();
  } else if (await emailExists(req.body.email)) {
    res.status(401).send();
  } else {
    database.collection("users").insertOne({ username: req.body.username, email: req.body.email, password: await bcrypt.hash(req.body.password, 10), credits: 2000 });
    req.session.username = req.body.username;
    req.session.password = req.body.password;
    res.status(200).send();
  }
});

app.post("/logout", (req, res) => {
  req.session.username = undefined;
  req.session.password = undefined;
  res.status(200).send();
});

app.get("/user", async (req, res) => res.status(200).send(await getInformation(req.session.username, req.session.password)));

// Get express session coookies
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

// Check if user is authenticated
io.use(async (socket, next) => {
  if (await validCredentials(socket.request.session.username, socket.request.session.password)) {
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  if (alreadyInGame(socket.request.session.username)) return socket.emit("already-ingame");

  socket.on("find-match", async (query) => {
    let gameCode;
    let foundGame = false;

    if (query.public) {
      if ((await getInformation(socket.request.session.username, socket.request.session.password)).credits < query.wagerAmount) return socket.emit("insufficient-funds");

      let matchQuery = matchmakingData[query.playerAmount][query.wagerAmount];

      // Go through every awaiting public games
      for (let gameID in matchQuery) {
        if (matchQuery[gameID].type !== "public") continue;

        matchQuery[gameID].playerList.push(socket.request.session.username);
        socket.join(gameID);
        gameCode = gameID;

        socket.emit("awaiting-players");

        if (matchQuery[gameID].playerList.length == query.playerAmount) playGame(gameID, query.playerAmount, query.wagerAmount);

        foundGame = true;
        break;
      }

      // If no public game found, create one
      if (!foundGame) {
        gameCode = generateGameCode();
        matchQuery[gameCode] = { type: "public", playerList: [socket.request.session.username] };
        socket.join(gameCode);
        socket.emit("awaiting-players");
      }
    } else {
      if (query?.gameCode != null) {
        // Look every game for matching game code
        for (let playerSetting in matchmakingData) {
          for (let wagerSetting in matchmakingData[playerSetting]) {
            for (let gameID in matchmakingData[playerSetting][wagerSetting]) {
              if (gameID === query?.gameCode) {
                foundGame = true;
                let matchQuery = matchmakingData[playerSetting][wagerSetting][gameID];

                if ((await getInformation(socket.request.session.username, socket.request.session.password)).credits < query.wagerAmount) return socket.emit("insufficient-funds");

                socket.emit("game-settings", { playerAmount: parseInt(playerSetting), wagerAmount: parseInt(wagerSetting), gameCreator: matchQuery.playerList[0] });

                socket.on("response-settings", (data) => {
                  if (!data.acceptSettings) return;

                  matchQuery.playerList.push(socket.request.session.username);
                  socket.join(gameID);
                  gameCode = gameID;

                  socket.emit("awaiting-players");

                  if (matchQuery.playerList.length == matchQuery.playerAmount) playGame(gameID, matchQuery.playerAmount, matchQuery.wagerAmount);
                });
              }
            }
          }
        }

        if (!foundGame) socket.emit("incorrect-gamecode");
      } else {
        if ((await getInformation(socket.request.session.username, socket.request.session.password)).credits < query.wagerAmount) return socket.emit("insufficient-funds");

        gameCode = generateGameCode();
        matchmakingData[query.playerAmount][query.wagerAmount][gameCode] = { type: "private", playerList: [socket.request.session.username], playerAmount: query.playerAmount, wagerAmount: query.wagerAmount };
        socket.join(gameCode);
        socket.emit("game-code", { gameCode: gameCode });
        socket.emit("awaiting-players");
      }
    }

    socket.on("select-square", (data) => {
      if (allGamesData[gameCode]?.selectionPeriod && allGamesData[gameCode]?.picks[data.squareNumber] === undefined && allGamesData[gameCode].players[socket.request.session.username].picksLeft > 0) {
        allGamesData[gameCode].picks[data.squareNumber] = { username: socket.request.session.username, color: allGamesData[gameCode].players[socket.request.session.username].color };
        allGamesData[gameCode].players[socket.request.session.username].picksLeft--;
        io.sockets.to(gameCode).emit("square-status", { picks: allGamesData[gameCode].picks });
      }
    });

    socket.on("unselect-square", (data) => {
      if (allGamesData[gameCode]?.selectionPeriod) {
        delete allGamesData[gameCode].picks[data.squareNumber];
        allGamesData[gameCode].players[socket.request.session.username].picksLeft++;
        io.sockets.to(gameCode).emit("square-status", { picks: allGamesData[gameCode].picks });
      }
    });

    socket.on("mouse-position", (data) => {
      io.sockets.to(gameCode).emit("mouse-position", { username: socket.request.session.username, position: { x: data.x, y: data.y } });
    });
  });

  socket.on("disconnect", () => {
    for (let playerSetting in matchmakingData) {
      for (let wagerSetting in matchmakingData[playerSetting]) {
        for (let gameID in matchmakingData[playerSetting][wagerSetting]) {
          for (let player of matchmakingData[playerSetting][wagerSetting][gameID].playerList) {
            if (player === socket.request.session.username) {
              let playerList = matchmakingData[playerSetting][wagerSetting][gameID].playerList;
              playerList.splice(playerList.indexOf(player), 1);

              if (playerList.length === 0) delete matchmakingData[playerSetting][wagerSetting][gameID];
            }
          }
        }
      }
    }
  });
});

MongoClient.connect(mongoURL, function (err, client) {
  if (err) throw err;

  database = client.db("pool-party");

  http.listen(PORT, () => {
    console.log("listening on port " + PORT);
  });
});

async function playGame(roomID, playerNum, wagerAmt) {
  allGamesData[roomID] = { selectionPeriod: true, picks: {}, players: {} };

  let index = 0;
  matchmakingData[playerNum][wagerAmt][roomID].playerList.forEach((username) => {
    updateCredits(username, -wagerAmt);
    allGamesData[roomID].players[username] = { color: colors[index++], picksLeft: 5 };
  });
  delete matchmakingData[playerNum][wagerAmt][roomID];

  io.sockets.to(roomID).emit("start-game", { selectionTime: matchInfo[playerNum].selectionPeriod, players: allGamesData[roomID].players });

  let timeLeft = matchInfo[playerNum].selectionPeriod / 1000;
  let countdown = setInterval(() => {
    io.sockets.to(roomID).emit("countdown", { timeLeft: --timeLeft });

    if (timeLeft == 0) {
      clearInterval(countdown);
      let repeatAnimation = generateRandomNumber(matchInfo[playerNum].resultTeaseRange[0], matchInfo[playerNum].resultTeaseRange[1]);
      let revealTimeout = generateRandomNumber(500, 1500);
      let resultNumbers = [revealTimeout, generateRandomNumber(0, playerNum * 5 - 1)];

      for (let i = 1; i <= repeatAnimation; i++) resultNumbers.push((resultNumbers.at(-1) + 1) % (playerNum * 5));

      for (let i = 0; i < playerNum * 5; i++) {
        if (allGamesData[roomID].picks[i] === undefined) {
          for (let player in allGamesData[roomID].players) {
            if (allGamesData[roomID].players[player].picksLeft > 0) {
              allGamesData[roomID].players[player].picksLeft--;
              allGamesData[roomID].picks[i] = { username: player, color: allGamesData[roomID].players[player].color };
              break;
            }
          }
        }
      }

      io.sockets.to(roomID).emit("square-status", { picks: allGamesData[roomID].picks });

      io.sockets.to(roomID).emit("selection-period-expired", resultNumbers);
      allGamesData[roomID].selectionPeriod = false;

      updateCredits(allGamesData[roomID].picks[resultNumbers.at(-1)].username, wagerAmt * matchInfo[playerNum].playerReturn);

      delete allGamesData[roomID];
    }
  }, 1000);
}

function generateRandomNumber(min, max, previousValue = null) {
  let result = Math.floor(Math.random() * (max - min + 1)) + min; // Generate a random number between min & max (inclusive)

  while (result == previousValue) result = Math.floor(Math.random() * (max - min + 1)) + min; // If previousValue is provided, return a different value

  return result;
}

function alreadyInGame(username) {
  for (let playerSetting in matchmakingData) {
    for (let wagerSetting in matchmakingData[playerSetting]) {
      for (let gameID in matchmakingData[playerSetting][wagerSetting]) {
        for (let player of matchmakingData[playerSetting][wagerSetting][gameID].playerList) {
          if (player === username) return true;
        }
      }
    }
  }

  for (let gameID in allGamesData) {
    for (let player of Object.keys(allGamesData[gameID].players)) {
      if (player === username) return true;
    }
  }

  return false;
}

function updateCredits(username, amount) {
  database.collection("users").updateOne({ username: username }, { $inc: { credits: amount } });
}

async function userExists(username) {
  return (await database.collection("users").findOne({ username: username })) ? true : false;
}

async function emailExists(email) {
  return (await database.collection("users").findOne({ email: email })) ? true : false;
}

async function validCredentials(username, password) {
  if (username == undefined || password == undefined) return false;
  let pwd = await database.collection("users").findOne({ username: username });
  return pwd && (await bcrypt.compare(password, pwd.password));
}

async function getInformation(username, password) {
  if (await validCredentials(username, password)) return await database.collection("users").findOne({ username: username }, { projection: { _id: 0, password: 0 } });
  return false;
}

function generateGameCode() {
  let code = nanoid();
  while (allGamesData.hasOwnProperty(code)) code = nanoid();
  return code;
}
