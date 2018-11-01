var express = require("express");
var router = express.Router();
let path = require("path");
let fs = require("fs");
let getRand = require("../utils").getRand;
let getHash = require("../utils").getHash;
let encrypt = require("../utils").encrypt;
let decrypt = require("../utils").decrypt;

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
      return;
    }
    console.log(req.body);
    let chatroomName = req.body.chatroomName;
    let username = req.body.username;
    let passkey = req.body.passkey;
    if (passkey == undefined) {
      passkey = "";
    }
    let chatrooms = JSON.parse(data).chatrooms;
    let room = chatrooms[chatroomName];
    if (room == undefined) {
      console.log("Creating new chatroom", chatroomName);
      chatrooms.list.push(chatroomName);
      chatrooms[chatroomName] = {
        name: chatroomName,
        passhash: getHash(passkey, "md5"),
        id: getRand(6),
        users: {
          list: [username]
        },
        messages: []
      };
      console.log("Chatroom created:", chatroomName);
      chatrooms[chatroomName].users[username] = {
        name: username,
        id: getRand(6),
        isAuthenticated: true
      };
      res.send(
        JSON.stringify(chatrooms[chatroomName]["users"][username], "\t")
      );
      saveDB(chatrooms);
      return;
    } else if (getHash(passkey, "md5") == room.passhash) {
      let user = room.users[username];
      if (user == undefined) {
        user = {
          name: username,
          id: getRand(6)
        };
        room.users.list.push(username);
        room.users[username] = user;
        console.log("Created new user");
      }
      room.users[username]["isAuthenticated"] = true;
      chatrooms[chatroomName] = room;
      res.send(JSON.stringify(user, (space = " ")));
      saveDB(chatrooms);
    } else {
      console.log("Incorrect password for chatroom", chatroomName);
      res.send(
        JSON.stringify({
          name: username,
          id: -1,
          isAuthenticated: false
        })
      );
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

router.get(
  "/new-message/:chatroomName/:username/:passkey/:message",
  (req, res, next) => {
    fs.readFile(path.join(rootDir, "data", "chatrooms.json"), (err, data) => {
      if (err) {
        console.log(err);
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};
        res.status(err.status | 500);
        res.render("error");
      }

      let chatrooms = JSON.parse(data).chatrooms;

      const chatroomName = req.params.chatroomName;
      let passkey = req.params.passkey;
      const username = req.params.username;
      const message = req.params.message;

      if (passkey == undefined) {
        passkey = "";
      }
      let passhash = getHash(passkey, "md5");
      let room = chatrooms[chatroomName];
      if (room != undefined) {
        if (room.users[username] != undefined) {
          if (message != undefined) {
            chatrooms = saveMessage(
              chatrooms,
              chatroomName,
              username,
              message,
              passhash
            );
          }
        } else {
          console.log("Incorrect password or room does not exist");
        }
      }
      res.send(chatrooms[chatroomName].messages);
      saveDB(chatrooms);
    });
  }
);

router.get("/join-room/:chatroomName/:username/:passkey", (req, res, next) => {
  fs.readFile(path.join(rootDir, "data", "chatrooms.json"), (err, data) => {
    if (err) {
      console.log(err);
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status | 500);
      res.render("error");
      return;
    }
    let chatroomName = req.params.chatroomName;
    let username = req.params.username;
    let passkey = req.params.passkey;
    if (passkey == undefined) {
      passkey = "";
    }

    let chatrooms = JSON.parse(data).chatrooms;
    let room = chatrooms[chatroomName];
    console.log("room:", room);
    if (room == undefined) {
      console.log("Creating new chatroom", chatroomName);
      chatrooms.list.push(chatroomName);
      chatrooms[chatroomName] = {
        name: chatroomName,
        passhash: getHash(passkey, "md5"),
        id: getRand(6),
        users: {
          list: [username]
        },
        messages: []
      };
      console.log("Chatroom created:", chatroomName);
      chatrooms[chatroomName].users[username] = {
        name: username,
        id: getRand(6),
        isAuthenticated: true
      };
      res.send(
        JSON.stringify(chatrooms[chatroomName]["users"][username], "\t")
      );
      saveDB(chatrooms);
      return;
    } else if (getHash(passkey, "md5") == room.passhash) {
      let user = room.users[username];
      if (user == undefined) {
        user = {
          name: username,
          id: getRand(6)
        };
        room.users.list.push(username);
        room.users[username] = user;
        console.log("Created new user");
      }
      room.users[username]["isAuthenticated"] = true;
      chatrooms[chatroomName] = room;
      res.send(JSON.stringify(user, (space = " ")));
      saveDB(chatrooms);
    } else {
      console.log("Incorrect password for chatroom", chatroomName);
      res.send(
        JSON.stringify({
          name: username,
          id: -1,
          isAuthenticated: true
        })
      );
    }
  });
});

router.get("/messages/:chatroomName/:passkey", (req, res, next) => {
  fs.readFile(path.join(rootDir, "data", "chatrooms.json"), (err, data) => {
    if (err) {
      console.log(err);
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status | 500);
      res.render("error");
    }

    let chatrooms = JSON.parse(data).chatrooms;

    const chatroomName = req.params.chatroomName;
    let passkey = req.params.passkey;

    if (passkey == undefined) {
      passkey = "";
    }
    let passhash = getHash(passkey, "md5");
    let room = chatrooms[chatroomName];
    if (room != undefined) {
      if (getHash(passkey, "md5") /* == room.passhash*/) {
        let messages = [];
        chatrooms[chatroomName].messages.map(message => {
          console.log("map:", message.content);
          let content;
          if (room.passhash == passhash) {
          }
          messages.push({
            from: message.from,
            time: message.time,
            content:
              passhash == room.passhash
                ? decrypt(message.content, passhash)
                : message.content
          });
        });
        res.send(messages);
      } else {
        console.log("Incorrect password or room does not exist");
        res.send([]);
      }
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

function saveMessage(chatrooms, room, username, message, passhash) {
  const date = new Date();
  const time = date.toDateString() + " " + date.toTimeString();
  chatrooms[room].messages.push({
    from: username,
    time: time,
    content: encrypt(message, passhash),
    id: getRand(6)
  });
  return chatrooms;
}

function clearRoom(chatrooms, chatroomName) {
  delete chatrooms[chatroomName];
  return chatrooms;
}

module.exports = router;
