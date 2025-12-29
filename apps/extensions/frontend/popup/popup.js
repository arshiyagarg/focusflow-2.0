document.addEventListener('DOMContentLoaded', () => {
    const bionicToggle = document.getElementById('bionic-toggle');
    const meetToggle = document.getElementById('meet-toggle');

    // 1. Load saved states
    chrome.storage.local.get(['bionicEnabled', 'meetEnabled'], (result) => {
        bionicToggle.checked = result.bionicEnabled || false;
        meetToggle.checked = result.meetEnabled || false;
    });

    // 2. Listen for Bionic Toggle
    bionicToggle.addEventListener('change', () => {
        const isEnabled = bionicToggle.checked;
        chrome.storage.local.set({ bionicEnabled: isEnabled });
        
        // Send message to active tab to apply/remove immediately
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0].id) {
                chrome.tabs.sendMessage(tabs[0].id, { 
                    type: 'TOGGLE_BIONIC', 
                    value: isEnabled 
                });
            }
        });
    });

// 3. Meet Assistant Toggle Logic
    meetToggle.addEventListener('change', async () => {
        const isEnabled = meetToggle.checked;
        chrome.storage.local.set({ meetEnabled: isEnabled });

        if (isEnabled) {
            // --- START RECORDING ---
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs[0];

            // Safety Check: Don't record restricted pages (like New Tab or chrome://)
            if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
                alert("FocusFlow cannot run on this internal page. Please try a real website (YouTube, Meet, Wikipedia).");
                meetToggle.checked = false;
                return;
            }
            
            // 1. Get Permission
            chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, (streamId) => {
                // 🛑 CHECK FOR ERRORS IMMEDIATELY
                if (chrome.runtime.lastError) {
                    console.warn("Capture failed:", chrome.runtime.lastError.message);
                    alert("Error starting capture: " + chrome.runtime.lastError.message);
                    meetToggle.checked = false;
                    return;
                }

                // 2. Start Background Recorder
                chrome.runtime.sendMessage({ 
                    type: 'START_RECORDING', 
                    streamId: streamId 
                });

                // 3. Show Red Badge
                chrome.tabs.sendMessage(tab.id, { type: 'RECORDING_STATUS', status: 'active' }, (response) => {
                    // Check if message failed (tab not listening)
                    if (chrome.runtime.lastError) {
                        console.warn("Tab not listening:", chrome.runtime.lastError.message);
                        // Don't alert here, just fail silently or retry, 
                        // as the recording itself might still be working in the background.
                    }
                });
            });

        } else {
            // --- STOP RECORDING ---
            chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
            
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]?.id) {
                    chrome.tabs.sendMessage(tabs[0].id, { type: 'RECORDING_STATUS', status: 'inactive' });
                }
            });
        }
    });
});
  