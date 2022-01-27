const express = require("express");
const app = express();
const PORT = 8080;

// interpreter les infos logées dans "body" en tant qu'objet et les retranscrir en string.
const bodyParser = require("body-parser");
// to use Express request
const req = require("express/lib/request");
const res = require("express/lib/response");
const cookieParser = require("cookie-parser");
const { send } = require("express/lib/response");

// we are using EJS
app.set("view engine", "ejs");

// help you pull up the data from the form
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// base de données :
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userId: "2su8xK",
  },
  "cS3Vn2": {
    longURL: "http://www.google.com",
    userId: "kg5r3d",
  }
};

let users = {
  "2su8xK": {
    id: "2su8xK",
    email: "julia@gmail.com",
    password: "aqw"
  }
};

const generateRandomString = () => {
// generate random strings for a user ID
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result = result + characters[Math.floor(Math.random() * 62)];
  }
  return result;
};

const emailLookUp = (email) => {
  // pour vérifier si l'email existe déjà dans users
  for (let data in users) {
    if (users[data]["email"] === email) {
      return true;
    }
  }
};

const passLookUp = (email, password) => {
  for (let data in users) {
    if (users[data]["email"] === email) {
      if (users[data]["password"] === password) {
        return users[data]["id"];
      }
    }
  }
};

const urlsUser = (user) => {
  let result = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url]["userId"] === user) {
      let urlKey = urlDatabase[url];
      result[urlKey] = {shortURL: url, longURL: urlDatabase[url]["longURL"]};
    }
  }
  return result;
};

app.get("/home", (req, res) => {
  const userId = req.cookies["user_id"];
  let userEmail = users[userId]["email"];
  const templateVars = { userId: userId, userEmail: userEmail };
  res.render("urls_home", templateVars);
});

// pour gérer l'action de cliquer sur "create new url"
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  let userEmail = "";
  if (userId) {
    userEmail = users[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  if (!userId) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// pour gérer l'action de cliquer sur "My URLs"
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  let userEmail = "";
  if (userId) {
    userEmail = users[userId]["email"];
  }
  const urlLogUser = urlsUser(userId);
  const templateVars = { urls: urlLogUser, userId: userId, userEmail: userEmail };
  res.render("urls_index", templateVars);
});

// pour afficher la page dédiée de chaque URL et afficher les infos (shortURL et longURL)
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  const userId = req.cookies["user_id"];
  let userEmail = "";
  if (userId) {
    userEmail = users[userId]["email"];
  }
  const templateVars = { shortURL: shortURL, longURL: longURL, userId: userId, userEmail: userEmail };
  if (!userId) {
    res.redirect("/login");
  }
  res.render("urls_show", templateVars);
});

// pour rediriger vers la longURL (le site web de destination)
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

// pour définir que le serveur écoute sur le port : 3000 lors du lancement du serveur
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// pour faire le lien entre le JSON package et la database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// pour afficher la page pour s'enregistrer
app.get("/register", (req, res) => {
  const userId = req.cookies["user_id"];
  let userEmail = "";
  if (userId) {
    userEmail = users[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  res.render("urls_register", templateVars);
});

// pour affiche la page pour se Login
app.get("/login", (req, res) => {
  const userId = req.cookies["user_id"];
  let userEmail = "";
  if (userId) {
    userEmail = users[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  res.render("urls_login", templateVars);
});

// pour gérer l'action de cliquer sur le bouton "submit" dans la page "create new URL"
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  const userId = req.cookies["user_id"];
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = {longURL: newLongURL, userId: userId };
  res.redirect("/urls");
});

// lorsqu'on clique sur le bouton "edit" dans la page "my URLs"
app.post("/urls/:shortURL/edit", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    res.status(400).send("Only logged in users can edit.");
  }
  res.redirect(`/urls/${req.params.shortURL}`);
});

// lorsqu'on clique sur le bouton "delete" dans la page "my URLs"
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.cookies["user_id"];
  if (!userId) {
    res.status(400).send("Only logged in users can delete.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// lorsqu'on clique sur le bouton "update" dans la page dédiée d'une URL
app.post("/urls/:shortURL/update", (req, res) => {
  const newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL]["longURL"] = newLongURL;
  res.redirect("/urls");
});

// the login route to redirect to login page
app.post("/tologin", (req, res) => {
  res.redirect("/login");
});

// the login page route + creating a cookie
app.post("/login", (req, res) => {
  const emailLog = req.body.email;
  const passLog = req.body.password;
  if (emailLookUp(emailLog) === true) {
    if (passLookUp(emailLog, passLog)) {
      const userId = passLookUp(emailLog, passLog);
      res.cookie("user_id", userId);
      res.redirect("/urls");
    }
  } else {
    res.status(403).send("User or password incorrect.");
  }
});

// the logout route
app.post("/logout", (req, res) => {
  const userId = req.cookies["user_id"];
  res.clearCookie("user_id", userId);
  res.redirect("/urls");
});

// bouton pour rediriger vers la page "register"
app.post("/signin", (req, res) => {
  res.redirect("/register");
});
  
// to register in the app
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).send("Email and Password are required.");
  } else if (emailLookUp(email) === true) {
    res.status(400).send("Email already exists.");
  } else {
    const newId = generateRandomString();
    users[newId] = { id: newId, password: password, email: email };
    const userId = req.cookies["user_id"];
    res.clearCookie("user_id", userId);
    res.redirect("/urls");
  }
});