// // This script runs on meet.google.com
// console.log("FocusFlow: Meet Assistant Active");

// // 1. Listen for recording state from Background
// chrome.runtime.onMessage.addListener((msg) => {
//     if (msg.type === 'RECORDING_STATUS') {
//         if (msg.status === 'active') {
//             showRecordingBadge();
//         } else {
//             hideRecordingBadge();
//         }
//     }
// });

// let badge = null;

// function showRecordingBadge() {
//     if (badge) return;
    
//     badge = document.createElement('div');
//     badge.innerText = "🔴 FocusFlow Listening";
//     badge.style.cssText = `
//         position: fixed; bottom: 20px; left: 20px;
//         background: #dc2626; color: white; padding: 10px 20px;
//         border-radius: 30px; font-family: sans-serif; font-weight: bold;
//         z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
//         animation: pulse 2s infinite;
//     `;
    
//     // Add simple stop button logic if you want
//     badge.onclick = () => {
//         chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
//         hideRecordingBadge();
//     };

//     document.body.appendChild(badge);
// }

// function hideRecordingBadge() {
//     if (badge) {
//         badge.remove();
//         badge = null;
//     }
// }

// // Add animation keyframes
// const style = document.createElement('style');
// style.innerHTML = `
// @keyframes pulse {
//     0% { opacity: 1; }
//     50% { opacity: 0.7; }
//     100% { opacity: 1; }
// }`;
// document.head.appendChild(style);
// frontend/content/meet.js
console.log("FocusFlow: Meet Assistant Loaded");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    
    if (msg.type === 'RECORDING_STATUS') {
        if (msg.status === 'active') {
            showBadge();
        } else {
            hideBadge();
        }
        // 🛑 FIX 1: Send a response back so the popup doesn't error out
        sendResponse({ success: true });
    }
    
    // Return true to keep the message channel open (good practice)
    return true;
});

let badge = null;

function showBadge() {
    if (badge) return;
    
    badge = document.createElement('div');
    badge.innerText = "🔴 FocusFlow Listening";
    badge.style.cssText = `
        position: fixed; bottom: 80px; left: 20px;
        background: #dc2626; color: white; padding: 12px 24px;
        border-radius: 50px; font-family: sans-serif; font-weight: bold;
        z-index: 10000; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        display: flex; align-items: center; gap: 10px;
        animation: pulse 2s infinite; cursor: pointer;
    `;
    
    badge.onclick = () => {
        chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
        hideBadge();
    };

    document.body.appendChild(badge);
}

function hideBadge() {
    if (badge) {
        badge.remove();
        badge = null;
    }
}

const style = document.createElement('style');
style.innerHTML = `
@keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7); }
    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}`;
document.head.appendChild(style);