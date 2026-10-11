const urlParams = new URLSearchParams(window.location.search);
const coinId = urlParams.get('id');

let chart;
let currentDays = 7;

if(!coinId) {
    window.location.href = 'index.html';
}

async function loadCoinData() {
    try {
        const res = await apiFetch(`/api/crypto/price/${coinId}`);
        const data = await res.json();
        
        document.getElementById('coin-img').src = data.image?.large || data.image;
        document.getElementById('coin-img').style.display = 'block';
        
        document.getElementById('coin-name').textContent = data.name;
        document.getElementById('coin-name').classList.remove('skeleton', 'skeleton-title');
        
        document.getElementById('coin-symbol').textContent = data.symbol.toUpperCase();
        document.getElementById('coin-symbol').style.display = 'inline-block';
        
        const price = data.market_data?.current_price?.usd || data.current_price;
        document.getElementById('coin-price').textContent = `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
        document.getElementById('coin-price').classList.remove('skeleton', 'skeleton-title');
        
        const change = data.market_data?.price_change_percentage_24h || data.price_change_percentage_24h || 0;
        const changeEl = document.getElementById('coin-change');
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeEl.className = change >= 0 ? 'text-positive' : 'text-negative';

        // Stats
        document.getElementById('stat-mcap').textContent = `$${(data.market_data?.market_cap?.usd || data.market_cap || 0).toLocaleString()}`;
        document.getElementById('stat-vol').textContent = `$${(data.market_data?.total_volume?.usd || data.total_volume || 0).toLocaleString()}`;
        document.getElementById('stat-supply').textContent = (data.market_data?.circulating_supply || data.circulating_supply || 0).toLocaleString();
        document.getElementById('stat-ath').textContent = `$${(data.market_data?.ath?.usd || 0).toLocaleString()}`;
        
        if(data.description && data.description.en) {
            document.getElementById('coin-desc').innerHTML = data.description.en.split('. ')[0] + '.';
        } else {
            document.getElementById('coin-desc-container').style.display = 'none';
        }
        
    } catch(e) {
        showToast('Failed to load coin details', 'error');
    }
}

async function loadChartData() {
    try {
        const res = await apiFetch(`/api/crypto/chart/${coinId}?days=${currentDays}`);
        const data = await res.json();
        const prices = data.prices;
        
        const labels = prices.map(p => {
            const date = new Date(p[0]);
            return currentDays <= 1 ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : date.toLocaleDateString();
        });
        const values = prices.map(p => p[1]);
        
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        if(chart) chart.destroy();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 212, 170, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 212, 170, 0.0)');

        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price (USD)',
                    data: values,
                    borderColor: '#00d4aa',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(10, 14, 26, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#00d4aa',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    } catch(e) {
        showToast('Failed to load chart data', 'error');
    }
}

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentDays = e.target.dataset.days;
        loadChartData();
    });
});

loadCoinData();
loadChartData();
