const { urlDatabase } = require('./data');
const { users } = require('./data');

const getUserByEmail = function(email, database) {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
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


module.exports = { getUserByEmail, requireLogin, urlsForUser };

