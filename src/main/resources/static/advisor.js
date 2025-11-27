async function askAdvisor() {
    const question = document.getElementById("question").value.trim();
    const mode = document.getElementById("mode").value;

    if (!question) {
        alert("Please enter your question!");
        return;
    }

    const response = await fetch("/api/advisor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, mode })
    });

    const data = await response.json();

    document.getElementById("answer-text").innerText = data.answer;
    document.getElementById("answer-box").classList.remove("hidden");
}
