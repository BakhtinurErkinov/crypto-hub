async function loadCryptoDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        document.body.innerHTML = "<h2>❌ No crypto selected</h2>";
        return;
    }

    try {
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}`);
        const data = await response.json();

        document.getElementById("crypto-name").textContent = data.name;
        document.getElementById("crypto-name-news").textContent = data.name;
        document.getElementById("crypto-logo").src = data.image.large;
        document.getElementById("crypto-description").innerHTML = data.description.en.split(". ")[0] + ".";
        document.getElementById("crypto-price").textContent = data.market_data.current_price.usd.toLocaleString();
        document.getElementById("crypto-marketcap").textContent = data.market_data.market_cap.usd.toLocaleString();
        document.getElementById("crypto-volume").textContent = data.market_data.total_volume.usd.toLocaleString();
        document.getElementById("crypto-homepage").href = data.links.homepage[0] || "#";

        loadChart(id);
        loadNews(data.name);
    } catch (err) {
        console.error(err);
        document.body.innerHTML = "<h2>⚠️ Error loading crypto data.</h2>";
    }
}

async function loadChart(id) {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`);
    const data = await response.json();

    const prices = data.prices.map(p => p[1]);
    const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    const ctx = document.getElementById("cryptoChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "USD Price",
                data: prices,
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.1)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            scales: { y: { beginAtZero: false } }
        }
    });
}

async function loadNews(cryptoName) {
    const newsList = document.getElementById("crypto-news");
    newsList.innerHTML = "<li>Loading news...</li>";

    try {
        const response = await fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN`);
        const data = await response.json();

        newsList.innerHTML = "";

        const filtered = data.Data.filter(n => n.title.toLowerCase().includes(cryptoName.toLowerCase())).slice(0, 5);

        if (filtered.length === 0) {
            newsList.innerHTML = "<li>No recent news for this cryptocurrency.</li>";
            return;
        }

        filtered.forEach(news => {
            const li = document.createElement("li");
            li.innerHTML = `
                <a href="${news.url}" target="_blank">
                    <strong>${news.title}</strong><br>
                    <span>${news.source_info.name}</span> |
                    <small>${new Date(news.published_on * 1000).toLocaleString()}</small>
                </a>
            `;
            newsList.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        newsList.innerHTML = "<li>Error loading news.</li>";
    }
}

loadCryptoDetails();
