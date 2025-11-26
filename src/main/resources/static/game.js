let currentRoundId = null;
let currentCoin = null;

async function newRound() {
    const coin = document.getElementById('game-coin').value.trim().toLowerCase();
    if (!coin) { alert('Enter coin id'); return; }
    currentCoin = coin;

    const resp = await fetch(`/api/game/new?coin=${coin}`);
    const data = await resp.json();
    if (data.error) { alert(data.error); return; }

    currentRoundId = data.roundId;

    const date = new Date(data.dateMillis);
    document.getElementById('round-area').innerHTML = `
        <p>Coin: <strong>${data.coin}</strong></p>
        <p>Day (reference): <strong>${date.toLocaleDateString()}</strong></p>
        <p>Price that day: <strong>$${data.priceDay.toFixed(2)}</strong></p>
        <p>Will price be <strong>higher</strong> or <strong>lower</strong> the next day?</p>
        <button onclick="submitGuess(true)">Higher (Up)</button>
        <button onclick="submitGuess(false)">Lower (Down)</button>
        <div>
          <input id="username" placeholder="Your name for leaderboard (optional)"/>
        </div>
    `;
    document.getElementById('result-area').innerHTML = '';
}

async function submitGuess(guessUp) {
    if (!currentRoundId) { alert('Start a round first'); return; }
    const username = document.getElementById('username').value || 'Anonymous';

    const resp = await fetch('/api/game/submit', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ roundId: currentRoundId, username, guessUp })
    });
    const data = await resp.json();
    if (data.error) { alert(data.error); return; }

    document.getElementById('result-area').innerHTML = `
        <p>Your guess was: <strong>${guessUp ? 'Higher' : 'Lower'}</strong></p>
        <p>Correct answer: <strong>${data.correctUp ? 'Higher' : 'Lower'}</strong></p>
        <p>Correct: <strong>${data.correct}</strong></p>
        <p>Points awarded: <strong>${data.pointsAwarded}</strong></p>
    `;
    currentRoundId = null;
    loadLeaderboard();
}

async function loadLeaderboard() {
    const resp = await fetch('/api/game/leaderboard');
    const data = await resp.json();
    const el = document.getElementById('leaderboard');
    if (!data || Object.keys(data).length === 0) {
        el.innerHTML = '<p>No scores yet.</p>';
        return;
    }
    el.innerHTML = '<ol>' + Object.entries(data).map(([u,s]) => `<li>${u}: ${s}</li>`).join('') + '</ol>';
}

// загрузить при открытии
loadLeaderboard();
