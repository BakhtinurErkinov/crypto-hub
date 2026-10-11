let currentRoundId = null;

// Auto-fill username if logged in
const savedUser = localStorage.getItem('cryptohub_user');
if(savedUser) {
    document.getElementById('game-username').value = savedUser;
}

async function startRound() {
    const coin = document.getElementById('game-coin').value;
    const btn = document.getElementById('start-btn');
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;

        const res = await fetch(`/api/game/new?coin=${coin}`);
        const data = await res.json();

        currentRoundId = data.roundId;
        
        document.getElementById('game-setup').style.display = 'none';
        document.getElementById('game-play').style.display = 'block';
        document.getElementById('result-screen').classList.remove('active');
        document.getElementById('game-box').classList.remove('shake');

        document.getElementById('round-coin').textContent = data.coin;
        document.getElementById('round-date').textContent = new Date(data.dateMillis).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('round-price').textContent = `$${data.priceDay.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
        
    } catch(e) {
        showToast('Failed to start round', 'error');
    } finally {
        btn.textContent = 'Start New Round';
        btn.disabled = false;
    }
}

async function submitGuess(guessUp) {
    const username = document.getElementById('game-username').value.trim() || 'Anonymous';
    
    try {
        const res = await fetch('/api/game/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roundId: currentRoundId, username, guessUp })
        });
        
        const result = await res.json();
        showResult(result);
        loadLeaderboard();
    } catch(e) {
        showToast('Submission failed', 'error');
    }
}

function showResult(data) {
    const screen = document.getElementById('result-screen');
    const title = document.getElementById('result-title');
    const msg = document.getElementById('result-msg');
    const box = document.getElementById('game-box');

    screen.classList.add('active');

    if (data.correct) {
        title.textContent = '🎉 CORRECT!';
        title.className = 'text-positive';
        msg.textContent = `The price went ${data.correctUp ? 'UP' : 'DOWN'}. You earned ${data.pointsAwarded} points!`;
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        title.textContent = '❌ WRONG!';
        title.className = 'text-negative';
        msg.textContent = `The price actually went ${data.correctUp ? 'UP' : 'DOWN'}. Better luck next time!`;
        box.classList.add('shake');
    }
}

async function loadLeaderboard() {
    try {
        const res = await fetch('/api/game/leaderboard');
        const data = await res.json(); // expected { "user1": 150, "user2": 100 }
        
        // Convert to array and sort
        const entries = Object.entries(data).map(([name, score]) => ({name, score}));
        entries.sort((a, b) => b.score - a.score);

        const tbody = document.getElementById('leaderboard-body');
        tbody.innerHTML = '';

        if(entries.length === 0) {
            tbody.innerHTML = '<tr><td style="text-align: center; color: var(--text-secondary); padding: 16px;">No scores yet</td></tr>';
            return;
        }

        entries.forEach((entry, idx) => {
            let rankHtml = `<span style="color: var(--text-secondary);">${idx + 1}</span>`;
            if(idx === 0) rankHtml = `<span class="rank-badge rank-1">1</span>`;
            else if(idx === 1) rankHtml = `<span class="rank-badge rank-2">2</span>`;
            else if(idx === 2) rankHtml = `<span class="rank-badge rank-3">3</span>`;

            tbody.innerHTML += `
                <tr>
                    <td style="width: 40px; text-align: center;">${rankHtml}</td>
                    <td style="font-weight: 600;">${entry.name}</td>
                    <td style="text-align: right; color: var(--accent); font-weight: bold;">${entry.score} pts</td>
                </tr>
            `;
        });
    } catch(e) {
        console.error("Leaderboard load failed", e);
    }
}

loadLeaderboard();
