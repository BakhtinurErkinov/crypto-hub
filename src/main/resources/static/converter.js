async function initConverter() {
    try {
        const res = await fetch('/api/crypto/markets');
        const markets = await res.json();
        
        const fromSelect = document.getElementById('from-asset');
        fromSelect.innerHTML = '';
        markets.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.name} (${m.symbol.toUpperCase()})`;
            fromSelect.appendChild(opt);
        });
        
        // Auto convert after loading
        convert();
    } catch(e) {
        showToast('Error loading coins', 'error');
    }
}

async function convert() {
    const amount = document.getElementById('amount').value;
    const from = document.getElementById('from-asset').value;
    const to = document.getElementById('to-asset').value;
    
    if(!amount || amount <= 0) return;

    try {
        const res = await fetch(`/api/crypto/convert?from=${from}&to=${to}&amount=${amount}`);
        const data = await res.json();
        
        const resultEl = document.getElementById('result-display');
        
        let symbol = '';
        switch(to.toLowerCase()) {
            case 'usd': symbol = '$'; break;
            case 'eur': symbol = '€'; break;
            case 'gbp': symbol = '£'; break;
            case 'jpy': symbol = '¥'; break;
            case 'rub': symbol = '₽'; break;
            default: symbol = to.toUpperCase() + ' '; break;
        }

        const value = data.result || data.value || data; // handling different possible response structures

        resultEl.textContent = `${symbol}${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
        
        // Rate display approximation
        const rate = Number(value) / Number(amount);
        document.getElementById('rate-display').textContent = `1 ${from.toUpperCase()} = ${symbol}${rate.toLocaleString(undefined, {maximumFractionDigits: 6})}`;
        
    } catch(e) {
        showToast('Conversion failed', 'error');
    }
}

function swapAssets() {
    // This simple swap logic only works perfectly if both lists have the same assets. 
    // Since 'To' has fiat, we can't easily swap directly without making sure 'From' accepts fiat.
    // Assuming backend supports crypto to fiat and crypto to crypto only based on requirements.
    // For visual flare, we'll just show a toast for now.
    showToast('Swapping fiat to crypto is not supported yet', 'info');
}

document.getElementById('amount').addEventListener('input', () => {
    // Optional debounce auto-convert
});

initConverter();
