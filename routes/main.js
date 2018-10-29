var express = require("express");
var router = express.Router();
let path = require("path");
let fs = require("fs");
let getRand = require("../utils").getRand;
let getHash = require("../utils").getHash;
const rootDir = path.resolve("./");

router.get("/", (req, res) => {
  res.send("OK");
});
/* GET users listing. */
router.post("/join-room", (req, res, next) => {
  fs.readFile(path.join(rootDir, "data", "chatrooms.json"), (err, data) => {
    if (err) {
      console.log(err);
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status | 500);
      res.render("error");
    }

    let chatrooms = JSON.parse(data).chatrooms;

    const roomName = req.body.chatRoomName;
    const passkey = req.body.passkey;
    let passhash = null;
    let username = req.body.username;

    if (passkey !== undefined) {
      passhash = getHash(passkey, "md5");
      console.log("Passkey hash", passhash);
    }
    let room = chatrooms[roomName];

    if (room !== undefined) {
      console.log("Chatroom exists");
      let user = room.users[username];
      if (user !== undefined) {
        console.log("user exists");
        res.send(JSON.stringify({ messages: room.messages }));
      } else {
        chatrooms = addUser(chatrooms, roomName, username);
        saveDB(chatrooms);
      }
    } else {
      chatrooms = addChatRoom(chatrooms, roomName, passhash, username);
      saveDB(chatrooms);
      res.send(JSON.stringify({ messages: chatrooms[roomName].messages }));
    }
  });
});

function addChatRoom(chatrooms, name, passhash, username) {
  chatrooms[name] = {
    name: name,
    passhash: passhash,
    users: {
      list: [],
      messages: []
    }
  };
  chatrooms = addUser(chatrooms, name, username);
  return chatrooms;
}

function addUser(chatrooms, room, username) {
  chatrooms[room].users[username] = {
    name: username | ("anon" + getRand(2)),
    id: getRand(4)
  };
  chatrooms[room].users.list.push(username);
  return chatrooms;
}

router.post("/new-message", (req, res, next) => {
  fs.readFile(path.join(rootDir, "data", "chatrooms.json"), (err, data) => {
    if (err) {
      console.log(err);
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status | 500);
      res.render("error");
    }

    let chatrooms = JSON.parse(data).chatrooms;

    const roomName = req.body.chatRoomName;
    const passkey = req.body.passkey;
    let passhash = null;
    const username = req.body.username;
    const message = req.body.message;

    if (passkey !== undefined) {
      passhash = getHash(passkey);
    }
    let room = chatrooms[roomName];
    if (room !== undefined) {
      let user = room.users[username];
      if (user !== undefined) {
        chatrooms = sendMessage(chatrooms, roomName, username, message);
        saveDB(chatrooms);
        res.send(JSON.stringify(chatrooms[roomName].messages));
      }
    } else {
      err = new Error("Chatroom or user doesnt exist");
      res.status(404);
      res.render("error");
    }
  });
});

function saveDB(chatrooms) {
  fs.writeFile(
    path.join(rootDir, "data", "chatrooms.json"),
    JSON.stringify({ chatrooms }),
    err => {
      if (err) console.log("Cannot update database");
      else console.log("Database updated");
    }
  );
}

function saveMessage(chatrooms, room, username, message) {
  const date = new Date();
  const time = date.toDateString() + " " + date.toTimeString();
  chatrooms[room].messages.push({
    from: username,
    time: time,
    content: message
  });
  return chatrooms;
}

function clearRoom(chatrooms, roomName) {
  delete chatrooms[roomName];
  return chatrooms;
}

router.get("/room", (req, res, next) => {
  res.render("chatroom");
});

module.exports = router;
