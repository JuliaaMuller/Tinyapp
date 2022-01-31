const express = require("express");
const app = express();
const PORT = 8080;

// to reach infos located in the body and transcript them into strings;
const bodyParser = require("body-parser");
// to use Express request
const req = require("express/lib/request");
const res = require("express/lib/response");
// const cookieParser = require("cookie-parser");
const { send } = require("express/lib/response");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
//To use helpers from helpers.js;
const help = require("./helpers.js");

//To import Databases (URLs & Users)
const urlDatabase = require("./database/urlDatabase")
const usersDb = require("./database/usersDb")

// we are using EJS;
app.set("view engine", "ejs");

// help you pull up the data from the form;
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["27012022"],
}));


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Get route for the default welcome page
app.get("/", (req, res) => {
  let userId = "";
  let userEmail = "";
  if (req.session.user_id) {
    userId = req.session.user_id;
    userEmail = usersDb[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  res.render("urls_home", templateVars);
});

// Allows user to "create new shortUrl" on the dedicated page;
app.get("/urls/new", (req, res) => {
  let userId = "";
  let userEmail = "";
  if (req.session.user_id) {
    userId = req.session.user_id;
    userEmail = usersDb[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  if (!userId) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

//Get route displaying the urls
app.get("/urls", (req, res) => {
  let userId = "";
  let userEmail = "";
  if (req.session.user_id) {
    userId = req.session.user_id;
    userEmail = usersDb[userId]["email"];
  }
  const urlLogUser = help.urlsUser(userId);
  const templateVars = { urls: urlLogUser, userId: userId, userEmail: userEmail };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("Sorry, this shortURL doest not exist.");
  }
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  let userId = "";
  let userEmail = "";
  if (req.session.user_id) {
    userId = req.session.user_id;
    userEmail = usersDb[userId]["email"];
    // checking if the user logged in is allowed to access this shortURL;
    if (help.getUserByEmail(userEmail, usersDb) !== urlDatabase[shortURL]["userId"]) {
      res.status(400).send("You don't own this shortURL, you cannot edit it!");
    }
  }
  const templateVars = { shortURL: shortURL, longURL: longURL, userId: userId, userEmail: userEmail };
  if (!userId) {
    res.status(400).send("Sorry, only logged in users can access this ressource.");
  }
  res.render("urls_show", templateVars);
});

// Allows the redirection into the real URL by using the short UrL if the shortURL exists;
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(400).send("Sorry, this shortURL doest not exist.");
  }
  const longURL = urlDatabase[req.params.shortURL]["longURL"];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let userId = "";
  let userEmail = "";
  if (req.session.user_id) {
    userId = req.session.user_id;
    userEmail = usersDb[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let userId = "";
  let userEmail = "";
  if (req.session.user_id) {
    userId = req.session.user_id;
    userEmail = usersDb[userId]["email"];
  }
  const templateVars = { userId: userId, userEmail: userEmail };
  res.render("urls_login", templateVars);
});

// Handle submit button in the "Create new URL" Page;
app.post("/urls", (req, res) => {
  const newShortURL = help.generateRandomString();
  const userId = req.session.user_id;
  const newLongURL = req.body.longURL;
  urlDatabase[newShortURL] = {longURL: newLongURL, userId: userId };
  res.redirect(`/urls/${newShortURL}`);
});

// Handle edit button in the "my URLS";
app.post("/urls/:shortURL/edit", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(400).send("Only logged in users can edit.");
  }
  res.redirect(`/urls/${req.params.shortURL}`);
});

// Handle the delete button from the "my URLs" Page;
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.status(400).send("Only logged in users can delete.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Handle the update button from the dedicated page of a shortURL;
app.post("/urls/:shortURL/update", (req, res) => {
  const newLongURL = req.body.longURL;
  urlDatabase[req.params.shortURL]["longURL"] = newLongURL;
  res.redirect("/urls");
});

// the login route to redirect to login page from the Header;
app.post("/tologin", (req, res) => {
  res.redirect("/login");
});

// Handle the login button after checking if the user is already registered in the database;
app.post("/login", (req, res) => {
  const emailLog = req.body.email;
  if (help.getUserByEmail(emailLog, usersDb)) {
    const userId = help.getUserByEmail(emailLog, usersDb);
    const userHashedPass = usersDb[userId]["password"];
    const passLog = req.body.password;
    if (bcrypt.compareSync(passLog, userHashedPass)) {
      req.session.user_id = userId;
      res.redirect("/urls");
    } else {
      res.status(403).send("Password incorrect.");
    }
  } else {
    res.status(403).send("This user does not exist.");
  }
});

// the logout route clearing the session cookie;
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// handle the redirection to the register page from the Header;
app.post("/signin", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  res.redirect("/register");
});
  
// handle the register button from the register page after checking if the password and email fields are not empty, if the user mail does not already exist;
app.post("/register", (req, res) => {
  const emailRegister = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!emailRegister || !password) {
    res.status(400).send("Email and Password are required.");
  } else if (help.getUserByEmail(emailRegister, usersDb)) {
    res.status(400).send("Email already exists.");
  } else {
    const newId = help.generateRandomString();
    usersDb[newId] = { id: newId, password: hashedPassword, email: emailRegister };
    req.session.user_id = newId;
    res.redirect("/urls");
  }
});

// Define the listent port : 3000 when the server starts 
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

