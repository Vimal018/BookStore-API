const express = require('express');
const app = express();
const port = 3000;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
app.use(express.json()); // Enable parsing JSON request bodies
require('dotenv').config();

const cors = require('cors'); // Import cors
// ... other imports


app.use(cors()); // Enable CORS for all origins (for development)

const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500']; // Add your frontend origins

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) { // Allow requests with no origin (like Postman)
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}));


// ... your routes
const bookData = [ // Sample book data (replace with actual database or API)
  { isbn: '978-0321765723', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', reviews: [
    { username: 'john_doe', reviewText: 'An epic adventure!' },
    { username: 'jane_doe', reviewText: 'A must-read fantasy classic.' }
] },
  { isbn: '978-0743273565', title: 'Pride and Prejudice', author: 'Jane Austen', reviews: [] },
  { isbn: '978-0451526532', title: '1984', author: 'George Orwell', reviews: [] },
  // ... more books
];

const users = []; // Sample user data (replace with database)

// Helper function to find a book by ISBN
const findBookByISBN = (isbn) => bookData.find(book => book.isbn === isbn);

// Helper function to find books by author
const findBooksByAuthor = (author) => bookData.filter(book => book.author === author);

// Helper function to find books by title (case-insensitive)
const findBooksByTitle = (title) => bookData.filter(book => book.title.toLowerCase().includes(title.toLowerCase()));

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("JWT_SECRET environment variable is not set!");
    process.exit(1); // Exit if the secret is not set
}

// Middleware for JWT authentication (protect routes)
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Invalid token
            }

            req.user = user; // Add user info to request
            next(); // Proceed to the next middleware/route handler
        });
    } else {
        res.sendStatus(401); // No token provided
    }
};


// Task 1: Get book list
app.get('/books', (req, res) => {
  res.json(bookData.map(book => ({ isbn: book.isbn, title: book.title, author: book.author }))); // Simplified book list
});

// Task 2: Get book by ISBN
app.get('/books/isbn/:isbn', (req, res) => {
  const book = findBookByISBN(req.params.isbn);
  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

// Task 3: Get books by author
app.get('/books/author/:author', (req, res) => {
    const books = findBooksByAuthor(req.params.author);
    if(books.length > 0){
        res.json(books);
    } else {
        res.status(404).json({ message: 'No books found by this author' });
    }
});

// Task 4: Get books by title
app.get('/books/title/:title', (req, res) => {
    const books = findBooksByTitle(req.params.title);
    if(books.length > 0){
        res.json(books);
    } else {
        res.status(404).json({ message: 'No books found with this title' });
    }
});


// Task 5: Get book review (for a specific book by ISBN)
app.get('/books/:isbn/reviews', (req, res) => {
  const book = findBookByISBN(req.params.isbn);
  if (book) {
    res.json(book.reviews);
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
});

// Task 6: Register new user (with password hashing)
app.post('/users/register', async (req, res) => {
    console.log("Registration request received:", req.body); // Log the request body

    const { username, password } = req.body;

    if (!username || !password) {
        console.log("Missing username or password"); // Log if input is missing
        return res.status(400).json({ message: 'Username and password are required' });
    }

    if (users.find(user => user.username === username)) {
        console.log("Username already exists"); // Log if username exists
        return res.status(400).json({ message: 'Username already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users.push({ username, password: hashedPassword });
        console.log("User registered successfully:", username); // Log on success
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Error during registration:", error); // VERY IMPORTANT: Log the error object
        res.status(500).json({ message: 'Error registering user' }); // Send a 500 response
    }
});

// Task 7: Login as a registered user (with password comparison)
app.post('/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    try {
        if (user && await bcrypt.compare(password, user.password)) {
            // Generate JWT (Corrected - expiresIn is important)
            const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' }); // Example: 1-hour expiration

            // Send JWT in the response (Corrected)
            res.json({ token }); // Send the token back to the client
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Login error' }); // Important: Handle errors!
    }
});


// Task 8: Add/Modify book review (requires authentication)
app.post('/books/:isbn/reviews', authenticateJWT, async (req, res) => {
    const { reviewText } = req.body;
    const username = req.user.username; // Get username from JWT
    const book = findBookByISBN(req.params.isbn);

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    try {
        const existingReviewIndex = book.reviews.findIndex(review => review.username === username);

        if (existingReviewIndex !== -1) {
            book.reviews[existingReviewIndex].reviewText = reviewText; // Modify existing review
        } else {
            book.reviews.push({ username, reviewText }); // Add new review
        }

        res.json({ message: 'Review added/modified successfully' });
    } catch (error) {
        console.error("Error adding/modifying review:", error);
        res.status(500).json({ message: 'Error adding/modifying review' }); // Handle errors
    }
});

// Task 9: Delete book review (requires authentication)
app.delete('/books/:isbn/reviews', authenticateJWT, (req, res) => {  // Changed route to not include username
    const username = req.user.username;
    const book = findBookByISBN(req.params.isbn);

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    try {
        const reviewIndex = book.reviews.findIndex(review => review.username === username);

        if (reviewIndex !== -1) {
            book.reviews.splice(reviewIndex, 1);
            res.json({ message: 'Review deleted successfully' });
        } else {
            return res.status(404).json({ message: 'Review not found for this user' }); // More specific message
        }
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: 'Error deleting review' });
    }
});



// Task 10: Get all books (async/await)
app.get('/books-async', async (req, res) => {
  try {
    res.json(bookData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Task 11: Search by ISBN (Promises)
app.get('/books-isbn-promise/:isbn', (req, res) => {
  return new Promise((resolve, reject) => {
        const book = findBookByISBN(req.params.isbn)
        if(book){
            resolve(book)
        } else {
            reject({message: "Book not found"})
        }
  }).then(book => res.json(book)).catch(error => res.status(404).json(error));
});

// Task 12: Search by Author
app.get('/books-author/:author', (req, res) => {
    const books = findBooksByAuthor(req.params.author);
    if(books.length > 0){
        res.json(books);
    } else {
        res.status(404).json({ message: 'No books found by this author' });
    }
});

// Task 13: Search by Title
app.get('/books-title/:title', (req, res) => {
    const books = findBooksByTitle(req.params.title);
    if(books.length > 0){
        res.json(books);
    } else {
        res.status(404).json({ message: 'No books found with this title' });
    }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

