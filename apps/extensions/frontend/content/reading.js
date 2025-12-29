// frontend/content/reading.js

// WARNING please dont remove or comment! PREVENT BIONIC READING ON GOOGLE MEET
if (window.location.hostname.includes("meet.google.com")) {
    // Stop this script immediately if we are on Meet ;)
    throw new Error("FocusFlow: Bionic Reading disabled on Google Meet to prevent conflicts.");
}

let chatOverlay = null;
let currentContext = ""; 
let chatHistory = []; 
let floatBtn = null; // Store button reference globally

// --- INITIALIZATION ---
chrome.storage.local.get(['bionicEnabled'], (result) => {
    if (result.bionicEnabled) applyBionicReading();
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TOGGLE_BIONIC') {
        if (msg.value) applyBionicReading();
        else location.reload();
    }
});

// --- FEATURE 1: BIONIC READING (Webpage) ---
function applyBionicReading() {
    const paragraphs = document.querySelectorAll('p, li'); 
    paragraphs.forEach(p => {
        if (p.dataset.bionicProcessed) return;
        // Logic to skip if inside our own UI to prevent breaking it
        if (p.closest('.ff-chat-window') || p.closest('.ff-float-btn')) return;

        const words = p.innerText.split(' ');
        const bionicHTML = words.map(word => {
            if (word.length < 2) return word;
            const mid = Math.ceil(word.length / 2);
            return `<b>${word.slice(0, mid)}</b>${word.slice(mid)}`;
        }).join(' ');

        p.innerHTML = bionicHTML;
        p.dataset.bionicProcessed = "true"; 
    });
}

// --- FEATURE 2: HIGHLIGHT & CHAT ---
document.addEventListener('mouseup', (e) => {
    // 🛑 FIX: If clicking our own button or chat, STOP here.
    if (e.target.closest('.ff-float-btn') || e.target.closest('.ff-chat-window')) {
        return;
    }

    const selection = window.getSelection().toString().trim();
    
    // Remove old button if it exists
    if (floatBtn) {
        floatBtn.remove();
        floatBtn = null;
    }

    if (selection.length > 0) {
        showFloatBtn(e.clientX, e.clientY + window.scrollY, selection);
    }
});

function showFloatBtn(x, y, text) {
    floatBtn = document.createElement('button');
    floatBtn.innerText = "✨ Understand";
    floatBtn.className = "ff-float-btn";
    floatBtn.style.left = `${x}px`;
    floatBtn.style.top = `${y + 10}px`;

    // Use 'mousedown' to ensure it triggers before the document 'mouseup' logic interferes
    floatBtn.onmousedown = (e) => {
        e.preventDefault(); // Prevent text deselection
        e.stopPropagation(); // Stop bubbling
        openChatWindow(text);
        floatBtn.remove();
        floatBtn = null;
    };

    document.body.appendChild(floatBtn);
}

// --- CHAT WINDOW UI ---
function openChatWindow(contextText) {
    if (chatOverlay) chatOverlay.remove();
    
    currentContext = contextText;
    chatHistory = []; 

    chatOverlay = document.createElement('div');
    chatOverlay.className = "ff-chat-window";
    chatOverlay.innerHTML = `
        <div class="ff-chat-header">
            <span>FocusFlow Assistant</span>
            <button id="ff-close-chat">×</button>
        </div>
        <div class="ff-chat-body" id="ff-messages">
        </div>
        <div class="ff-input-area">
            <input type="text" id="ff-input" placeholder="Ask a doubt...">
            <button id="ff-send">➤</button>
        </div>
    `;

    document.body.appendChild(chatOverlay);

    // Initial Trigger
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = "ff-msg bot";
    thinkingMsg.innerText = "Thinking...";
    document.getElementById('ff-messages').appendChild(thinkingMsg);

    chrome.runtime.sendMessage({ 
        type: 'CHAT_REQUEST', 
        payload: {
            context: currentContext, 
            messages: [{ role: "user", content: "Explain this simply." }] 
        }
    }, (response) => {
        thinkingMsg.remove();
        if (response && response.success) {
            addMessageToUI(response.data, 'bot');
            chatHistory.push({ role: "assistant", content: response.data });
        } else {
            addMessageToUI("Error connecting to Backend.", 'bot');
        }
    });

    // Close Button
    document.getElementById('ff-close-chat').onclick = () => chatOverlay.remove();
    
    // Send Button
    const input = document.getElementById('ff-input');
    const sendBtn = document.getElementById('ff-send');

    const handleSend = () => {
        if (!input.value.trim()) return;
        const text = input.value;
        addMessageToUI(text, 'user');
        input.value = '';
        sendMessageToBackend(text);
    };

    sendBtn.onclick = handleSend;
    input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };
}

// --- CHAT LOGIC ---
function sendMessageToBackend(userQuery) {
    chatHistory.push({ role: "user", content: userQuery });

    // Show temporary thinking message
    const thinkingMsg = document.createElement('div');
    thinkingMsg.className = "ff-msg bot";
    thinkingMsg.innerText = "Thinking...";
    document.getElementById('ff-messages').appendChild(thinkingMsg);

    chrome.runtime.sendMessage({ 
        type: 'CHAT_REQUEST', 
        payload: {
            context: currentContext, 
            messages: chatHistory 
        }
    }, (response) => {
        thinkingMsg.remove();
        
        if (response && response.success) {
            addMessageToUI(response.data, 'bot');
            chatHistory.push({ role: "assistant", content: response.data });
        } else {
            addMessageToUI("Error: " + (response.error || "Unknown error"), 'bot');
        }
    });
}

// --- BIONIC HELPER FOR CHAT ---
// This function takes plain text and makes it Bionic
function formatTextToBionic(text) {
    // Split by spaces or newlines, preserving delimiters
    return text.split(/([\s\n]+)/).map(part => {
        // Leave whitespace/empty strings alone
        if (part.trim().length === 0) return part;
        
        // Don't bold single letters
        if (part.length < 2) return part;
        
        // Bold the first half
        const mid = Math.ceil(part.length / 2);
        return `<b>${part.slice(0, mid)}</b>${part.slice(mid)}`;
    }).join('').replace(/\n/g, '<br>'); // Convert newlines to HTML breaks
}

// --- UPDATED MESSAGE UI ---
// --- UPDATED MESSAGE UI ---
function addMessageToUI(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ff-msg ${sender}`;
    
    // 1. Clean the text: Remove all "**" markers
    const cleanText = text.replace(/\*\*/g, ''); 

    // 2. Pass the clean text to the Bionic Formatter
    msgDiv.innerHTML = formatTextToBionic(cleanText);
    
    const container = document.getElementById('ff-messages');
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight; 
}