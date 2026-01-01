// apps/extensions/frontend/content/meet.js

let dashboard = null;
let bionicActive = false;
let transcriptText = "";
let currentNuggetContent = "";
let meetChatHistory = [];


let lastInteraction = Date.now();
const QUIZ_INTERVAL = 10 * 60 * 1000; // 10 minutes


// VISUAL ANALYSIS STATE VARIABLES 

let lastOcrResult = ""; 
let visualChatHistory = [];

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'RECORDING_STATUS') {
        if (msg.status === 'active') createDashboard();
        else if (dashboard) { dashboard.remove(); dashboard = null; }
    }
});

function createDashboard() {
    if (dashboard) return;
    dashboard = document.createElement('div');
    dashboard.className = "ff-dashboard"; 
    dashboard.style.cssText = `position: fixed; bottom: 80px; right: 20px; width: 450px; height: 550px;`;

    dashboard.innerHTML = `
        <div class="ff-header" id="ff-drag-handle" style="background:#10a37f; color:white; padding:12px; cursor:move; display:flex; justify-content:space-between; align-items:center;">
            <strong>FocusFlow Meet</strong>
            <label style="font-size:12px; cursor:pointer;"><input type="checkbox" id="meet-bionic"> Bionic Mode</label>
        </div>
        <div class="ff-tabs">
            <button id="t-a" class="active">Live Feed</button>
            <button id="t-b">Smart Nuggets</button>
            <button id="t-c">Assistant</button>
            <button id="t-d">Visual</button>
            <button id="t-e">Topics</button> </div>

        <div id="ff-meet-body" style="height: calc(100% - 100px); overflow: hidden;">
            <div id="v-a" class="view" style="height: 100%; overflow-y: auto;">
                <div id="live-transcript-area">Waiting for audio stream...</div>
            </div>
            <div id="v-b" class="view" style="display:none; height: 100%; overflow-y: auto;">
                <select id="nugget-format" style="width:100%; padding:8px; margin-bottom:10px;">
                    <option value="bullets">Bullets</option>
                    <option value="para">Paragraph</option>
                </select>
                <div id="nugget-content">Analyzing lecture context...</div>
            </div>
            <div id="v-c" class="view" style="display:none; flex-direction:column; height:100%;">
                <div id="meet-chat-history" style="flex:1; overflow-y:auto;"></div>
                <div style="display:flex; padding:10px; border-top:1px solid #eee; gap:5px;">
                    <input type="text" id="meet-chat-input" placeholder="Ask about lecture..." style="flex:1; padding:8px; border-radius:4px; border:1px solid #ddd;">
                    <button id="meet-send" style="background:#10a37f; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">➤</button>
                </div>
            </div>
            <div id="v-d" class="view" style="display:none; flex-direction:column; height:100%;">
    <div style="display:flex; gap:5px; margin-bottom:10px;">
        <button id="trigger-ocr" style="flex:2; background:#10a37f; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Capture Area</button>
        <button id="visual-shredder" style="flex:1; background:#0ea5e9; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Flowchart</button>
        <button id="visual-onenote" style="flex:1; background:#773b9a; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Export</button>
    </div>
    <div id="visual-output" style="max-height:150px; overflow-y:auto; background:#f0f9ff; padding:10px; border-radius:8px; border:1px solid #e2e8f0; font-size:14px; margin-bottom:10px;">
        Capture a video region to analyze text and concepts.
    </div>
    
    <div id="visual-chat-history" style="flex:1; overflow-y:auto; border-top:1px solid #ddd; padding-top:10px;"></div>
    <div style="display:flex; padding:10px; border-top:1px solid #eee; gap:5px;">
        <input type="text" id="visual-chat-input" placeholder="Query this selection..." style="flex:1; padding:8px; border-radius:4px; border:1px solid #ddd;">
        <button id="visual-chat-send" style="background:#10a37f; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Send</button>
    </div>
</div>
<div id="v-e" class="view" style="display:none; flex-direction:column; height:100%;">
    <button id="trigger-video-shredder" style="background:#0ea5e9; color:white; border:none; padding:10px; border-radius:8px; margin-bottom:10px; cursor:pointer;">
        Analyze Video Topics
    </button>
    <div id="topic-output" style="flex:1; overflow-y:auto; background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
        Video topics will be color-coded here...
    </div>
</div>

        </div>
    `;
    document.body.appendChild(dashboard);
    makeDraggable(dashboard, document.getElementById('ff-drag-handle'));
    setupDashboardActions();
}

function setupDashboardActions() {
    // Bionic Toggle
    const bionicToggle = document.getElementById('meet-bionic');
    if (bionicToggle) {
        bionicToggle.onchange = (e) => {
            bionicActive = e.target.checked;
            updateUI(); 
        };
    }

    // Tab Switching (Updated to include t-d and v-d)
    const tabs = ['t-a', 't-b', 't-c', 't-d', 't-e'];
    tabs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => {
                tabs.forEach(t => {
                    document.getElementById(t).classList.remove('active');
                    const view = document.getElementById('v-' + t.split('-')[1]);
                    if (view) view.style.display = 'none';
                });
                btn.classList.add('active');
                const target = document.getElementById('v-' + id.split('-')[1]);
                if (target) target.style.display = (id === 't-c' || id === 't-d') ? 'flex' : 'block';
            };
        }
    });

    // Assistant Chat Logic
    const sendBtn = document.getElementById('meet-send');
    const input = document.getElementById('meet-chat-input');
    if (sendBtn) {
        sendBtn.onclick = async () => {
            const text = input.value.trim();
            if (!text) return;
            addMeetMsg(text, 'user');
            input.value = '';
            try {
                const res = await fetch('http://localhost:3000/media/meet-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, history: meetChatHistory })
                });
                const data = await res.json();
                addMeetMsg(data.reply, 'bot');
                meetChatHistory.push({ role: "user", content: text }, { role: "assistant", content: data.reply });
            } catch (e) { addMeetMsg("Assistant offline. Check server connectivity.", 'bot'); }
        };
    }

    // Polling for Smart Nuggets
    setInterval(async () => {
    if (!dashboard) return; 
    try {
        const formatEl = document.getElementById('nugget-format');
        const format = formatEl ? formatEl.value : 'bullets';
        
        const res = await fetch(`http://localhost:3000/media/meeting-summary?format=${format}`);
        if (!res.ok) throw new Error("Backend Error: " + res.status);
        
        const data = await res.json();
        
        // Ensure transcript is updating even if summary fails
        transcriptText = data.fullTranscript || transcriptText;
        currentNuggetContent = data.reply || currentNuggetContent;
        
        updateUI();
    } catch (e) { 
        console.warn("Polling failed:", e.message); 
    }
}, 10000);

    // Visual Tab: OCR Trigger
    document.getElementById('trigger-ocr').onclick = () => {
        if (typeof startVisualSelection === "function") {
            startVisualSelection(); 
        } else {
            console.error("FocusFlow: vision.js logic not loaded.");
        }
    };

    setupVisualActions(); 
    setupTopicActions();

}

// Text Formatting functions

function applyBionic(text) {
    if (!text) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<span>${text}</span>`, 'text/html');
    
    const bionicifyNode = (node) => {
        if (node.nodeType === 3) { // Text node
            const words = node.textContent.split(/([\s\n]+)/);
            const bionicWords = words.map(w => {
                if (w.trim().length < 2) return w;
                const m = Math.ceil(w.length / 2);
                return `<b>${w.slice(0, m)}</b>${w.slice(m)}`;
            }).join('');
            
            const span = document.createElement('span');
            span.innerHTML = bionicWords;
            node.replaceWith(span);
        } else {
            node.childNodes.forEach(child => bionicifyNode(child));
        }
    };

    bionicifyNode(doc.body.firstChild);
    return doc.body.firstChild.innerHTML;
}

function formatADHD(text) {
    if (!text) return "";
    
    // 1. Spacing
    let html = text.replace(/\n\n/g, '<br><br>');

    // 2. Custom Highlights
    html = html.replace(/\[TASK\]/g, '<span class="highlight-task">TASK:</span>');
    html = html.replace(/\[DEF\]/g, '<span class="highlight-def">DEF:</span>');
    html = html.replace(/\[KEY\]/g, '<span class="highlight-key">KEY:</span>');

    // 3. APPLY BIONIC LAST
    return bionicActive ? applyBionic(html) : html;
}

function updateUI() {
    const feed = document.getElementById('live-transcript-area');
    const nugget = document.getElementById('nugget-content');
    if (feed) feed.innerHTML = bionicActive ? applyBionic(transcriptText) : transcriptText;
    if (nugget) nugget.innerHTML = formatADHD(currentNuggetContent); // Uses advanced formatting
}


function addMeetMsg(text, sender) {
    const hist = document.getElementById('meet-chat-history');
    if (!hist) return;
    const msg = document.createElement('div');
    msg.className = `ff-msg ${sender}`;
    msg.innerHTML = bionicActive ? applyBionic(text) : text;
    hist.appendChild(msg);
    hist.scrollTop = hist.scrollHeight;
}

function makeDraggable(el, handle) {
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    handle.onmousedown = (e) => {
        p3 = e.clientX; p4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (e) => {
            p1 = p3 - e.clientX; p2 = p4 - e.clientY;
            p3 = e.clientX; p4 = e.clientY;
            el.style.top = (el.offsetTop - p2) + "px";
            el.style.left = (el.offsetLeft - p1) + "px";
            el.style.bottom = "auto"; el.style.right = "auto";
        };
    };
}

/* -------------------------------------------------------------------------- */
/* QUIZ SET UP FOR AUDIO TO CHECK FOCUS AFTER 10 MINS                                  */
/* -------------------------------------------------------------------------- */

// Track user activity
['mousedown', 'keydown', 'scroll'].forEach(evt => {
    window.addEventListener(evt, () => { lastInteraction = Date.now(); });
});

// Check for inactivity periodically
setInterval(async () => {
    if (Date.now() - lastInteraction > QUIZ_INTERVAL && transcriptText.length > 500) {
        triggerActiveRecallQuiz();
    }
}, 60000); // Check every minute

async function triggerActiveRecallQuiz() {
    // 1. Visual Nudge: Flash the dashboard border
    dashboard.style.border = "5px solid #ff4444";
    setTimeout(() => dashboard.style.border = "3px solid #10a37f", 3000);

    // 2. Fetch Quiz from Groq
    const res = await fetch('http://localhost:3000/media/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: transcriptText.slice(-2000) })
    });
    const data = await res.json();

    // 3. Show Quiz in Assistant Tab
    switchTab('t-c');
    addMeetMsg("Focus Check: " + data.question, 'bot');
    lastInteraction = Date.now(); // Reset timer so it doesn't spam
}

//OneNote export

async function exportToOneNote(content) {
    if (!content) return alert("No content to export.");
    // Note: Ensure userAccessToken is defined or passed from background.js
    const res = await fetch('https://graph.microsoft.com/v1.0/me/onenote/pages', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${userAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title: "FocusFlow Note: " + new Date().toLocaleDateString(),
            content: `<html><body>${content.replace(/\n/g, '<br>')}</body></html>`
        })
    });
    if(res.ok) alert("Exported to OneNote!");
}


/* -------------------------------------------------------------------------- */
/* VISUAL ANALYSIS ACTIONS: SETUP FUNCTIONS                                   */
/* -------------------------------------------------------------------------- */
function setupVisualActions() {
    // Mermaid Initialization for Visual Flowcharts
    mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'neutral',
        securityLevel: 'loose' 
    });

    // Azure Video OCR Trigger
    const ocrBtn = document.getElementById('trigger-ocr');
    if (ocrBtn) {
        ocrBtn.onclick = () => {
            if (typeof startVisualSelection === "function") {
                startVisualSelection(); 
            } else {
                console.error("Visual capture module not loaded.");
            }
        };
    }

    // Visual Shredder: Mermaid Logic

    // Visual Chat: Groq Analysis of Captured Region
    const vChatSend = document.getElementById('visual-chat-send');
    if (vChatSend) {
        vChatSend.onclick = async () => {
            const input = document.getElementById('visual-chat-input');
            const text = input.value.trim();
            if (!text) return;
            if (!lastOcrResult) return alert("Capture an area first to provide context.");

            addVisualMsg(text, 'user');
            input.value = '';

            const res = await fetch('http://localhost:3000/vision/ocr-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, ocrContext: lastOcrResult, history: visualChatHistory })
            });
            const data = await res.json();
            addVisualMsg(data.reply, 'bot');
            visualChatHistory.push({ role: "user", content: text }, { role: "assistant", content: data.reply });
        };
    }

    // 5. Visual Microsoft OneNote Export (Exports Visual Results)
    const vOneNote = document.getElementById('visual-onenote');
    if (vOneNote) {
        vOneNote.onclick = () => {
            const content = document.getElementById('visual-output').innerText;
            exportToOneNote(content);
        };
    }

    // 4. Tab D: Mermaid Flowchart Logic (Audio-based logic flow)
    // Ensure this is inside your setupVisualActions() function
document.getElementById('visual-shredder').onclick = async () => {
    const output = document.getElementById('visual-output');
    output.innerHTML = "Generating ADHD-friendly flowchart...";
    
    try {
        const res = await fetch('http://localhost:3000/media/shredder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText })
        });
        const data = await res.json();
        
        // 1. Clean the code: Remove any markdown backticks the AI might have added
        const cleanCode = data.mermaidCode.replace(/```mermaid|```/g, "").trim();
        
        // 2. Wrap in a div that Mermaid can find
        output.innerHTML = `<div class="mermaid">${cleanCode}</div>`;
        
        // 3. FORCE RENDER (Critical for Mermaid v10+)
        await mermaid.run({
            nodes: output.querySelectorAll('.mermaid'),
            suppressErrors: true
        });
    } catch (e) { 
        output.innerHTML = "Flowchart error: " + e.message; 
    }
};
}

/* -------------------------------------------------------------------------- */
/* VISUAL ANALYSIS LISTENERS: BACKEND RESPONSES                               */
/* -------------------------------------------------------------------------- */
window.addEventListener("message", async (event) => {
    if (event.data.type === 'OCR_CAPTURE_READY') {
        const output = document.getElementById('visual-output');
        if (!output) return;
        
        output.innerText = "Processing captured region with Azure AI Vision...";
        try {
            const res = await fetch('http://localhost:3000/vision/ocr-explain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: event.data.image })
            });
            const data = await res.json();
            
            // Store results for visual chat context
            lastOcrResult = data.reply;
            output.innerHTML = formatADHD(data.reply);
        } catch (e) { 
            output.innerText = "Visual analysis failed. Verify Azure credentials."; 
        }
    }
});

/* -------------------------------------------------------------------------- */
/* VISUAL ANALYSIS HELPERS: UI UPDATES                                        */
/* -------------------------------------------------------------------------- */
function addVisualMsg(text, sender) {
    const hist = document.getElementById('visual-chat-history');
    if (!hist) return;
    const msg = document.createElement('div');
    msg.className = `ff-msg ${sender}`;
    // Preserve bionic formatting for ADHD focus
    msg.innerHTML = bionicActive ? applyBionic(text) : text;
    hist.appendChild(msg);
    hist.scrollTop = hist.scrollHeight;
}


/* -------------------------------------------------------------------------- */
/* TOPIC ANALYSIS ACTIONS (TAB E)                                             */
/* -------------------------------------------------------------------------- */
function setupTopicActions() {
    
const shredBtn = document.getElementById('trigger-video-shredder');
if (shredBtn) {
    shredBtn.onclick = async () => {
        const output = document.getElementById('topic-output');
        output.innerHTML = "Performing deep topic analysis...";
        
        try {
            const res = await fetch(`http://localhost:3000/vision/video-topics?transcript=${encodeURIComponent(transcriptText)}`);
            const data = await res.json();
            
            // Convert text tags into color-coded blocks
            let formattedTopics = data.topics
                .replace(/\[TOPIC: Blue\]/gi, '<div class="topic-card blue"><b>Topic: Blue</b><br>')
                .replace(/\[TOPIC: Orange\]/gi, '<div class="topic-card orange"><b>Topic: Orange</b><br>')
                .replace(/\[TOPIC: Green\]/gi, '<div class="topic-card green"><b>Topic: Green</b><br>')
                .replace(/\[TOPIC: Purple\]/gi, '<div class="topic-card purple"><b>Topic: Purple</b><br>')
                .replace(/\n/g, '</div>'); // Close the divs at each newline

            output.innerHTML = formattedTopics;
        } catch (e) {
            output.innerHTML = "Analysis failed. Ensure backend is running.";
        }
    };
}
}