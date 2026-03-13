const https = require('https');
const path = require('path');
const fs = require('fs');

// Path to root .env
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const API_KEY = process.env.ELEVENLABS_API_KEY;

if (!API_KEY) {
    console.error('API_KEY_MISSING from .env at', envPath);
    process.exit(1);
}

const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/voices',
    headers: { 'xi-api-key': API_KEY }
};

https.get(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            if (result.voices) {
                const voices = result.voices.map(v => ({ name: v.name, id: v.voice_id }));
                console.log(JSON.stringify(voices, null, 2));
            } else {
                console.log('Error result:', result);
            }
        } catch (e) {
            console.error('Parse error:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Request error:', e.message);
});
