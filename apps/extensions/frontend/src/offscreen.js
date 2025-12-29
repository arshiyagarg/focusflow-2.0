// let recorder;
// let recording = false;

// chrome.runtime.onMessage.addListener(async (msg) => {
//     if (msg.type === 'INIT_STREAM') {
//         startRecording(msg.streamId);
//     } else if (msg.type === 'STOP_RECORDING') {
//         stopRecording();
//     }
// });

// async function startRecording(streamId) {
//     if (recording) return;

//     // 1. Capture the Tab's Audio
//     const media = await navigator.mediaDevices.getUserMedia({
//         audio: {
//             mandatory: {
//                 chromeMediaSource: 'tab',
//                 chromeMediaSourceId: streamId
//             }
//         },
//         video: false
//     });

//     // 2. Play audio locally so you can still hear the meeting!
//     // (Without this, the tab becomes silent for you)
//     const audioCtx = new AudioContext();
//     const source = audioCtx.createMediaStreamSource(media);
//     source.connect(audioCtx.destination);

//     // 3. Create a Media Recorder
//     // We record in chunks to send to the server periodically
//     recorder = new MediaRecorder(media, { mimeType: 'audio/webm' });

//     recorder.ondataavailable = async (event) => {
//         if (event.data.size > 0) {
//             sendAudioToBackend(event.data);
//         }
//     };

//     // 4. Slice audio every 10 seconds (10000 ms)
//     recorder.start(10000); 
//     recording = true;
//     console.log("FocusFlow: Recording started");
// }

// function stopRecording() {
//     // 1. Stop the recorder
//     if (recorder && recorder.state !== 'inactive') {
//         recorder.stop();
//     }

//     // 2. Stop the actual media stream (Removes the blue "Sharing" banner)
//     if (recorder && recorder.stream) {
//         recorder.stream.getTracks().forEach(track => track.stop());
//     }

//     recording = false;
//     console.log("FocusFlow: Recording stopped");
// }

// async function sendAudioToBackend(audioBlob) {
//     const formData = new FormData();
//     formData.append('audio', audioBlob, `chunk_${Date.now()}.webm`);

//     try {
//         await fetch('http://localhost:3000/process-audio', {
//             method: 'POST',
//             body: formData
//         });
//         console.log("FocusFlow: Chunk sent to backend");
//     } catch (err) {
//         console.error("FocusFlow: Error sending audio", err);
//     }
// }
let recording = false;
let mediaStream = null;

chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === 'INIT_STREAM') {
        startRecording(msg.streamId);
    } else if (msg.type === 'STOP_RECORDING') {
        stopRecording();
    }
});

async function startRecording(streamId) {
    if (recording) return;

    // 1. Capture the Tab's Audio
    mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
            }
        },
        video: false
    });

    // 2. Audio Context (Crucial to keep sound playing for you)
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(mediaStream);
    source.connect(audioCtx.destination);

    recording = true;
    console.log("FocusFlow: Recording Loop Started");

    // 3. Start the "Stop-Start" Loop
    recordSegment();
}

function recordSegment() {
    if (!recording || !mediaStream) return;

    // Create a NEW recorder for this 10-second segment
    // This ensures every chunk has a valid WebM header
    const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
    const chunks = [];

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
        // Once stopped, combine chunks into a blob and upload
        if (chunks.length > 0) {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            await sendAudioToBackend(blob);
        }
        // Immediately start the next segment if we are still "active"
        if (recording) {
            recordSegment(); 
        }
    };

    // Start recording
    recorder.start();

    // Force stop after 10 seconds (triggering onstop and upload)
    setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
    }, 10000); 
}

function stopRecording() {
    recording = false;
    
    // Stop the actual stream to remove the blue "Sharing" banner
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    console.log("FocusFlow: Recording Stopped");
}

async function sendAudioToBackend(audioBlob) {
    // Safety check: Don't send empty files
    if (audioBlob.size < 1000) return; 

    const formData = new FormData();
    formData.append('audio', audioBlob, `chunk_${Date.now()}.webm`);

    try {
        await fetch('http://localhost:3000/process-audio', {
            method: 'POST',
            body: formData
        });
        console.log("FocusFlow: Segment uploaded");
    } catch (err) {
        console.error("FocusFlow: Upload Error", err);
    }
}