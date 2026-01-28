const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

/* ───────── INTERNAL HELPER ROUTES (DIRECT ACCESS) ───────── */

// Get all books (direct)
public_users.get('/books', function (req, res) {
  return res.status(200).json(books);
});

// Get book by ISBN (direct)
public_users.get('/books/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book);
});

// Get books by author (direct)
public_users.get('/books/author/:author', function (req, res) {
    const author = req.params.author.toLowerCase();
    const results = [];
  
    for (const isbn in books) {
      if (books[isbn].author.toLowerCase() === author) {
        results.push({ isbn, ...books[isbn] });
      }
    }
  
    if (results.length === 0) {
      return res.status(404).json({ message: "No books found for this author" });
    }
  
    return res.status(200).json(results);
});

// Get books by title (direct)
public_users.get('/books/title/:title', function (req, res) {
    const title = req.params.title.toLowerCase();
    const results = [];
  
    for (const isbn in books) {
      if (books[isbn].title.toLowerCase().includes(title)) {
        results.push({ isbn, ...books[isbn] });
      }
    }
  
    if (results.length === 0) {
      return res.status(404).json({ message: "No books found with this title" });
    }
  
    return res.status(200).json(results);
});

/* ───────── PUBLIC ROUTES (AXIOS-BASED WHERE REQUIRED) ───────── */

// Register new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!isValid(username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// Get the book list available in the shop (Axios + async/await)
public_users.get('/', async function (req, res) {
  try {
    const response = await axios.get('http://localhost:5000/books');
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching book list" });
  }
});

// Get book details based on ISBN (Axios + async/await)
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const response = await axios.get(
      `http://localhost:5000/books/isbn/${req.params.isbn}`
    );
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: "Book not found" });
    }
    return res.status(500).json({ message: "Error fetching book details" });
  }
});

// Get book details based on author (Axios + async/await)
public_users.get('/author/:author', async function (req, res) {
    const authorParam = req.params.author;
  
    try {
      const response = await axios.get(
        `http://localhost:5000/books/author/${encodeURIComponent(authorParam)}`
      );
      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ message: "No books found for this author" });
      }
      return res.status(500).json({ message: "Error fetching books by author" });
    }
});

// Get all books based on title (Axios + async/await)
public_users.get('/title/:title', async function (req, res) {
    const titleParam = req.params.title;
  
    try {
      const response = await axios.get(
        `http://localhost:5000/books/title/${encodeURIComponent(titleParam)}`
      );
      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ message: "No books found with this title" });
      }
      return res.status(500).json({ message: "Error fetching books by title" });
    }
});

// Get book reviews
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
