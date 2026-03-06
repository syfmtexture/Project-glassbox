import { createWorker } from 'tesseract.js';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Lazy initialize Groq client
let groq = null;

function getGroqClient() {
    if (!groq) {
        groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }
    return groq;
}

/**
 * Extract text from an image buffer using Tesseract.js (OCR)
 * @param {Buffer} buffer The image buffer
 * @param {string} filename Original filename
 * @returns {Promise<string>} The extracted text
 */
export async function extractTextFromImage(buffer, filename) {
    try {
        console.log(`[MediaProcessor] Starting OCR for image: ${filename}`);

        const worker = await createWorker('eng');
        const ret = await worker.recognize(buffer);
        const text = ret.data.text.trim();
        await worker.terminate();

        const resultText = text ? text : '[Image: no text detected]';
        console.log(`[MediaProcessor] OCR complete for ${filename}: ${resultText.length} chars extracted`);

        return resultText;
    } catch (error) {
        console.error(`[MediaProcessor] OCR Error for ${filename}:`, error);
        return `[Image extraction failed: ${error.message}]`;
    }
}

/**
 * Transcribe audio using Groq Whisper API
 * @param {Buffer} buffer The audio buffer
 * @param {string} filename Original filename
 * @param {string} mimetype The file mime type
 * @returns {Promise<string>} The transcribed text
 */
export async function transcribeAudio(buffer, filename, mimetype) {
    let tempFilePath = null;

    try {
        console.log(`[MediaProcessor] Starting audio transcription for: ${filename}`);

        // Ensure we have a valid audio mime type for Groq, though the file extension is more important
        // Groq requires a file extension in the name: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.

        // Write the buffer to a temporary file since the Groq SDK built-in fetch
        // using undici's File might have issues with raw buffers in some Node environments
        // and Groq expects a proper File object or ReadStream.
        const ext = path.extname(filename) || '.mp3'; // Fallback extension
        tempFilePath = path.join(os.tmpdir(), `${uuidv4()}${ext}`);

        // Write buffer to temp file
        await fs.promises.writeFile(tempFilePath, buffer);

        // Create read stream for Groq
        const fileStream = fs.createReadStream(tempFilePath);

        const transcription = await getGroqClient().audio.transcriptions.create({
            file: fileStream,
            model: "whisper-large-v3-turbo",
            prompt: "Please transcribe the following audio.",
            response_format: "json",
            language: "en", // Optional, but usually helps if we know the language
            temperature: 0.0,
        });

        const text = transcription.text ? transcription.text.trim() : '[Audio: no speech detected]';
        console.log(`[MediaProcessor] Transcription complete for ${filename}: ${text.length} chars`);

        return text;
    } catch (error) {
        console.error(`[MediaProcessor] Transcription Error for ${filename}:`, error);
        return `[Audio transcription failed: ${error.message}]`;
    } finally {
        // Clean up temp file
        if (tempFilePath) {
            try {
                if (fs.existsSync(tempFilePath)) {
                    await fs.promises.unlink(tempFilePath);
                }
            } catch (cleanupError) {
                console.error(`[MediaProcessor] Failed to clean up temp file ${tempFilePath}:`, cleanupError);
            }
        }
    }
}

export default {
    extractTextFromImage,
    transcribeAudio
};
