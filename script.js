document.addEventListener("DOMContentLoaded", () => {
    // ======== DOM ELEMENTS ========
    const authContainer = document.getElementById("auth-container");
    const loginView = document.getElementById("login-view");
    const signupView = document.getElementById("signup-view");
    const resellerPanel = document.getElementById("reseller-panel");
    const adminPanel = document.getElementById("admin-panel");

    const showSignupLink = document.getElementById("show-signup");
    const showLoginLink = document.getElementById("show-login");

    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const adminLoginButton = document.getElementById("admin-login-button"); // New button

    const logoutButton = document.getElementById("logout-button");
    const adminLogoutButton = document.getElementById("admin-logout-button");

    const buyButtons = document.querySelectorAll(".buy-button");

    // Admin Panel Elements
    const showUsersTab = document.getElementById("show-users-tab");
    const showKeysTab = document.getElementById("show-keys-tab");
    const adminUsersView = document.getElementById("admin-users-view");
    const adminKeysView = document.getElementById("admin-keys-view");
    const usersTableBody = document.querySelector("#users-table tbody");
    const keysTableBody = document.querySelector("#keys-table tbody");
    const addKeyButton = document.getElementById("add-key-button");
    const saveKeysButton = document.getElementById("save-keys-button");

    // ======== STATE & DATA ========
    // ⚠️ Admin credentials updated as requested.
    const ADMIN_USER = "sylix";
    const ADMIN_PASS = "pass"; 
    const PURCHASE_LINK = "https://dexorapanel.mysellauth.com";

    // Initialize data from localStorage or create empty arrays
    let users = JSON.parse(localStorage.getItem('panelUsers')) || [];
    let keys = JSON.parse(localStorage.getItem('panelKeys')) || [
        { product: "Nexus", key: "NEX-DEMO-KEY-1234", duration: "30 Days" },
        { product: "Nexus Lite", key: "LITE-DEMO-KEY-5678", duration: "7 Days" },
    ];

    // ======== HELPER FUNCTIONS ========
    const saveUsers = () => localStorage.setItem('panelUsers', JSON.stringify(users));
    const saveKeys = () => localStorage.setItem('panelKeys', JSON.stringify(keys));

    const showView = (view) => {
        authContainer.classList.add("hidden");
        resellerPanel.classList.add("hidden");
        adminPanel.classList.add("hidden");
        view.classList.remove("hidden");
    };

    const loginAdmin = () => {
        alert("Admin login successful!");
        showView(adminPanel);
        renderAdminTabs();
    };

    // ======== AUTHENTICATION ========
    
    // Logic for the new Admin Login button
    adminLoginButton.addEventListener('click', () => {
        const password = prompt("Enter Admin Password:");
        if (password === ADMIN_PASS) {
            loginAdmin();
        } else if (password !== null) { // Check if user pressed Cancel
            alert("Incorrect admin password.");
        }
    });
    
    // Logic for the main login form
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        // Check for Admin login using the form
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            loginAdmin();
            return;
        }

        // Check for Reseller login
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            alert("Login successful!");
            document.getElementById("reseller-username").textContent = user.username;
            showView(resellerPanel);
        } else {
            alert("Invalid username or password.");
        }
    });

    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("signup-username").value;
        const password = document.getElementById("signup-password").value;

        if (users.some(u => u.username === username)) {
            alert("Username already exists.");
            return;
        }
        
        // Prevent using the admin username for signup
        if (username === ADMIN_USER) {
            alert("This username is reserved.");
            return;
        }

        users.push({ username, password });
        saveUsers();
        alert("Sign up successful! Please log in.");
        loginView.classList.remove("hidden");
        signupView.classList.add("hidden");
        signupForm.reset();
    });

    const logout = () => {
        showView(authContainer);
        loginForm.reset();
    };

    logoutButton.addEventListener("click", logout);
    adminLogoutButton.addEventListener("click", logout);

    // ======== VIEW TOGGLING ========
    showSignupLink.addEventListener("click", (e) => {
        e.preventDefault();
        loginView.classList.add("hidden");
        signupView.classList.remove("hidden");
    });

    showLoginLink.addEventListener("click", (e) => {
        e.preventDefault();
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
    });


    // ======== RESELLER PANEL ========
    buyButtons.forEach(button => {
        button.addEventListener("click", () => {
            console.log("Redirecting to purchase page...");
            window.location.href = PURCHASE_LINK;
        });
    });


    // ======== ADMIN PANEL ========
    const renderAdminTabs = () => {
        renderUsers();
        renderKeys();
    };
    
    // -- Users Tab
    const renderUsers = () => {
        usersTableBody.innerHTML = "";
        if (users.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="2">No users have signed up yet.</td></tr>`;
        } else {
            users.forEach(user => {
                const row = `<tr><td>${user.username}</td><td>${user.password}</td></tr>`;
                usersTableBody.innerHTML += row;
            });
        }
    };

    // -- Keys Tab
    const renderKeys = () => {
        keysTableBody.innerHTML = "";
        if (keys.length === 0) {
            keysTableBody.innerHTML = `<tr><td colspan="4">No keys found. Add one!</td></tr>`;
        } else {
            keys.forEach((key, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><input type="text" value="${key.product}" data-field="product"></td>
                    <td><input type="text" value="${key.key}" data-field="key"></td>
                    <td><input type="text" value="${key.duration}" data-field="duration"></td>
                    <td><button class="delete-key-button" data-index="${index}">Delete</button></td>
                `;
                keysTableBody.appendChild(row);
            });
        }
        document.querySelectorAll('.delete-key-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                if (confirm('Are you sure you want to delete this key?')) {
                    keys.splice(index, 1);
                    saveKeys();
                    renderKeys();
                }
            });
        });
    };

    addKeyButton.addEventListener("click", () => {
        const newKey = { product: "New Product", key: "NEW-KEY-XXXX-XXXX", duration: "30 Days" };
        keys.push(newKey);
        renderKeys();
    });

    saveKeysButton.addEventListener("click", () => {
        const newKeys = [];
        const rows = keysTableBody.querySelectorAll("tr");
        rows.forEach(row => {
            const inputs = row.querySelectorAll("input");
            if (inputs.length > 0) {
                const keyData = {
                    product: inputs[0].value,
                    key: inputs[1].value,
                    duration: inputs[2].value
                };
                newKeys.push(keyData);
            }
        });
        keys = newKeys;
        saveKeys();
        alert("All key changes have been saved!");
        renderKeys();
    });

    showUsersTab.addEventListener("click", () => {
        adminUsersView.classList.remove("hidden");
        adminKeysView.classList.add("hidden");
        showUsersTab.classList.add("active");
        showKeysTab.classList.remove("active");
    });

    showKeysTab.addEventListener("click", () => {
        adminUsersView.classList.add("hidden");
        adminKeysView.classList.remove("hidden");
        showUsersTab.classList.remove("active");
        showKeysTab.classList.add("active");
    });
});
