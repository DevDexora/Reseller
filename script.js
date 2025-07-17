document.addEventListener("DOMContentLoaded", () => {
    console.log("Panel script started.");

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
    const adminLoginButton = document.getElementById("admin-login-button");
    const logoutButton = document.getElementById("logout-button");
    const adminLogoutButton = document.getElementById("admin-logout-button");
    const buyButtons = document.querySelectorAll(".buy-button");
    const showUsersTab = document.getElementById("show-users-tab");
    const showKeysTab = document.getElementById("show-keys-tab");
    const adminUsersView = document.getElementById("admin-users-view");
    const adminKeysView = document.getElementById("admin-keys-view");
    const usersTableBody = document.querySelector("#users-table tbody");
    const keysTableBody = document.querySelector("#keys-table tbody");
    const addKeyButton = document.getElementById("add-key-button");
    const saveKeysButton = document.getElementById("save-keys-button");

    // ======== STATE & DATA ========
    const ADMIN_USER = "sylix";
    const ADMIN_PASS = "pass";
    const PURCHASE_LINK = "https://dexorapanel.mysellauth.com";

    let users = JSON.parse(localStorage.getItem('panelUsers')) || [];
    let keys = JSON.parse(localStorage.getItem('panelKeys')) || [
        { product: "Nexus", key: "NEX-DEMO-KEY-1234", duration: "30 Days" },
        { product: "Nexus Lite", key: "LITE-DEMO-KEY-5678", duration: "7 Days" },
    ];

    // ======== DATA MIGRATION & HELPERS ========
    // Ensures all user objects have the new properties for bans/timeouts
    const migrateUsers = () => {
        let needsSave = false;
        users.forEach(user => {
            if (user.isBanned === undefined) {
                user.isBanned = false;
                needsSave = true;
            }
            if (user.timeoutUntil === undefined) {
                user.timeoutUntil = null;
                needsSave = true;
            }
        });
        if (needsSave) {
            saveUsers();
        }
    };
    
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

    // ======== AUTHENTICATION & EVENT LISTENERS ========
    if (adminLoginButton) {
        adminLoginButton.addEventListener('click', () => {
            const password = prompt("Enter Admin Password:");
            if (password === ADMIN_PASS) {
                loginAdmin();
            } else if (password !== null) {
                alert("Incorrect admin password.");
            }
        });
    }

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value;
        const password = document.getElementById("login-password").value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            loginAdmin();
            return;
        }

        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            // ** NEW ** Check for ban or timeout status
            if (user.isBanned) {
                alert("Login failed: This account has been permanently banned.");
                return;
            }
            if (user.timeoutUntil && user.timeoutUntil > Date.now()) {
                const remainingMinutes = Math.ceil((user.timeoutUntil - Date.now()) / 60000);
                alert(`Login failed: This account is timed out. Please try again in ${remainingMinutes} minute(s).`);
                return;
            }

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
        if (username === ADMIN_USER) {
            alert("This username is reserved.");
            return;
        }

        // Add new user with default status fields
        users.push({ username, password, isBanned: false, timeoutUntil: null });
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
    showSignupLink.addEventListener("click", (e) => { e.preventDefault(); loginView.classList.add("hidden"); signupView.classList.remove("hidden"); });
    showLoginLink.addEventListener("click", (e) => { e.preventDefault(); signupView.classList.add("hidden"); loginView.classList.remove("hidden"); });
    buyButtons.forEach(button => button.addEventListener("click", () => { window.location.href = PURCHASE_LINK; }));

    // ======== ADMIN PANEL ========
    const renderAdminTabs = () => {
        renderUsers();
        renderKeys();
    };

    // -- ** NEW ** User Management Functions --
    const handleTimeoutUser = (index) => {
        const minutes = parseInt(prompt("Enter timeout duration in minutes:", "60"));
        if (!isNaN(minutes) && minutes > 0) {
            users[index].timeoutUntil = Date.now() + minutes * 60 * 1000;
            users[index].isBanned = false; // A timeout overrides a ban
            saveUsers();
            renderUsers();
        } else {
            alert("Invalid duration.");
        }
    };
    
    const handleBanUser = (index) => {
        if (confirm(`Are you sure you want to ban ${users[index].username}?`)) {
            users[index].isBanned = true;
            users[index].timeoutUntil = null; // A ban overrides a timeout
            saveUsers();
            renderUsers();
        }
    };

    const handlePardonUser = (index) => {
        users[index].isBanned = false;
        users[index].timeoutUntil = null;
        saveUsers();
        renderUsers();
    };

    const handleDeleteUser = (index) => {
        if (confirm(`Are you sure you want to PERMANENTLY DELETE ${users[index].username}? This cannot be undone.`)) {
            users.splice(index, 1);
            saveUsers();
            renderUsers();
        }
    };
    
    // -- Users Tab (Updated) --
    const renderUsers = () => {
        usersTableBody.innerHTML = "";
        if (users.length === 0) {
            usersTableBody.innerHTML = `<tr><td colspan="3">No users have signed up yet.</td></tr>`;
            return;
        }
        
        users.forEach((user, index) => {
            const row = document.createElement("tr");
            let status = "Active";
            let statusClass = "";

            if (user.isBanned) {
                status = "Banned";
                statusClass = "status-banned";
            } else if (user.timeoutUntil && user.timeoutUntil > Date.now()) {
                const remainingMinutes = Math.ceil((user.timeoutUntil - Date.now()) / 60000);
                status = `Timed Out (${remainingMinutes}m)`;
                statusClass = "status-timedout";
            }

            row.innerHTML = `
                <td>${user.username}</td>
                <td class="${statusClass}">${status}</td>
                <td class="user-actions">
                    <button class="btn-timeout" data-action="timeout" data-index="${index}">Timeout</button>
                    <button class="btn-ban" data-action="ban" data-index="${index}">Ban</button>
                    <button class="btn-pardon" data-action="pardon" data-index="${index}">Pardon</button>
                    <button class="btn-delete" data-action="delete" data-index="${index}">Delete</button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });

        // Add event listeners to the new buttons
        usersTableBody.querySelectorAll('.user-actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const index = parseInt(e.target.getAttribute('data-index'));
                if (action === 'timeout') handleTimeoutUser(index);
                if (action === 'ban') handleBanUser(index);
                if (action === 'pardon') handlePardonUser(index);
                if (action === 'delete') handleDeleteUser(index);
            });
        });
    };
    
    // -- Keys Tab (Unchanged) --
    const renderKeys = () => { /* ... Functionality is the same as before ... */ };
    addKeyButton.addEventListener("click", () => { /* ... Unchanged ... */ });
    saveKeysButton.addEventListener("click", () => { /* ... Unchanged ... */ });

    // Copy the unchanged Key Management functions from your previous script.js here
    // For brevity, I've left them out, but they are required for the panel to fully work.
    // START of Key Management Functions to Copy
    const renderKeysFn = () => {
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
                    renderKeysFn();
                }
            });
        });
    };
    renderKeys = renderKeysFn;
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
    // END of Key Management Functions to Copy

    showUsersTab.addEventListener("click", () => { adminUsersView.classList.remove("hidden"); adminKeysView.classList.add("hidden"); showUsersTab.classList.add("active"); showKeysTab.classList.remove("active"); });
    showKeysTab.addEventListener("click", () => { adminUsersView.classList.add("hidden"); adminKeysView.classList.remove("hidden"); showUsersTab.classList.remove("active"); showKeysTab.classList.add("active"); });

    // Initial script run
    migrateUsers();
});
