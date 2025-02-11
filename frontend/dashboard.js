document.addEventListener('DOMContentLoaded', () => {
    const bookList = document.getElementById('book-list');
    const addReviewButton = document.getElementById('add-review-button');
    const deleteReviewButton = document.getElementById('delete-review-button');
    const isbnInput = document.getElementById('isbn-input');
    const reviewTextInput = document.getElementById('review-text-input');

    const authLinks = document.getElementById('auth-links');
    let isLoggedIn = localStorage.getItem('token') !== null;

    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    updateAuthLinks();

    function updateAuthLinks() {
        authLinks.innerHTML = '';

        if (isLoggedIn) {
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.id = 'logout-link';
            logoutLink.textContent = 'Logout';
            authLinks.appendChild(logoutLink);

            logoutLink.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('token');
                isLoggedIn = false;
                updateAuthLinks();
                alert("Logged out successfully!");
                window.location.href = 'index.html';
            });
        }
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You are not logged in. Please log in.");
        window.location.href = 'index.html';
        return;
    }

    const userList = document.getElementById('user-list');

    // Sample data (replace with your actual data fetching)
    const books = [
        { isbn: '978-0321765723', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien' },
        { isbn: '978-0743273565', title: 'Pride and Prejudice', author: 'Jane Austen' },
    ];

    const users = [
        { username: 'user1' },
        { username: 'user2' },
    ];

    function displayBooks(books) {
        bookList.innerHTML = '';
        books.forEach(book => {
            const li = document.createElement('li');
            li.textContent = `${book.title} by ${book.author} (ISBN: ${book.isbn})`;
            bookList.appendChild(li);
        });
    }

    function displayUsers(users) {
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user.username;
            userList.appendChild(li);
        });
    }

    displayBooks(books);
    displayUsers(users);

    fetchBookData();

    async function fetchBookData() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://localhost:3000/books', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const bookData = await response.json();
                displayBookData(bookData);
            } else {
                const errorData = await response.json();
                console.error("Error fetching book data:", response.status, errorData);
                alert(errorData.message || "Error fetching book data. Please try again later.");

            }
        } catch (error) {
            console.error("Error fetching book data:", error);
            alert("A network error occurred. Please check your connection.");

        }
    }

    function displayBookData(bookData) {
        const bookList = document.getElementById('book-list');
        bookList.innerHTML = '';

        bookData.forEach(book => {
            const bookItem = document.createElement('li');
            bookItem.textContent = `${book.title} by ${book.author} (ISBN: ${book.isbn})`;
            bookList.appendChild(bookItem);
        });
    }

    addReviewButton.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        const isbn = isbnInput.value;
        const reviewText = reviewTextInput.value;

        if (!token) {
            alert("You must be logged in to add a review.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/books/${isbn}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reviewText })
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    fetchBookData();
                    reviewTextInput.value = '';
                    alert("Review added successfully!");
                } else {
                    const html = await response.text();
                    console.error("Server returned HTML:", html);
                    alert("An error occurred. Please try again later.");
                }
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Error adding review. Please try again later.");
                console.error("Error adding review:", response.status, errorData);
            }
        } catch (error) {
            console.error("Error adding review:", error);
            alert("A network error occurred. Please check your connection.");
        }
    });

    deleteReviewButton.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        const isbn = isbnInput.value;

        if (!token) {
            alert("You must be logged in to delete a review.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/books/${isbn}/reviews`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    fetchBookData();
                    alert("Review deleted successfully!");
                } else {
                    const html = await response.text();
                    console.error("Server returned HTML:", html);
                    alert("An error occurred. Please try again later.");
                }
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Error deleting review. Please try again later.");
                console.error("Error deleting review:", response.status, errorData);
            }
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("A network error occurred. Please check your connection.");
        }
    });
});