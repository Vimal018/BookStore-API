document.addEventListener('DOMContentLoaded', () => {
    const regForm = document.getElementById('reg-form');  // Get the form element
    const loginFormElement = document.getElementById('login-form-element'); // Get the form element
    const regButton = document.getElementById('reg-button');
    const loginButton = document.getElementById('login-button');
    const regMessage = document.getElementById('reg-message');
    const loginMessage = document.getElementById('login-message');

    regButton.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch('http://localhost:3000/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            regMessage.textContent = data.message;
            if (response.ok) {
                regForm.reset(); // Clear form on success
            }
        } catch (error) {
            regMessage.textContent = 'An error occurred.';
            console.error("Registration error:", error); // Log the error for debugging
        }
    });

    loginButton.addEventListener('click', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('http://localhost:3000/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token); // Store token
                loginMessage.textContent = "Login Successful!";
                loginFormElement.reset(); // Clear form on success
                // Redirect or update UI as needed
                console.log("Token:", data.token);

                
             window.location.href = 'dashboard.html'; // Redirect to a dashboard page
            } else {
                loginMessage.textContent = data.message;
            }
        } catch (error) {
            loginMessage.textContent = 'An error occurred.';
            console.error("Login error:", error); // Log the error
        }
    });


    // Example of how to use the token for a protected request (GET /protected-route)
    const protectedRouteButton = document.createElement('button'); // Create a button dynamically
    protectedRouteButton.textContent = "Access Protected Route";
    document.body.appendChild(protectedRouteButton); // Add to the page

    protectedRouteButton.addEventListener('click', async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("You must be logged in to access this route.");
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/protected-route', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}` // Include the token in the header
                }
            });

            const data = await response.json();
            alert(data.message); // Display the message from the protected route
        } catch (error) {
            console.error("Error accessing protected route:", error);
            alert("An error occurred.");
        }
    });

});