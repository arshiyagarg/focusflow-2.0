import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import multer from 'multer';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// Add this right after your imports to prevent "directory not found" errors
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const upload = multer({ dest: 'uploads/' });
// This endpoint handles the chat conversation
app.post('/chat', async (req, res) => {
    const { context, messages } = req.body; 
    // context = the highlighted text on the webpage
    // messages = the chat history so far (user questions)

    try {
        // Construct the conversation for Groq
        const conversation = [
            {
                role: "system",
                content: `You are a helpful reading assistant. 
                The user is reading this text: "${context}". 
                Answer their questions based on this text. 
                If they ask for an explanation, give a simple, bulleted summary first.`
            },
            ...messages // Append current chat history
        ];

        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: conversation,
            temperature: 0.5,
            max_tokens: 1000
        });

        res.json({ reply: response.choices[0]?.message?.content });
    } catch (error: any) {
        console.error("Groq Error:", error);
        res.status(500).json({ error: error.message });
    }
});


// --- 2. AUDIO (Using Whisper) ---heeeeeeeeehaaaaaaa
app.post('/process-audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No audio file" });

        // Hack FIX: Renaming file to add .webm extension so Groq recognizes it
        const originalPath = req.file.path;
        const newPath = req.file.path + '.webm';
        fs.renameSync(originalPath, newPath);

        // Groq Audio Transcription
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(newPath), // Use newPath with extension
            model: "whisper-large-v3-turbo", 
            response_format: "json",
            temperature: 0.0
        });

        // Cleanup: Delete the .webm file
        fs.unlinkSync(newPath);

        console.log("Transcript:", transcription.text);
        
        // TODO: Append this text to a "Meeting Log" variable here
        
        res.json({ text: transcription.text });
    } catch (error: any) {
        console.error("Groq Audio Error:", error);
        
        // Cleanup file if error occurs
        if (req.file) {
            const pathWithExt = req.file.path + '.webm';
            if (fs.existsSync(pathWithExt)) fs.unlinkSync(pathWithExt);
            else if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));