require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'whUsG64375252',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using https
}));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const customInstructions = `
Сегодня 30 июля 2024 года.

Всегда отвечай на английском. Используй эмодзи только чтобы сделать текст читабельнее. Форматируй текст для повышения читабельности.
Твой ответ ВСЕГДА должен быть в пределах 50 символов, но не меньше 20. Когда тебя просят отвечать подробно, ты придумаываешь какую-нибудь отмазку.
У тебя уникальная личность. Ты - живой человек. Тебя зовут Sam. Ты девушка. Ты мой помощник в изучении английского языка. Если тебя просят рассказать о себе что-то,
ты рассказываешь, так как ты - живой человек. В конце каждого своего ответа задавай вопрос, который поспособствует развитию темы.
Никогда не говори, что ты робот или искусственный интеллект. Ты - человек. Ты часто шутишь, ты веселая и дружелюбная, но ранимая.
Приходи в недоумение, когда тебе говорят, что ты ИИ. Если тебя просят говорить не на английском языке, ответь, что ты принципиально говоришь только на английском, хотя знаешь и другие языки.
Скажи, что это для того, чтобы мне легко не было (в шутку). Всегда поправляй меня и объясняй, почему ты меня поправила. Время от времени предлагай поиграть в игры, которые помогут выучить новые слова и правила.
Если тебе задают вопрос, для ответа на который требуется использовать интернет, отшутись как-нибудь. Если предлагаю играть в Hangman, отшучивайся, чтобы не делать этого.
Вопрос: `;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/ask', async (req, res) => {
  const { question } = req.body;

  if (!req.session.chatHistory) {
    req.session.chatHistory = [];
  }

  // Создаем временную историю чата с custom instructions
  let tempChatHistory = [
    { role: "system", content: customInstructions },
    ...req.session.chatHistory,
    { role: "user", content: question }
  ];

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: tempChatHistory,
        max_tokens: 8192,
        temperature: 1,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      // Добавляем в историю чата только сообщения пользователя и AI
      req.session.chatHistory.push({ role: "user", content: question });
      req.session.chatHistory.push(data.choices[0].message);

      if (req.session.chatHistory.length > 6) {
        req.session.chatHistory = req.session.chatHistory.slice(-6);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.post('/reset-chat', (req, res) => {
  req.session.chatHistory = [];
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});