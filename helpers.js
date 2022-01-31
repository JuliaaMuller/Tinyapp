//To import Database (URLs)
const urlDatabase = require("./database/urlDatabase")

const getUserByEmail = (email, database) => {
  // pour vérifier si l'email existe déjà dans users
  for (let id in database) {
    if (database[id]["email"] === email) {
        return id;
    }
  }
};

// generate random strings for a user ID;
const generateRandomString = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result = result + characters[Math.floor(Math.random() * 62)];
  }
  return result;
};

// shows the urls belonging to one user;
const urlsUser = (user) => {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]["userId"] === user) {
      result[url] = {shortURL: url, longURL: urlDatabase[url]["longURL"]};
    }
  }
  return result;
};

module.exports = { getUserByEmail, generateRandomString, urlsUser }


