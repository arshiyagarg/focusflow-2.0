// frontend/src/background.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    
    // --- MODE B: CHAT REQUEST (Updated Logic) ---
    // We replaced 'EXPLAIN_TEXT' with this new 'CHAT_REQUEST' handler
    if (msg.type === 'CHAT_REQUEST') {
        fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg.payload)
        })
        .then(res => res.json())
        .then(data => sendResponse({ success: true, data: data.reply }))
        .catch(err => sendResponse({ success: false, error: "Backend error: " + err.message }));

        return true; // Keeps the channel open for the asynchronous fetch response
    }

    // --- MODE A: MEET RECORDING (Kept exactly as is) ---
    if (msg.type === 'START_RECORDING') {
        setupOffscreen().then(() => {
            // Forward the stream ID to the offscreen document
            chrome.runtime.sendMessage({ 
                type: 'INIT_STREAM', 
                streamId: msg.streamId 
            });
        });
    }
});

async function setupOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: 'src/offscreen.html', // Ensure this path matches your folder structure
        reasons: ['USER_MEDIA'],
        justification: 'Recording meeting audio'
    });
}