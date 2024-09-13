const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql2 = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { check, validationResult } = require('express-validator');

// Initialize app
const app = express();

// Middleware for session
app.use(session({
    secret: 'dv28b978gd6p343hg7bc[4hhj[0',
    resave: false,
    saveUninitialized: false,
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
dotenv.config();
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the  folder
app.use(express.static(__dirname));


// MySQL connection setup
const db = mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'jackieexpense_tracker' 
});

db.connect((err) => {
    if (err) return console.log("Error connecting to MySQL:", err);

    console.log("Connected to MySQL:", db.threadId);

    
        // Create the users table
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                fullname VARCHAR(50) NOT NULL,
                username VARCHAR(50) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            )
        `;

        db.query(createUsersTable, (err) => {
            if (err) return console.log("Error creating table:", err);

            console.log("Users table checked/created");
        });
    });


// Route to serve the registration form (HTML file)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Registration handler with input validation
app.post('/register', [
    check('email').isEmail().withMessage('Please provide a valid email address.'),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric.')
], (req, res) => {
    console.log("Request body:", req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, username, email, password } = req.body;

    const usersQuery = `SELECT * FROM users WHERE email = ?`;
    db.query(usersQuery, [email], (err, data) => {
        if (err) {
            console.error("Error checking user: ", err.message);
            return res.status(500).json("Error checking user");
        }
        if (data.length) {
            console.log("User already exists with email:", email);
            return res.status(409).json("User already exists");
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const newUserQuery = `INSERT INTO users (fullname, username, email, password) VALUES (?, ?, ?, ?)`;
        const values = [fullname, username, email, hashedPassword];

        db.query(newUserQuery, values, (err) => {
            if (err) {
                console.error("Error creating user: ", err.message);
                return res.status(500).json("Error creating user");
            }
            console.log("User created successfully:", email);
            return res.status(201).json("User created successfully");
        });
    });
});

// Route to serve the login form (HTML file)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Login handler
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const usersQuery = `SELECT * FROM users WHERE email = ?`;
        db.query(usersQuery, [email], (err, data) => {
            if (err) return res.status(500).json("Error checking user");
            if (data.length === 0) return res.status(404).json("User not found");

            const isPasswordValid = bcrypt.compareSync(password, data[0].password);
            if (!isPasswordValid) return res.status(400).json("Invalid email or password");

            // Save user info in session
            req.session.userId = data[0].id; // Save the user ID in the session
            req.session.username = data[0].username; // Optionally store the username in the session

            return res.status(200).json("Login successful");
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to serve the add_expense form (HTML file)
app.get('/add_expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'add_expense.html'));
});
// Add a new expense
app.post('/add_expense', (req, res) => {
    const { userId, description, amount, category, date } = req.body;
    const query = `INSERT INTO expenses (user_id, description, amount, category, date) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [userId, description, amount, category, date], (err) => {
        if (err) {
            console.error("Error adding expense:", err);
            return res.status(500).json({ message: "Error adding expense" });
        }
        res.status(201).json({ message: "Expense added successfully" });
    });
});

// Route to serve the view_expense form (HTML file)
app.get('/view_expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'view_expense.html'));
});
// Get all expenses for a user
app.get('/expenses/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `SELECT * FROM expenses WHERE user_id = ?`;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching expenses:", err);
            return res.status(500).json({ message: "Error fetching expenses" });
        }
        res.json(results);
    });
});

// Route to serve the edit_expense form (HTML file)
app.get('/edit_expense', (req, res) => {
    res.sendFile(path.join(__dirname, 'edit_expense.html'));
});

// Edit an expense
app.put('/expenses/:id', (req, res) => {
    const { id } = req.params;
    const { description, amount, category, date } = req.body;
    const query = `UPDATE expenses SET description = ?, amount = ?, category = ?, date = ? WHERE id = ?`;
    db.query(query, [description, amount, category, date, id], (err) => {
        if (err) {
            console.error("Error updating expense:", err);
            return res.status(500).json({ message: "Error updating expense" });
        }
        res.json({ message: "Expense updated successfully" });
    });
});

// Capture index.html file
// Route to serve the index.html form (HTML file)
app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// Get all expenses
app.get('/expenses', (req, res) => {
    const query = 'SELECT * FROM expenses ORDER BY date DESC'; // Fetch expenses sorted by date
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching expenses:", err);
            return res.status(500).json({ message: "Error fetching expenses" });
        }
        res.json(results);
    });
});


// Delete an expense
app.delete('/expenses/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM expenses WHERE id = ?`;
    db.query(query, [id], (err) => {
        if (err) {
            console.error("Error deleting expense:", err);
            return res.status(500).json({ message: "Error deleting expense" });
        }
        res.json({ message: "Expense deleted successfully" });
    });
});


// Route to serve the dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Get summary statistics
app.get('/dashboard/summary/:userId', (req, res) => {
    const { userId } = req.params;

    // Queries to get total expenses, total income, and average spending
    const totalExpensesQuery = `SELECT SUM(amount) AS total_expenses FROM expenses WHERE user_id = ?`;
    const totalIncomeQuery = `SELECT SUM(amount) AS total_income FROM income WHERE user_id = ?`; // Assuming you have an income table
    const averageSpendingQuery = `SELECT AVG(amount) AS average_spending FROM expenses WHERE user_id = ?`;

    db.query(totalExpensesQuery, [userId], (err, totalExpensesResults) => {
        if (err) return res.status(500).json({ message: "Error fetching total expenses" });

        db.query(totalIncomeQuery, [userId], (err, totalIncomeResults) => {
            if (err) return res.status(500).json({ message: "Error fetching total income" });

            db.query(averageSpendingQuery, [userId], (err, averageSpendingResults) => {
                if (err) return res.status(500).json({ message: "Error fetching average spending" });

                res.json({
                    totalExpenses: totalExpensesResults[0].total_expenses,
                    totalIncome: totalIncomeResults[0].total_income,
                    averageSpending: averageSpendingResults[0].average_spending
                });
            });
        });
    });
});

// Get recent expenses
app.get('/dashboard/recent-expenses/:userId', (req, res) => {
    const { userId } = req.params;
    const query = `SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC LIMIT 5`; // Adjust limit as needed
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching recent expenses:", err);
            return res.status(500).json({ message: "Error fetching recent expenses" });
        }
        res.json(results);
    });
});
// Route to serve the logout button
app.get('/logout', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Capture log out.
app.post('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            // Handle error during session destruction
            return res.status(500).json({ message: 'Logout failed. Please try again.' });
        }
        // Clear the session cookie
        res.clearCookie('connect.sid'); // 'connect.sid' is the default session cookie name
        res.status(200).json({ message: 'Logged out successfully' });
    });
});


// Start the server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

