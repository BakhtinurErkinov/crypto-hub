// 🌍 Загружаем список популярных криптовалют при загрузке страницы
document.addEventListener("DOMContentLoaded", loadTopCryptos);

async function loadTopCryptos() {
    const container = document.getElementById("crypto-list");

    try {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false");
        const data = await response.json();

        container.innerHTML = `
            <table class="crypto-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Logo</th>
                        <th>Name</th>
                        <th>Symbol</th>
                        <th>Price (USD)</th>
                        <th>Market Cap</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((coin, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td><img src="${coin.image}" alt="${coin.name}" width="32"></td>
                            <td><a href="crypto.html?id=${coin.id}">${coin.name}</a></td>
                            <td>${coin.symbol.toUpperCase()}</td>
                            <td>$${coin.current_price.toLocaleString()}</td>
                            <td>$${coin.market_cap.toLocaleString()}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (err) {
        container.innerHTML = `<p style="color:red;">Failed to load cryptocurrency list. Please try again later.</p>`;
        console.error(err);
    }
}
