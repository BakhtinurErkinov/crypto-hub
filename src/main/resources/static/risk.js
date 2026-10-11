const authGuard = document.getElementById('auth-guard');
const mainContent = document.getElementById('main-content');
let markets = {};

if(localStorage.getItem('cryptohub_token')) {
    authGuard.style.display = 'none';
    mainContent.style.display = 'block';
    initRisk();
}

async function initRisk() {
    try {
        const mRes = await apiFetch('/api/crypto/markets');
        const mData = await mRes.json();
        mData.forEach(m => markets[m.id] = m);
        
        await analyzeRisk();
    } catch(e) {
        showToast('Error loading risk data', 'error');
    }
}

async function analyzeRisk() {
    try {
        const pRes = await apiFetch('/api/portfolio');
        const portfolio = await pRes.json();
        
        if(portfolio.length === 0) {
            document.getElementById('risk-label').textContent = 'NO PORTFOLIO';
            document.getElementById('recommendations').innerHTML = '<li>Add assets to your portfolio to see risk analysis.</li>';
            return;
        }

        let totalValue = 0;
        let totalInvested = 0;
        let highestWeight = 0;
        let weightedVolatility = 0;
        
        portfolio.forEach(item => {
            const coin = markets[item.coinId] || { current_price: item.buyPrice, price_change_percentage_24h: 0 };
            const value = item.amount * coin.current_price;
            totalValue += value;
            totalInvested += item.amount * item.buyPrice;
        });

        portfolio.forEach(item => {
            const coin = markets[item.coinId] || { current_price: item.buyPrice, price_change_percentage_24h: 0 };
            const value = item.amount * coin.current_price;
            const weight = totalValue > 0 ? value / totalValue : 0;
            
            if(weight > highestWeight) highestWeight = weight;
            weightedVolatility += weight * Math.abs(coin.price_change_percentage_24h || 0);
        });

        const pnlPct = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
        const numAssets = portfolio.length;

        // Calculate Scores (0-100)
        let divScore = Math.min(100, numAssets * 20); // 5 assets = 100
        let concScore = 100 - (highestWeight * 100); // 100% weight = 0 score
        let volScore = Math.max(0, 100 - (weightedVolatility * 5)); // 20% vol = 0 score
        let pnlScore = Math.min(100, Math.max(0, 50 + (pnlPct))); // 0% = 50, +50% = 100, -50% = 0

        // Overall Risk Score (0-100) where 100 is HIGHEST RISK
        // So we invert the health scores.
        const riskScore = Math.round(
            ((100 - divScore) * 0.2) + 
            ((highestWeight * 100) * 0.3) + 
            ((100 - volScore) * 0.3) + 
            ((100 - pnlScore) * 0.2)
        );

        setGauge(riskScore);
        updateUI(riskScore, divScore, highestWeight * 100, weightedVolatility, pnlPct);

    } catch(e) {
        console.error(e);
        showToast('Risk analysis failed', 'error');
    }
}

function setGauge(score) {
    const path = document.getElementById('gauge-path');
    const length = 220; // Approx length of arc
    const dash = (score / 100) * length;
    
    setTimeout(() => {
        path.style.strokeDasharray = `${dash} ${length}`;
    }, 100);

    document.getElementById('risk-score').textContent = score;
    
    const label = document.getElementById('risk-label');
    let color = 'var(--positive)';
    let text = 'LOW';
    
    if(score > 30) { color = '#fbc02d'; text = 'MEDIUM'; }
    if(score > 60) { color = 'var(--negative)'; text = 'HIGH'; path.style.stroke = 'var(--negative)'; }
    if(score > 80) { color = 'darkred'; text = 'VERY HIGH'; path.style.stroke = 'var(--negative)'; }

    label.textContent = text;
    label.style.color = color;
    path.style.stroke = color;
}

function updateUI(riskScore, divScore, concPct, vol, pnlPct) {
    document.getElementById('val-div').textContent = `${divScore}/100`;
    document.getElementById('val-conc').textContent = `${concPct.toFixed(1)}%`;
    document.getElementById('val-vol').textContent = `${vol.toFixed(2)}%`;
    document.getElementById('val-pnl').textContent = `${pnlPct > 0 ? '+' : ''}${pnlPct.toFixed(2)}%`;

    const recs = [];
    if(divScore < 50) recs.push('Consider adding more diverse assets to your portfolio to reduce single-asset dependency.');
    if(concPct > 50) recs.push(`Your largest holding is ${concPct.toFixed(1)}% of your portfolio. Consider rebalancing.`);
    if(vol > 10) recs.push('Your portfolio experiences high daily volatility. Make sure this aligns with your risk tolerance.');
    if(pnlPct < -20) recs.push('Your portfolio is down significantly. Review your holdings and avoid panic selling.');
    if(recs.length === 0) recs.push('Your portfolio is well-balanced. Keep up the good work!');

    const ul = document.getElementById('recommendations');
    ul.innerHTML = recs.map(r => `<li>${r}</li>`).join('');
}
