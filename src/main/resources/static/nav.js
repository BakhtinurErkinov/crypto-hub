document.write(`
<nav id="main-nav">
    <a href="index.html" class="nav-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#paint0_linear)"/>
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="url(#paint0_linear)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
                <linearGradient id="paint0_linear" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#00d4aa"/>
                    <stop offset="1" stop-color="#7c5cfc"/>
                </linearGradient>
            </defs>
        </svg>
        CryptoHub
    </a>
    <div class="nav-links">
        <a href="index.html" id="nav-dashboard">Dashboard</a>
        <a href="portfolio.html" id="nav-portfolio">Portfolio</a>
        <a href="watchlist.html" id="nav-watchlist">Watchlist</a>
        <a href="converter.html" id="nav-converter">Converter</a>
        <a href="risk.html" id="nav-risk">Risk</a>
        <a href="advisor.html" id="nav-advisor">Advisor</a>
        <a href="game.html" id="nav-game">Game</a>
    </div>
    <div class="auth-buttons" id="nav-auth-container">
        <!-- Injected via JS -->
    </div>
</nav>
<div class="toast-container" id="toast-container"></div>
`);

// Add FontAwesome for icons globally
const faLink = document.createElement('link');
faLink.rel = 'stylesheet';
faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(faLink);

document.addEventListener('DOMContentLoaded', () => {
    // Highlight active link
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const navLink = document.querySelector(`.nav-links a[href="${page}"]`);
    if(navLink) navLink.classList.add('active');

    updateNavAuth();
});

function updateNavAuth() {
    const container = document.getElementById('nav-auth-container');
    const token = localStorage.getItem('cryptohub_token');
    const username = localStorage.getItem('cryptohub_user');

    if (token && username) {
        container.innerHTML = `
            <div class="user-badge">
                <div class="user-avatar">${username.charAt(0).toUpperCase()}</div>
                <span>${username}</span>
            </div>
            <button class="btn btn-outline" onclick="logout()" style="padding: 6px 12px; font-size: 12px;">Logout</button>
        `;
    } else {
        container.innerHTML = `
            <a href="auth.html" class="btn btn-outline">Login</a>
            <a href="auth.html?mode=register" class="btn btn-primary">Register</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('cryptohub_token');
    localStorage.removeItem('cryptohub_user');
    window.location.href = 'index.html';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if(type === 'success') icon = 'fa-check-circle';
    if(type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        if(container.contains(toast)) {
            toast.remove();
        }
    }, 3500);
}

// Fetch Wrapper to auto-add JWT
async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('cryptohub_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('cryptohub_token');
            localStorage.removeItem('cryptohub_user');
            window.location.href = 'auth.html';
            throw new Error("Unauthorized");
        }
        return response;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}
