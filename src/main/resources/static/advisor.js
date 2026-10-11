const chatBox = document.getElementById('chat-box');
const inputField = document.getElementById('chat-input');
const isAuth = !!localStorage.getItem('cryptohub_token');

if (isAuth) {
    loadHistory();
}

async function loadHistory() {
    try {
        const res = await apiFetch('/api/chat/history');
        const history = await res.json();
        
        if (history && history.length > 0) {
            chatBox.innerHTML = '';
            history.forEach(msg => {
                appendMessage(msg.question, 'user');
                appendMessage(msg.answer, 'ai');
            });
        }
    } catch(e) {
        console.error("No history loaded", e);
    }
}

function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message msg-${sender}`;
    div.innerHTML = text.replace(/\n/g, '<br>');
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'message msg-ai typing';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
}

async function sendMessage(text = null) {
    const q = text || inputField.value.trim();
    if (!q) return;

    inputField.value = '';
    appendMessage(q, 'user');
    showTyping();

    const endpoint = isAuth ? '/api/chat/ask' : '/api/advisor';
    
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (isAuth) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('cryptohub_token')}`;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ question: q })
        });

        if(res.status === 401 || res.status === 403) {
            hideTyping();
            appendMessage('Your session has expired. Please login again to use the advisor.', 'ai');
            return;
        }

        const data = await res.json();
        hideTyping();
        appendMessage(data.answer || "I'm sorry, I couldn't process that.", 'ai');
    } catch (e) {
        hideTyping();
        appendMessage('Error connecting to the AI service.', 'ai');
    }
}

function askPreset(q) {
    sendMessage(q);
}

async function clearHistory() {
    if (!isAuth) {
        chatBox.innerHTML = '<div class="message msg-ai">Hello! I am your AI Crypto Advisor. Ask me anything about cryptocurrencies, markets, or trading strategies.</div>';
        return;
    }

    if (!confirm('Clear chat history?')) return;

    try {
        await apiFetch('/api/chat/history', { method: 'DELETE' });
        chatBox.innerHTML = '<div class="message msg-ai">Chat history cleared. How can I help you?</div>';
    } catch(e) {
        showToast('Failed to clear history', 'error');
    }
}
