// Основная функция — вызывается при нажатии кнопки
async function fetchPrice() {
    const cryptoId = document.getElementById("cryptoInput").value.trim().toLowerCase();

    if (!cryptoId) {
        alert("Please enter a crypto id (e.g., bitcoin)");
        return;
    }

    // --- 1️⃣ Получаем общие данные ---
    const response = await fetch(`/api/crypto/price/${cryptoId}`);
    if (!response.ok) {
        alert("Cryptocurrency not found!");
        return;
    }

    const data = await response.json();
    const name = data.name;
    const price = data.market_data.current_price.usd.toFixed(2);
    const image = data.image.small;

    // --- 2️⃣ Отображаем таблицу с данными ---
    const table = document.getElementById("result-table");
    const tbody = document.getElementById("table-body");

    tbody.innerHTML = `
        <tr>
            <td><img src="${image}" alt="${name}" width="30"></td>
            <td>${name}</td>
            <td>$${price}</td>
        </tr>
    `;

    table.classList.remove("hidden");

    // --- 3️⃣ Загружаем и рисуем график ---
    fetchChartData(cryptoId);
}

// --- 4️⃣ Получаем данные для графика ---
async function fetchChartData(cryptoId) {
    const response = await fetch(`/api/crypto/chart/${cryptoId}`);
    if (!response.ok) {
        console.error("Chart data not found");
        return;
    }

    const data = await response.json();

    const prices = data.prices.map(p => p[1]);
    const labels = data.prices.map(p => {
        const date = new Date(p[0]);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    renderChart(labels, prices, cryptoId);
}

// --- 5️⃣ Отрисовка графика ---
let chart;

function renderChart(labels, prices, cryptoId) {
    const ctx = document.getElementById("priceChart").getContext("2d");

    // Если график уже был — удалить, чтобы не наслаивались
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: `${cryptoId.toUpperCase()} (USD)`,
                data: prices,
                borderColor: "rgba(75, 192, 192, 1)",
                fill: true,
                backgroundColor: "rgba(75, 192, 192, 0.1)",
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}
