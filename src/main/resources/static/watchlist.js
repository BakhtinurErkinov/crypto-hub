const authGuard = document.getElementById('auth-guard');
const mainContent = document.getElementById('main-content');
const grid = document.getElementById('watchlist-grid');
let markets = {};

if(localStorage.getItem('cryptohub_token')) {
    authGuard.style.display = 'none';
    mainContent.style.display = 'block';
    initWatchlist();
}

async function initWatchlist() {
    try {
        const mRes = await apiFetch('/api/crypto/markets');
        const mData = await mRes.json();
        mData.forEach(m => markets[m.id] = m);
        
        await loadWatchlist();
    } catch(e) {
        showToast('Error loading data', 'error');
    }
}

async function loadWatchlist() {
    try {
        grid.innerHTML = '<div class="skeleton" style="height: 100px; width: 100%; grid-column: 1/-1;"></div>';
        const res = await apiFetch('/api/watchlist');
        const list = await res.json();
        
        grid.innerHTML = '';
        if(list.length === 0) {
            grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;">
                <i class="far fa-star"></i>
                <p>Your watchlist is empty.</p>
            </div>`;
            return;
        }

        list.forEach(item => {
            const coin = markets[item.coinId] || { name: item.coinId, symbol: item.coinId, current_price: 0, price_change_percentage_24h: 0 };
            
            const changeClass = coin.price_change_percentage_24h >= 0 ? 'text-positive' : 'text-negative';
            const changeIcon = coin.price_change_percentage_24h >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.position = 'relative';
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
                if(!e.target.closest('button')) {
                    window.location.href = `crypto.html?id=${item.coinId}`;
                }
            };

            card.innerHTML = `
                <button class="btn btn-outline" style="position: absolute; top: 12px; right: 12px; padding: 4px 8px; border: none;" onclick="removeWatchlist('${item.coinId}')">
                    <i class="fas fa-times"></i>
                </button>
                <div class="coin-cell" style="margin-bottom: 16px;">
                    ${coin.image ? `<img src="${coin.image}" class="coin-icon">` : ''}
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600;">${coin.name}</span>
                        <span class="coin-symbol" style="margin-left: 0;">${coin.symbol.toUpperCase()}</span>
                    </div>
                </div>
                <h3>$${coin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</h3>
                <p class="${changeClass}" style="font-size: 14px; margin-top: 8px;">
                    <i class="fas ${changeIcon}"></i> ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </p>
            `;
            grid.appendChild(card);
        });

    } catch(e) {
        console.error(e);
        showToast('Failed to load watchlist', 'error');
    }
}

async function addWatchlist() {
    const input = document.getElementById('add-coin-input');
    const coinId = input.value.toLowerCase().trim();
    if(!coinId) return;

    try {
        await apiFetch(`/api/watchlist/${coinId}`, { method: 'POST' });
        showToast('Added to watchlist', 'success');
        input.value = '';
        loadWatchlist();
    } catch(e) {
        showToast('Failed to add coin', 'error');
    }
}

async function removeWatchlist(coinId) {
    if(!confirm('Remove from watchlist?')) return;
    try {
        await apiFetch(`/api/watchlist/${coinId}`, { method: 'DELETE' });
        showToast('Removed from watchlist', 'success');
        loadWatchlist();
    } catch(e) {
        showToast('Failed to remove coin', 'error');
    }
}
