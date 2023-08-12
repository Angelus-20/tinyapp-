const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const helpers = require('./helpers');
const { requireLogin, urlsForUser } = require('./helpers');
const { urlDatabase, users } = require('./data');


app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'],
}));

app.use(express.urlencoded({ extended: true }));

function generateRandomString() {
  const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function isValidPassword(password) {
  return password.length >= 6;
};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    const errorMessage = "You need to be logged in to view URLs.";
    return res.status(401).render("error", { errorMessage });
  }

  const userUrls = urlsForUser(req.session.user_id);
  const templateVars = {
    urls: userUrls,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const urlInfo = urlDatabase[id];

  if (!urlInfo) {
    const templateVars = {
      errorMessage: "The requested URL does not exist."
    };
    return res.status(404).render("error", templateVars);
  }

  res.redirect(urlInfo.longURL);
});

app.get("/urls/new", requireLogin, (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", requireLogin, (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const urlInfo = urlDatabase[id];

  if (!urlInfo) {
    const templateVars = {
      errorMessage: "The requested URL does not exist."
    };
    return res.status(404).render("error", templateVars);
  }

  if (urlInfo.userId !== user.id) {
    const errorMessage = "You do not own this URL.";
    return res.status(403).render("error", { errorMessage });
  }

  const templateVars = {
    id: id,
    longURL: urlInfo.longURL,
    user: users[req.session.user_id],
  };
  res.render("urls_show", templateVars);
});



app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const user = req.session.user_id ? users[req.session.user_id] : null;
    res.render("login", { user: user });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = helpers.getUserByEmail(email, users);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const user = req.session.user_id ? users[req.session.user_id] : null;
    res.render('register', { user });
  }
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isValidPassword(password)) {
    const errorMessage = "Invalid email or password. Password must be at least 6 characters long.";
    return res.status(400).render("error", { errorMessage });
  } else if (helpers.getUserByEmail(email, users)) {
    return res.status(400).send("Email already registered");
  } else {
    const id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(password, 10);
    users[id] = { id, email, password: hashedPassword };
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/urls", (req, res) => {
  console.log("Received form submission");
  const longURL = req.body.longURL;
  const user = users[req.session.user_id];

  if (!user) {
    const errorMessage = "You need to be logged in to shorten URLs.";
    return res.status(401).render("error", { errorMessage });
  }

  const id = generateRandomString();
  urlDatabase[id] = { longURL, userId: req.session.user_id, id };
  console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/delete", requireLogin, (req, res) => {
  const idToDelete = req.params.id;
  const user = users[req.session.user_id];

  if (!req.session.user_id) {
    const errorMessage = "You need to be logged in to perform this action.";
    return res.status(401).render("error", { errorMessage });
  }

  if (urlDatabase[idToDelete].userId !== user.id) {
    return res.status(403).send("You are not authorized to delete this URL");
  }
  delete urlDatabase[idToDelete];
  res.redirect("/urls");
});

app.post("/urls/:id/update", requireLogin, (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;
  const user = users[req.session.user_id];

  if (!urlDatabase[idToUpdate]) {
    return res.status(404).send("URL not found");
  }

  if (!req.session.user_id) {
    const errorMessage = "You need to be logged in to perform this action.";
    return res.status(401).render("error", { errorMessage });
  }

  urlDatabase[idToUpdate].longURL = updatedURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/submit", requireLogin, (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;

  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate].longURL = updatedURL;
    res.redirect(`/urls`);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});