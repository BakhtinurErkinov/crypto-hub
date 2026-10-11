const authGuard = document.getElementById('auth-guard');
const mainContent = document.getElementById('main-content');
const txModal = document.getElementById('tx-modal');

let portfolio = [];
let marketPrices = {};
let allocChart;

if(localStorage.getItem('cryptohub_token')) {
    authGuard.style.display = 'none';
    mainContent.style.display = 'block';
    initPortfolio();
}

async function initPortfolio() {
    try {
        // Fetch markets to get current prices
        const mRes = await apiFetch('/api/crypto/markets');
        const markets = await mRes.json();
        markets.forEach(m => {
            marketPrices[m.id] = { price: m.current_price, name: m.name, image: m.image, symbol: m.symbol };
        });

        await loadPortfolio();
    } catch(e) {
        showToast('Error loading portfolio data', 'error');
    }
}

async function loadPortfolio() {
    try {
        const res = await apiFetch('/api/portfolio');
        portfolio = await res.json();
        renderPortfolio();
    } catch(e) {
        console.error(e);
    }
}

function renderPortfolio() {
    let totalInvested = 0;
    let totalValue = 0;
    let bestAsset = { name: '-', pnlPct: -Infinity };
    const chartLabels = [];
    const chartData = [];
    const chartColors = [];

    const tbody = document.getElementById('portfolio-table');
    tbody.innerHTML = '';

    portfolio.forEach(item => {
        const coinData = marketPrices[item.coinId] || { price: 0, name: item.coinId, image: '', symbol: item.coinId };
        const invested = item.amount * item.buyPrice;
        const currentVal = item.amount * coinData.price;
        const pnl = currentVal - invested;
        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

        totalInvested += invested;
        totalValue += currentVal;

        if(pnlPct > bestAsset.pnlPct) {
            bestAsset = { name: coinData.name, pnlPct };
        }

        if(currentVal > 0) {
            chartLabels.push(coinData.name);
            chartData.push(currentVal);
            chartColors.push(`hsl(${Math.random() * 360}, 70%, 50%)`);
        }

        const pnlClass = pnl >= 0 ? 'text-positive' : 'text-negative';
        
        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="coin-cell">
                        ${coinData.image ? `<img src="${coinData.image}" class="coin-icon">` : ''}
                        <span>${coinData.name}</span>
                    </div>
                </td>
                <td>${item.amount.toLocaleString()}</td>
                <td>$${item.buyPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:6})}</td>
                <td>$${coinData.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:6})}</td>
                <td style="font-weight: 600;">$${currentVal.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="${pnlClass}">
                    $${pnl.toLocaleString(undefined, {minimumFractionDigits:2})} (${pnlPct.toFixed(2)}%)
                </td>
                <td>
                    <button class="btn btn-outline" style="padding: 4px 8px; font-size: 12px; margin-right: 4px;" onclick="editTx(${item.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="deleteTx(${item.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    if(portfolio.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No assets in portfolio</td></tr>`;
    }

    const totalPnl = totalValue - totalInvested;
    const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    document.getElementById('total-balance').textContent = `$${totalValue.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    document.getElementById('total-invested').textContent = `$${totalInvested.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    
    const pnlEl = document.getElementById('total-pnl');
    pnlEl.textContent = `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString(undefined, {minimumFractionDigits:2})}`;
    pnlEl.className = totalPnl >= 0 ? 'text-positive' : 'text-negative';

    const pnlPctEl = document.getElementById('total-pnl-pct');
    pnlPctEl.textContent = `${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`;
    pnlPctEl.className = totalPnl >= 0 ? 'text-positive' : 'text-negative';

    document.getElementById('best-asset').textContent = bestAsset.pnlPct !== -Infinity ? bestAsset.name : '-';

    updateChart(chartLabels, chartData, chartColors);
}

function updateChart(labels, data, colors) {
    const ctx = document.getElementById('allocation-chart').getContext('2d');
    if(allocChart) allocChart.destroy();
    
    if(data.length === 0) return;

    allocChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)' } }
            }
        }
    });
}

function openModal(id = null) {
    document.getElementById('tx-id').value = id || '';
    document.getElementById('modal-title').textContent = id ? 'Edit Transaction' : 'Add Transaction';
    
    if(id) {
        const item = portfolio.find(p => p.id === id);
        if(item) {
            document.getElementById('tx-coin').value = item.coinId;
            document.getElementById('tx-amount').value = item.amount;
            document.getElementById('tx-price').value = item.buyPrice;
        }
    } else {
        document.getElementById('tx-form').reset();
    }
    
    txModal.classList.add('active');
}

function closeModal() {
    txModal.classList.remove('active');
}

async function saveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('tx-id').value;
    const coinId = document.getElementById('tx-coin').value.toLowerCase().trim();
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const buyPrice = parseFloat(document.getElementById('tx-price').value);

    const payload = { coinId, amount, buyPrice };

    try {
        if(id) {
            await apiFetch(`/api/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
            showToast('Transaction updated', 'success');
        } else {
            await apiFetch('/api/portfolio', { method: 'POST', body: JSON.stringify(payload) });
            showToast('Transaction added', 'success');
        }
        closeModal();
        loadPortfolio();
    } catch(err) {
        showToast('Failed to save transaction', 'error');
    }
}

async function deleteTx(id) {
    if(!confirm('Delete this transaction?')) return;
    try {
        await apiFetch(`/api/portfolio/${id}`, { method: 'DELETE' });
        showToast('Transaction deleted', 'success');
        loadPortfolio();
    } catch(err) {
        showToast('Failed to delete', 'error');
    }
}
