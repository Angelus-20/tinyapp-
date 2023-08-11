const { assert } = require('chai');

const { getUserByEmail } = require('../views/helpers');

const testUsers = {
  user: {
    id: "user",
    email: "user@example.com",
    password: "$2a$10$z8hhcQFKd2XxNKizEzO.6u1sHHjB77ZDGKQznGDMFPQBDE0hSwcd6"
  },
  yoyo: {
    id: "yoyo",
    email: "yoyo@example.com",  // This email is intentionally in lower case
    password: "$2a$10$pk4H11wtqoEwjCCrV8ywaOar8hw7Ni/5Gelfx2LtFILqhFryRJDfC"
  },
  Yoyo: {  
    id: "yoyo",
    email: "YOYO@example.com",  // This email is intentionally in upper case
    password: "$2a$10$pk4H11wtqoEwjCCrV8ywaOar8hw7Ni/5Gelfx2LtFILqhFryRJDfC"
  }
};


describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("yoyo@example.com", testUsers);
    const expectedUserID = "yoyo";
    assert.deepEqual(user, testUsers[expectedUserID]);
  });

  it('should return undefined for non-existent email', function() {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.equal(user, null);
  });
});


