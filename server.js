const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/ask', async (req, res) => {
    const { question } = req.body;
    console.log('Получен вопрос:', question); // Отладочная информация

    try {
        console.log('Отправка запроса к API Groq');
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-70b-8192',
            messages: [{ role: 'user', content: question }],
            temperature: 0.7,
            max_tokens: 2048
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Получен ответ от API Groq');
        res.json(response.data);
    } catch (error) {
        console.error('Ошибка при запросе к API Groq:', error.message);
        res.status(500).json({ error: 'An error occurred', details: error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));