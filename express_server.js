const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  user: {
    id: "user",
    email: "user@example.com",
    password: "12345"
  },
  yoyo: {
    id: "yoyo",
    email: "yoyo@example.com",
    password: "123456",
  }
};

function requireLogin(req, res, next) {
  const userId = req.cookies.user_id;
  if (userId && users[userId]) {
    next();
  } else {
    res.redirect("/login");
  }
};

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

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const user = users[req.cookies.user_id];
  
  if (!user) {
    const errorMessage = "You need to be logged in to shorten URLs.";
    res.status(401).render("error", { errorMessage });
    return; // Return to avoid further execution
  };

  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (longURL) {
    res.redirect(longURL);
  } else {
    const templateVars = {
      errorMessage: "The requested URL does not exist."
    };
    res.render("error", templateVars); // Create an error_page.ejs template for the error message
  }
});


app.get("/urls/new", requireLogin, (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  console.log(req.cookies);
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
   const user = users[req.cookies.user_id];
  
  if (!user) {
    const errorMessage = "You need to be logged in to shorten URLs.";
    res.status(401).render("error", { errorMessage });
    return; // Return to avoid further execution
  };
  
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = {
    id: id,
    longURL: longURL,
    user: users[req.cookies.user_id],
  };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.post("/urls/:id/delete", requireLogin, (req, res) => {
  const idToDelete = req.params.id;

  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id/update", requireLogin, (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;

  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = updatedURL;
    res.redirect(`/urls/${idToUpdate}`);
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id/submit", requireLogin, (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;

  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = updatedURL;
    res.redirect(`/urls`);
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = Object.values(users).find(u => u.email === email);
  if (user && user.password === password) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/set-cookie", (req, res) => {
  res.cookie("user_id", users);
  res.send("cookie has been set!");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isValidPassword(password)) {
    res.status(400).send("Invalid email or password");
  } else {
    const id = generateRandomString();
    users[id] = { id, email, password };
    console.log(users);
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function isValidPassword(password) {
  return password.length >= 6;
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});