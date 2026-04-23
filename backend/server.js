import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import pdfExtract from 'pdf-extraction';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('rag-index'); 

function chunkText(text, chunkSize = 1000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
}

app.post('/upload', upload.single('document'), async (req, res) => {
    try {
        console.log("\n=== STARTING PDF UPLOAD ===");
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const pdfData = await pdfExtract(req.file.buffer);
        const rawText = pdfData.text;
        console.log(`1. Extracted Text Length: ${rawText ? rawText.length : "UNDEFINED/NULL"}`);

        if (!rawText || rawText.trim().length === 0) {
            console.log("-> ❌ PDF has no readable text.");
            return res.status(400).json({ error: "No readable text found in this PDF." });
        }

        const chunks = chunkText(rawText);
        console.log(`2. Split text into ${chunks.length} chunks.`);
        
        // Explicitly using the preview flag for API stability
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2-preview" });
        
        const vectors = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i].replace(/\x00/g, '').trim(); 
            if (!chunk) {
                console.log(`-> Chunk ${i} is empty after trimming. Skipping.`);
                continue;
            }

            const result = await embeddingModel.embedContent(chunk);
            
            // X-Ray: Checking exactly what the AI hands back
            if (!result.embedding || !result.embedding.values) {
                console.log(`-> ❌ Chunk ${i} failed. Gemini response:`, JSON.stringify(result));
                continue;
            }

            const rawValues = Array.from(result.embedding.values).map(v => Number(v));
            console.log(`-> Chunk ${i} embedded successfully with ${rawValues.length} dimensions.`);

            if (rawValues.length === 0) continue; 
            const vector768 = rawValues.slice(0, 768);

            vectors.push({
                id: `chunk-${Date.now()}-${i}`,
                values: vector768,
                metadata: { text: chunk } 
            });
        }

        console.log(`3. Finished processing chunks. Total vectors generated: ${vectors.length}`);

        if (vectors.length === 0) {
             console.log("-> ❌ Vectors array is empty. Aborting upload to Pinecone.");
             return res.status(400).json({ error: "Failed to generate valid embeddings." });
        }

        console.log("4. Attempting to upsert to Pinecone...");
        await index.upsert({ records: vectors }); 
        console.log("=== UPLOAD SUCCESSFUL ===");
        res.json({ message: "PDF successfully processed and stored!" });
    } catch (error) {
        console.error("=== UPLOAD ERROR ===");
        console.error(error);
        res.status(500).json({ error: "Failed to process PDF" });
    }
});

app.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;
        const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-2-preview" });
        const queryResult = await embeddingModel.embedContent(question);
        const queryVector768 = queryResult.embedding.values.slice(0, 768);

        const searchResults = await index.query({
            vector: queryVector768,
            topK: 3,
            includeMetadata: true
        });

        const context = searchResults.matches.map(m => m.metadata.text).join("\n\n");
        const prompt = `Use the context to answer. Context:\n${context}\n\nQuestion: ${question}`;
        
        const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const response = await textModel.generateContent(prompt);

        res.json({ answer: response.response.text() });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to generate answer" });
    }
});

app.listen(3000, () => console.log('Backend running on http://localhost:3000'));