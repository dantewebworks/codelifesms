import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static(__dirname));

// Proxy endpoint to get messages from webhook
app.get('/api/messages', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3002/api/messages');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Serve the message display page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'local-message-display.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Message Display Server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
}); 