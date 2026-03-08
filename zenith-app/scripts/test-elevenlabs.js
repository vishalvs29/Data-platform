const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const https = require('https');
const fs = require('fs');

// --- Configuration ---
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = 'nPczCjzI2devNBz1zQrb'; // "Brian" - Deep, Resonant and Comforting
const MODEL_ID = 'eleven_multilingual_v2';

const TEST_TEXT = "Welcome to Zenith. Take a comfortable seated position, gently close your eyes, and take a slow deep breath.";
const OUTPUT_FILE = 'elevenlabs-test.mp3';

if (!API_KEY) {
    console.log('API_KEY_MISSING');
    process.exit(0);
}

const postData = JSON.stringify({
    text: TEST_TEXT,
    model_id: MODEL_ID,
    voice_settings: { stability: 0.5, similarity_boost: 0.5 }
});

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

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(path.join(__dirname, OUTPUT_FILE));
        res.pipe(fileStream);
        fileStream.on('finish', () => {
            console.log('SUCCESS: Audio saved to', OUTPUT_FILE);
            process.exit(0);
        });
    } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`ERROR_BODY: ${data}`);
            process.exit(1);
        });
    }
});

req.on('error', (e) => console.log(`REQ_ERROR: ${e.message}`));
req.write(postData);
req.end();
