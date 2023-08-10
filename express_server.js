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
  1: {
    user: "jake",
    email: "user@example.com",
    password: "12345"
  },
  2: {
    user: "yoyo",
    email: "yoyo@example.com",
    password: "123456",
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
}

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const id = generateRandomString();
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];
  const templateVars = {
    id: id,
    longURL: longURL,
    user: users[req.cookies["user"]],
  };
  res.render("urls_show", templateVars);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;

  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    res.redirect("/urls");
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id/update", (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;

  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = updatedURL;
    res.redirect(`/urls/${idToUpdate}`);
  } else {
    res.status(404).send("URL not found");
  }
});

app.post("/urls/:id/submit", (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;

  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = updatedURL;
    res.redirect(`/urls`);
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userId = generateRandomString();

  users[userId] = {
    id: userId,
    email: email,
    password: password,
  };
  res.cookie("user", userId);
  res.redirect("/urls");
});

app.get("/login", (req, res) =>{
  
  res.render("login");
  res.redirect("/register");
})

app.get("/set-cookie", (req, res) => {
  res.cookie("user", users);
  res.send("cookie has been set!");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  console.log("Accessing /register route");
  res.render("register");
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
}

function isValidPassword(password) {
  return password.length >= 6;
}

/*<div class="nav-item login-form">
  <% if (!user){%>
    <form method="POST" action="/login">
      <label for="email">Email</label>
      <input type="text" id="email" name="email" placeholder="email">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="Password">
      <button type="submit">Login</button>
    </form>
    <%} else {%>
      <p>you're logged in <%= user.email %></p>
    <form method="POST" action="/logout">
      <button type="submit">Logout</button>
    </form>
    <% }%></input>*/