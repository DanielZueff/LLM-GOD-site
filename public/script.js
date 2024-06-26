document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const queryInput = document.getElementById('query-input');
    const sendButton = document.getElementById('send-button');
    const chatContainer = document.getElementById('chat-container');

    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        this.querySelector('i').classList.toggle('fa-sun');
        this.querySelector('i').classList.toggle('fa-moon');
    });

    // Query input handling
    queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendQuery();
            queryInput.value = '';
        }
    });

    sendButton.addEventListener('click', sendQuery);

    async function sendQuery() {
        const question = queryInput.value.trim();
        if (question.length < 2) {
            alert('Пожалуйста, введите более длинный запрос.');
            return;
        }

        // Добавляем сообщение пользователя
        const userMessage = document.createElement('div');
        userMessage.classList.add('message', 'user-message');
        userMessage.innerHTML = `
            <div class="avatar user-avatar"><i class="fas fa-user"></i></div>
            ${question}
        `;
        chatContainer.appendChild(userMessage);

        // Добавляем сообщение AI (пока пустое)
        const aiMessage = document.createElement('div');
        aiMessage.classList.add('message', 'ai-message');
        aiMessage.innerHTML = `
            <div class="avatar ai-avatar"></div>
            Ожидание ответа...
        `;
        chatContainer.appendChild(aiMessage);

        chatContainer.scrollTop = chatContainer.scrollHeight;

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                const rawText = data.choices[0].message.content;
                const formattedHtml = formatText(rawText);
                aiMessage.innerHTML = `
                    <div class="avatar ai-avatar"></div>
                    ${formattedHtml}
                    <button class="copy-button" title="Копировать"><i class="fas fa-copy"></i></button>
                `;

                const copyButton = aiMessage.querySelector('.copy-button');
                copyButton.addEventListener('click', () => copyText(aiMessage));
            } else {
                aiMessage.innerHTML = `
                    <div class="avatar ai-avatar"></div>
                    Не удалось получить содержательный ответ.
                `;
            }

        } catch (error) {
            console.error('Ошибка:', error);
            aiMessage.innerHTML = `
                <div class="avatar ai-avatar"></div>
                Произошла ошибка при получении ответа: ${error.message}
            `;
        }

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function formatText(text) {
        // Заменяем переносы строк на <br>
        text = text.replace(/\n/g, '<br>');

        // Форматируем заголовки
        text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        text = text.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        text = text.replace(/^###### (.*$)/gim, '<h6>$1</h6>');

        // Форматируем жирный текст
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Форматируем код
        text = text.replace(/`(.*?)`/g, '<code>$1</code>');

        // Форматируем списки
        text = text.replace(/^\s*(\d+\.|\*|\-)\s/gm, '<br>• ');

        return text;
    }

    function copyText(element) {
        const textToCopy = element.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const copyButton = element.querySelector('.copy-button');
            copyButton.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
});