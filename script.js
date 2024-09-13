  // Capture the register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const fullname = formData.get('fullname');
            const username = formData.get('username');
            const email = formData.get('email');
            const password = formData.get('password');
    
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fullname, username, email, password })
                });
    
                if (response.ok) {
                    alert('Registration successful');
                    window.location.href = '/login';  // Redirect to login page after registration
                } else {
                    const errorData = await response.json();
                    alert('Registration failed: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration.');
            }
        });
    }

    // Capture the login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
    
            const formData = new FormData(loginForm);
            const email = formData.get('email');
            const password = formData.get('password');
    
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
    
                if (response.ok) {
                    alert('Login successful');
                    window.location.href = '/dashboard';  // Redirect to dashboard on success
                } else {
                    const errorData = await response.json();
                    alert('Login failed: ' + (errorData.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during login.');
            }
        });
    }
    
    // Capture add expense form
    const addExpenseForm = document.getElementById('add-expense-form');
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const description = formData.get('description');
            const amount = formData.get('amount');
            const category = formData.get('category');
            const date = formData.get('date');
            
            try {
                const response = await fetch('/add_expense', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount, category, date, userId: 1 }) // assuming user ID 1 for now
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    // Optionally, redirect to the expenses list page
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("Error adding expense:", error);
            }
        });
    }

    // Capture edit expense form
    const editExpenseForm = document.getElementById('edit-expense-form');
    if (editExpenseForm) {
        editExpenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const expenseId = document.getElementById('expense-id').value;
            const description = document.getElementById('description').value;
            const amount = document.getElementById('amount').value;
            const category = document.getElementById('category').value;
            const date = document.getElementById('date').value;

            try {
                const response = await fetch(`/expenses/${expenseId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description, amount, category, date })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/view_expense.html'; // Redirect after successful edit
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error("Error updating expense:", error);
            }
        });
    }

    // Capture view expenses
    const userId = 1; // You would dynamically get the logged-in user ID here
    fetch(`/expenses/${userId}`)
        .then(response => response.json())
        .then(expenses => {
            const expenseList = document.getElementById('expenses-list');
            
            if (expenses.length === 0) {
                expenseList.innerHTML = '<p>No expenses found.</p>';
                return;
            }

            expenses.forEach(expense => {
                const expenseItem = document.createElement('div');
                expenseItem.innerHTML = `
                    <p>Description: ${expense.description}</p>
                    <p>Amount: ${expense.amount}</p>
                    <p>Category: ${expense.category}</p>
                    <p>Date: ${new Date(expense.date).toLocaleDateString()}</p>
                    <button class="delete-expense" data-id="${expense.id}">Delete</button>
                    <hr>
                `;
                expenseList.appendChild(expenseItem);
            });

            // Add event listener to each delete button
            const deleteButtons = document.querySelectorAll('.delete-expense');
            deleteButtons.forEach(button => {
                button.addEventListener('click', async (e) => {
                    const expenseId = e.target.getAttribute('data-id');

                    // Confirm before deleting
                    if (confirm('Are you sure you want to delete this expense?')) {
                        try {
                            const response = await fetch(`/expenses/${expenseId}`, {
                                method: 'DELETE'
                            });
                            const result = await response.json();

                            if (response.ok) {
                                alert(result.message);
                                window.location.reload(); // Reload the page after deletion
                            } else {
                                alert('Error: ' + result.message);
                            }
                        } catch (error) {
                            console.error('Error deleting expense:', error);
                        }
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error fetching expenses:', error);
        });

    // Capture Index.html file
    const indexTable = document.querySelector('#expenses-table tbody');
    if (indexTable) {
        fetch('/expenses')
            .then(response => response.json())
            .then(expenses => {
                indexTable.innerHTML = ''; // Clear existing rows

                expenses.forEach(expense => {
                    const row = document.createElement('tr');

                    row.innerHTML = `
                        <td>${new Date(expense.date).toLocaleDateString()}</td>
                        <td>${expense.category}</td>
                        <td>$${expense.amount.toFixed(2)}</td>
                        <td>${expense.description}</td>
                        <td>
                            <button onclick="editExpense(${expense.id})">Edit</button>
                            <button onclick="deleteExpense(${expense.id})">Delete</button>
                        </td>
                    `;

                    indexTable.appendChild(row);
                });
            })
            .catch(error => {
                console.error("Error loading expenses:", error);
            });
    }

    function editExpense(id) {
        window.location.href = `edit_expense.html?id=${id}`;
    }

    function deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            fetch(`/expenses/${id}`, {
                method: 'DELETE'
            }).then(response => {
                if (response.ok) {
                    alert('Expense deleted successfully');
                    location.reload(); // Reload the page to reflect changes
                } else {
                    alert('Error deleting expense');
                }
            }).catch(error => {
                console.error("Error deleting expense:", error);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const dashboardUserId = 1; // You would dynamically get the logged-in user ID here

        // Fetch summary statistics
        try {
            const summaryResponse = await fetch(`/dashboard/summary/${dashboardUserId}`);
            const summaryData = await summaryResponse.json();
            document.getElementById('total-expenses').textContent = `$${summaryData.totalExpenses.toFixed(2)}`;
            document.getElementById('total-income').textContent = `$${summaryData.totalIncome.toFixed(2)}`;
            document.getElementById('average-spending').textContent = `$${summaryData.averageSpending.toFixed(2)}`;
        } catch (error) {
            console.error("Error fetching summary data:", error);
        }

        // Fetch recent expenses
        try {
            const recentExpensesResponse = await fetch(`/dashboard/recent-expenses/${dashboardUserId}`);
            const recentExpenses = await recentExpensesResponse.json();
            const tableBody = document.getElementById('recent-expenses').querySelector('tbody');
            recentExpenses.forEach(expense => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.category}</td>
                <td>$${expense.amount.toFixed(2)}</td>
            `;
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error fetching recent expenses:", error);
        }
    });

async function renderChart() {
    const chartResponse = await fetch(`/dashboard/expenses-by-category/${dashboardUserId}`);
    const chartData = await chartResponse.json();

    const ctx = document.getElementById('expenses-chart').getContext('2d');
    const expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.categories,
            datasets: [{
                label: 'Expenses by Category',
                data: chartData.amounts,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
 // Logout functionality
const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            fetch('/logout', { method: 'POST' })
                .then(() => {
                    alert('You have been logged out.');
                    window.location.href = '/login'; // Redirect to login page after logout
                })
                .catch(error => {
                    console.error('Logout failed:', error);
                });
        });
    }