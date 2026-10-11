const tableBody = document.getElementById('crypto-table-body');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const refreshTimerEl = document.getElementById('refresh-timer');

let allCoins = [];
let refreshInterval;
let secondsLeft = 60;

async function loadMarkets() {
    try {
        if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        const res = await apiFetch('/api/crypto/markets');
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Server returned ${res.status}`);
        }
        
        const data = await res.json();
        
        // Check if the response is actually an array (valid market data)
        if (!Array.isArray(data)) {
            throw new Error(data.error || 'Invalid response format');
        }
        
        allCoins = data;
        updateGlobalStats(allCoins);
        renderTable(allCoins);
        
        if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        resetTimer();
    } catch (e) {
        console.error('loadMarkets error:', e);
        if (typeof showToast === 'function') {
            showToast(e.message || 'Failed to load market data', 'error');
        }
        if (refreshBtn) refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        
        // If we have no data at all, show error state instead of skeleton
        if (allCoins.length === 0) {
            showErrorState(e.message || 'Failed to load market data');
        }
        resetTimer();
    }
}

function showErrorState(message) {
    // Clear skeleton loaders from stats
    const mcapEl = document.getElementById('global-mcap');
    const volEl = document.getElementById('global-vol');
    const topEl = document.getElementById('top-performer');
    
    if (mcapEl) {
        mcapEl.textContent = '—';
        mcapEl.classList.remove('skeleton', 'skeleton-title');
    }
    if (volEl) {
        volEl.textContent = '—';
        volEl.classList.remove('skeleton', 'skeleton-title');
    }
    if (topEl) {
        topEl.textContent = '—';
        topEl.classList.remove('skeleton', 'skeleton-title');
    }
    
    // Show error state in table
    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle" style="color: var(--negative);"></i>
                    <p style="margin-top: 12px; font-size: 16px; color: var(--text-primary);">Unable to load market data</p>
                    <p style="margin-top: 8px; font-size: 13px;">${message}</p>
                    <button class="btn btn-outline" onclick="loadMarkets()" style="margin-top: 16px;">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function updateGlobalStats(coins) {
    if(!coins || coins.length === 0) return;
    
    let totalMcap = 0;
    let totalVol = 0;
    let bestCoin = coins[0];

    coins.forEach(c => {
        totalMcap += (c.market_cap || 0);
        totalVol += (c.total_volume || 0);
        if((c.price_change_percentage_24h || 0) > (bestCoin.price_change_percentage_24h || 0)) {
            bestCoin = c;
        }
    });

    document.getElementById('global-mcap').textContent = '$' + totalMcap.toLocaleString();
    document.getElementById('global-mcap').classList.remove('skeleton', 'skeleton-title');
    
    document.getElementById('global-vol').textContent = '$' + totalVol.toLocaleString();
    document.getElementById('global-vol').classList.remove('skeleton', 'skeleton-title');

    document.getElementById('top-performer').textContent = bestCoin.name;
    document.getElementById('top-performer').classList.remove('skeleton', 'skeleton-title');
    document.getElementById('top-performer-change').textContent = '+' + (bestCoin.price_change_percentage_24h || 0).toFixed(2) + '%';
}

function renderTable(coins) {
    tableBody.innerHTML = '';
    
    if (coins.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No coins found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    coins.forEach((coin, index) => {
        const tr = document.createElement('tr');
        tr.onclick = () => window.location.href = `crypto.html?id=${coin.id}`;
        
        const change = coin.price_change_percentage_24h || 0;
        const changeClass = change >= 0 ? 'text-positive' : 'text-negative';
        const changeIcon = change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div class="coin-cell">
                    <img src="${coin.image}" class="coin-icon" alt="${coin.name}">
                    <span style="font-weight: 600;">${coin.name}</span>
                    <span class="coin-symbol">${coin.symbol}</span>
                </div>
            </td>
            <td style="font-weight: 500;">$${coin.current_price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</td>
            <td class="${changeClass}">
                <i class="fas ${changeIcon}" style="font-size: 10px; margin-right: 4px;"></i>
                ${Math.abs(change).toFixed(2)}%
            </td>
            <td>$${(coin.market_cap || 0).toLocaleString()}</td>
            <td>$${(coin.total_volume || 0).toLocaleString()}</td>
        `;
        tableBody.appendChild(tr);
    });
}

function initSearch() {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCoins.filter(c => 
            c.name.toLowerCase().includes(term) || c.symbol.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });
}

function resetTimer() {
    secondsLeft = 60;
    if (refreshTimerEl) {
        refreshTimerEl.textContent = `Auto-refresh in ${secondsLeft}s`;
    }
}

function startTimer() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        secondsLeft--;
        if (refreshTimerEl) {
            refreshTimerEl.textContent = `Auto-refresh in ${secondsLeft}s`;
        }
        if (secondsLeft <= 0) {
            resetTimer();
            loadMarkets();
        }
    }, 1000);
}

refreshBtn.addEventListener('click', loadMarkets);

// Initial Load
for(let i=0; i<10; i++) {
    tableBody.innerHTML += `
        <tr>
            <td><div class="skeleton skeleton-text" style="width: 20px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 120px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 80px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 60px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 100px;"></div></td>
            <td><div class="skeleton skeleton-text" style="width: 100px;"></div></td>
        </tr>
    `;
}

initSearch();
loadMarkets();
startTimer();

