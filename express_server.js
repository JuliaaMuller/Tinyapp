const express = require("express");
const app = express();
const PORT = 8080;

function generateRandomString() {
// generate random strings for a user ID
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result = result + characters[Math.floor(Math.random()* 62)];
  }
  return result;
};
// we are using EJS
app.set("view engine", "ejs");

// interpreter les infos logées dans "body" en tant qu'objet et les retranscrir en string. 
const bodyParser = require("body-parser");
// to use Express request 
const req = require("express/lib/request");
const res = require("express/lib/response");
const cookieParser = require("cookie-parser");
// help you pull up the data from the form
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

// base de données : 
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// pour gérer l'action de cliquer sur "create new url"
app.get("/urls/new", (req, res) => {
const username = req.cookies["username"];
const templateVars = { username: username };
  res.render("urls_new", templateVars);
});
// pour gérer l'action de cliquer sur "My URLs"
app.get("/urls", (req, res) => {
  console.log(req.cookies)
  const username = req.cookies["username"];
  const templateVars = { urls: urlDatabase, username: username };
  console.log(username);
  res.render("urls_index", templateVars);
});
// pour afficher la page dédiée de chaque URL et afficher les infos (shortURL et longURL)
app.get("/urls/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  const username = req.cookies["username"];
  const templateVars = { shortURL: req.params.shortURL, longURL: longURL, username: username };
  res.render("urls_show", templateVars);
});
// pour rediriger vers la longURL (le site web de destination)
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
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
// pour gérer l'action de cliquer sur le bouton "submit" dans la page "create new URL"
app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = newLongURL;
  console.log(req.body);  // Log the POST request body to the console
  res.redirect('/urls');     
});
// lorsqu'on clique sur le bouton "edit" dans la page "my URLs"
app.post("/urls/:shortURL/edit", (req, res) => {
  res.redirect(`/urls/${req.params.shortURL}`);
  });
// lorsqu'on clique sur le bouton "delete" dans la page "my URLs"
app.post("/urls/:shortURL/delete", (req, res) => {
delete urlDatabase[req.params.shortURL];
res.redirect('/urls');
});
// lorsqu'on clique sur le bouton "update" dans la page dédiée d'une URL 
app.post("/urls/:shortURL/update", (req, res) => {
const newLongURL = req.body.longURL
urlDatabase[req.params.shortURL] = newLongURL;
res.redirect('/urls');
});
// the login route 
app.post("/login", (req, res) => {
const username = req.body["username"];
res.cookie("username", username);
res.redirect('/urls');
});
// the logout route 
app.post("/logout", (req, res) => {
  const username = req.cookies["username"];
  res.clearCookie("username", username);
  res.redirect('/urls');
  });

// // page d'acceuil test 
// app.get("/", (req, res) => {
//   res.send("Hello!");
// });
// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });