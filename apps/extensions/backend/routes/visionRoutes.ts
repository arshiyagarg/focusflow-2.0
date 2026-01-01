// apps/extensions/backend/routes/visionRoutes.ts
import express from 'express';
import ImageAnalysisClient, { isUnexpected } from "@azure-rest/ai-vision-image-analysis";
import { AzureKeyCredential } from "@azure/core-auth";
import Groq from 'groq-sdk';
import axios from 'axios';

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Azure AI Vision 4.0 Configuration
const endpoint = process.env.AZURE_VISION_ENDPOINT || "";
const key = process.env.AZURE_VISION_KEY || "";
const createClient = (ImageAnalysisClient as any).default || ImageAnalysisClient;
const client = createClient(endpoint, new AzureKeyCredential(key));
const sanitize = (text: string) => text.replace(/[*#_~`>]/g, '').trim();

const ADHD_SYSTEM_PROMPT = `You are a specialized ADHD Study Coach. 
Your goal is to provide the given lecture/information in a format and type of content that is visually clear, structured,ADHD-friendly and easy to process.

STRICT FORMATTING RULES:
1. NO MARKDOWN: Never use symbols like *, #, **, _, or ~ for bold/italics.
2. BULLETED LISTS ONLY: Use a simple bullet (• or -) for every single point.
3. WORD LIMIT: Keep every bullet point under 15 words.
4. SPACING: Use EXACTLY two newlines between every bullet point to prevent visual clutter.
5. COLOR-CODING TAGS: Use these tags at the START of relevant bullets:
   - [TASK] for assignments, deadlines, or actions.
   - [DEF] for new terms, definitions, or vocabulary.
   - [KEY] for core concepts or the single most important takeaway.
   
Example format:
[DEF] Photosynthesis: The process plants use to turn sunlight into food.

[KEY] Light energy is converted into chemical energy in the chloroplasts.

[TASK] Read chapter 4 for the lab on Monday.`;

router.post('/ocr-explain', async (req: any, res: any) => {
    const { image } = req.body;
    try {
        const buffer = Buffer.from(image.split(',')[1], 'base64');
const result = await client.path('/imageanalysis:analyze').post({
    body: buffer,
    queryParameters: { features: ['read'] },
    contentType: 'application/octet-stream'
});

// TYPE GUARD FIX
if (isUnexpected(result)) {
    throw result.body.error;
}
const ocrText = result.body.readResult?.blocks.map((b: any) => 
    b.lines.map((l: any) => l.text).join(' ')
).join('\n') || "No text detected.";

        const explanation = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ 
                role: "system", 
                content: ADHD_SYSTEM_PROMPT
            }, { 
                role: "user", content: `OCR Text: ${ocrText}` 
            }],
            temperature: 0.2
        });
        res.json({ reply: explanation.choices[0]?.message?.content || "" });
    } catch (error: any) {
        res.status(500).json({ error: "Azure Vision failed: " + error.message });
    }
});

// 2. Visual Selection Chat
router.post('/ocr-chat', async (req: any, res: any) => {
    const { message, ocrContext, history } = req.body;
    try {
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: ADHD_SYSTEM_PROMPT + `\n\nVisual Context provided by user selection: ${ocrContext}`
                },
                ...history,
                { role: "user", content: message }
            ],
            temperature: 0.2
        });
        res.json({ reply: sanitize(response.choices[0]?.message?.content || "") });
    } catch (error) {
        res.status(500).json({ error: "Visual chat failed" });
    }
});

// 3. Video Shredder (Topic Analysis) for Tab E
router.get('/video-topics', async (req: any, res: any) => {
    try {
        // Fetch topics from Video Indexer logic (Assumes helper functions are available)
        // For development, we return segmented topic logic based on transcript analysis
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ 
                role: "system", 
                content: "Break the lecture into 3-5 color-coded topics. Format: [TOPIC: Color] Title - Description. Colors: blue, green, orange, purple." 
            }, { role: "user", content: `Transcript: ${req.query.transcript}` }]
        });
        res.json({ topics: response.choices[0]?.message?.content || "" });
    } catch (error) { res.status(500).send("Topic analysis failed."); }
});

export default router;