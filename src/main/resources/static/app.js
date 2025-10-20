async function getPrice() {
    const symbol = document.getElementById("symbol").value.trim().toLowerCase();
    if (!symbol) {
        alert("Please enter a crypto id (e.g., bitcoin)");
        return;
    }

    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${symbol}`);

    if (!response.ok) {
        alert("Cryptocurrency not found!");
        return;
    }

    const data = await response.json();
    const name = data.name;
    const price = data.market_data.current_price.usd.toFixed(2);
    const image = data.image.small;

    const table = document.getElementById("result-table");
    const tbody = document.getElementById("table-body");

    tbody.innerHTML = `
        <tr>
            <td><img src="${image}" alt="${name}"></td>
            <td>${name}</td>
            <td>$${price}</td>
        </tr>
    `;

    table.classList.remove("hidden");
}
