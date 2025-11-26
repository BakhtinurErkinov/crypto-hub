async function getRecommendation() {
    const budget = parseFloat(document.getElementById('budget').value || '0');
    const horizon = parseInt(document.getElementById('horizon').value || '6');
    const risk = document.getElementById('risk').value;

    const resp = await fetch('/api/advisor/recommend', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ budgetUsd: budget, horizonMonths: horizon, risk })
    });
    const data = await resp.json();

    const container = document.getElementById('recommendation');
    container.innerHTML = `<h3>Recommendation</h3>
        <p>${data.explanation}</p>
        <p>Budget: $${data.budgetUsd}</p>
        <table>
            <thead><tr><th>Coin</th><th>Percent</th><th>Amount (USD)</th></tr></thead>
            <tbody>
                ${Object.entries(data.allocation).map(([coin, pct]) => {
                    const amount = (data.suggestedAmounts && data.suggestedAmounts[coin]) || (budget * pct).toFixed(2);
                    return `<tr><td>${coin}</td><td>${(pct*100).toFixed(1)}%</td><td>$${amount}</td></tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
}
