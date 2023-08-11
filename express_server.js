const express = require("express");
const app = express();
const PORT = 8080; 
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'], // replace with your actual secret key(s)
}));

const urlDatabase = {
  b2xVn2: {
    id: "hk45oy",
    longURL: "http://www.lighthouselabs.ca",
    userId: "yoyo",
  },

  s9m5xK: {
    id: "f4gte5",
    longURL: "http://www.google.com",
    userId: "yoyo",
  },
};

const users = {
  user: {
    id: "user",
    email: "user@example.com",
    password: "$2a$10$z8hhcQFKd2XxNKizEzO.6u1sHHjB77ZDGKQznGDMFPQBDE0hSwcd6"
  },

  yoyo: {
    id: "yoyo",
    email: "yoyo@example.com",
    password: "$2a$10$pk4H11wtqoEwjCCrV8ywaOar8hw7Ni/5Gelfx2LtFILqhFryRJDfC",
  }
};

function requireLogin(req, res, next) {
  const userId = req.session.user_id;
  if (userId && users[userId]) {
    next();
  } else {
    res.redirect("/login");
  }
};

function urlsForUser(id) {
  const userUrls = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }

  return userUrls;
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
  const user = users[req.session.user_id];

  if (!user) {
    const errorMessage = "You need to be logged in to shorten URLs.";
    res.status(401).render("error", { errorMessage });
    return;
  };

  const id = generateRandomString();
  urlDatabase[id] = {longURL, userId: req.session.user_id, id};
  console.log(urlDatabase);
  res.redirect(`/urls/${id}`);
});

app.get("/urls", requireLogin, (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  const templateVars = {
    urls: userUrls,
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
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
    res.render("error", templateVars);
  }
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
    const errorMessage = "The requested URL does not exist.";
    res.status(404).render("error", { errorMessage });
    return;
  }

  if (urlInfo.userId !== user.id) {
    const errorMessage = "You do not own this URL.";
    res.status(403).render("error", { errorMessage });
    return;
  }

  const templateVars = {
    id: id,
    longURL: urlInfo.longUrl,
    user: users[req.session.user_id],
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
  const user = users[req.session.user_id];

  if (urlDatabase[idToDelete].userId !== user.id) {
    res.status(403).send("You are not authorized to delete this URL");
    return;
  }

  if (urlDatabase[idToDelete].userId !== user.id) {
    res.status(403).send("You are not authorized to delete this URL");
    return;
  }
    delete urlDatabase[idToDelete];
    res.redirect("/urls");
});

app.post("/urls/:id/update", requireLogin, (req, res) => {
  const idToUpdate = req.params.id;
  const updatedURL = req.body.updatedURL;
  const user = users[req.session.user_id];

  if (!urlDatabase[idToUpdate]) {
    res.status(404).send("URL not found");
    return;
  }

  if (urlDatabase[idToUpdate].userId !== user.id) {
    res.status(403).send("You are not authorized to edit this URL");
    return;
  }
  urlDatabase[idToUpdate].longUrl = updatedURL;
  res.redirect(`/urls/${idToUpdate}`);
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
  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
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

      const hashedPassword = bcrypt.hashSync(password, 10);
      users[id] = { id, email, password: hashedPassword }; 
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