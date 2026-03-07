/**
 * ZENITH — ELEVENLABS AUDIO GENERATOR
 * Pre-generates high-quality AI voice narration for meditation sessions.
 * 
 * Usage:
 * 1. Set ELEVENLABS_API_KEY environment variable.
 * 2. Run: node scripts/generate-audio.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const https = require('https');

// --- Configuration ---
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'pNInz6obpg8ndclQU7Nc'; // "Marcus" - Deep, resonant male
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_DIR = path.join(__dirname, '../assets/audio/sessions');
const SCRIPTS_DIR = path.join(__dirname, '../js');

if (!API_KEY) {
    console.error('❌ Error: ELEVENLABS_API_KEY environment variable is not set.');
    process.exit(1);
}

// --- Script Loader ---
// Dynamically extracts ZenithSessionScripts from the JS files
function loadAllScripts() {
    const scripts = {};
    const files = fs.readdirSync(SCRIPTS_DIR).filter(f => f.startsWith('session-scripts-'));

    files.forEach(file => {
        const content = fs.readFileSync(path.join(SCRIPTS_DIR, file), 'utf8');
        // Simple regex to extract the object content
        const match = content.match(/const ZenithSessionScripts = \{([\s\S]*?)\};/);
        if (match) {
            try {
                // We use eval carefully here to parse the JS object into a real JS object
                // We wrap it in parentheses to make it an expression
                const obj = eval(`({${match[1]}})`);
                Object.assign(scripts, obj);
            } catch (e) {
                console.error(`Error parsing ${file}:`, e.message);
            }
        }
    });

    return scripts;
}

// --- API Wrapper ---
async function generateAudio(text, filename) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            hostname: 'api.elevenlabs.io',
            path: `/v1/text-to-speech/${VOICE_ID}`,
            headers: {
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json',
                'accept': 'audio/mpeg'
            }
        };

        const postData = JSON.stringify({
            text: text,
            model_id: MODEL_ID,
            voice_settings: {
                stability: 0.6,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        });

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                let errorData = '';
                res.on('data', chunk => errorData += chunk);
                res.on('end', () => reject(new Error(`ElevenLabs API Error (${res.statusCode}): ${errorData}`)));
                return;
            }

            const fileStream = fs.createWriteStream(path.join(OUTPUT_DIR, filename));
            res.pipe(fileStream);
            fileStream.on('finish', () => resolve());
            fileStream.on('error', reject);
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// --- Main Loop ---
async function run() {
    console.log('✦ Zenith Audio Generator Starting...');

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const scripts = loadAllScripts();
    const sessionIds = Object.keys(scripts);

    console.log(`Found ${sessionIds.length} sessions to process.`);

    for (const id of sessionIds) {
        const filename = `${id}.mp3`;
        const filePath = path.join(OUTPUT_DIR, filename);

        if (fs.existsSync(filePath)) {
            console.log(`⏭️ Skipping ${id} (Already exists)`);
            continue;
        }

        console.log(`🎙️ Generating audio for ${id}...`);

        // Construct full text for the session
        // For pre-recorded sessions, we combine the speak blocks
        // The player will handle timing/pauses if it's a "production" session
        // but for high-quality pre-gen, we often generate the whole narration.
        // NOTE: ElevenLabs has character limits, so for long sessions 
        // we might need to split or handle chunks. For now, we take the whole text.

        const fullText = scripts[id]
            .filter(cue => cue.type === 'speak')
            .map(cue => cue.text)
            .join(' ... '); // Add small pauses between segments

        try {
            await generateAudio(fullText, filename);
            console.log(`✅ ${id} saved.`);
            // Rate limiting/courtesy pause
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.error(`❌ Failed to generate ${id}:`, e.message);
        }
    }

    console.log('✦ All sessions processed.');
}

run();
