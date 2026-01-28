const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return !users.some((user) => user.username === username);
};

const authenticatedUser = (username,password)=>{
  return users.some(
    (user) => user.username === username && user.password === password
  );
};

//only registered users can login
regd_users.post("/login", (req,res) => {
const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login credentials" });
  }

  // Create JWT
  const accessToken = jwt.sign(
    { username },
    "fingerprint_customer",
    { expiresIn: "1h" }
  );

  // Save token in session
  req.session.authorization = {
    accessToken,
    username
  };

  return res.status(200).json({ message: "Login successful" });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review;

  if (!review) {
    return res.status(400).json({ message: "Review text is required" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  // username should be set at login time in the session
  const username = req.session.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // One review per user per book (matches your booksdb.js structure)
  books[isbn].reviews[username] = review;

  return res.status(200).json({ message: "Review added/updated successfully" });
});

// Delete a book review (logged in users can delete only their own reviews)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  if (!books[isbn]) {
    return res.status(404).json({ message: "Book not found" });
  }

  const username = req.session.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // Only delete if the user has a review on that book
  if (!books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({ message: "No review by this user to delete" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({ message: "Review deleted successfully" });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
