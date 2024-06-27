document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const queryInput = document.getElementById('query-input');
    const chatContainer = document.getElementById('chat-container');
    const queryBarContainer = document.querySelector('.query-bar-container');

    // Theme toggle functionality
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        this.querySelector('i').classList.toggle('fa-sun');
        this.querySelector('i').classList.toggle('fa-moon');
    });

    // Обработчик событий клавиатуры для всей страницы
    document.body.addEventListener('keydown', function(e) {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && !queryInput.matches(':focus')) {
            e.preventDefault();
            queryInput.focus();
            queryInput.value += e.key;
        }
    });

    // Query input handling
    queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendQuery();
        }
    });

    // Отключение автозаполнения и подсказок
    queryInput.setAttribute('autocomplete', 'off');
    queryInput.setAttribute('autofill', 'off');

    // Scroll to bottom functionality
    function scrollToBottom() {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }

    // Показ/скрытие query bar при прокрутке
    let isAtBottom = false;
    let ticking = false;

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                checkScrollPosition();
                ticking = false;
            });
            ticking = true;
        }
    });

    function checkScrollPosition() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        let windowHeight = window.innerHeight;
        let documentHeight = document.documentElement.scrollHeight;

        isAtBottom = (windowHeight + scrollTop) >= (documentHeight - 20);

        if (isAtBottom) {
            queryBarContainer.style.opacity = '1';
            queryBarContainer.style.visibility = 'visible';
        } else {
            queryBarContainer.style.opacity = '0';
            queryBarContainer.style.visibility = 'hidden';
        }
    }

    async function sendQuery() {
        const question = queryInput.value.trim();
        if (question.length < 2) {
            alert('Пожалуйста, введите более длинный запрос.');
            return;
        }

        // Очищаем input сразу после получения значения
        queryInput.value = '';

        // Добавляем сообщение пользователя
        const userMessage = document.createElement('div');
        userMessage.classList.add('message', 'user-message');
        userMessage.innerHTML = `
            <div class="avatar user-avatar"><i class="fas fa-user"></i></div>
            ${question}
        `;
        chatContainer.appendChild(userMessage);
        scrollToBottom();

        // Добавляем сообщение AI (пока пустое)
        const aiMessage = document.createElement('div');
        aiMessage.classList.add('message', 'ai-message');
        aiMessage.innerHTML = `
            <div class="avatar ai-avatar"></div>
            Ожидание ответа...
        `;
        chatContainer.appendChild(aiMessage);
        scrollToBottom();

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
                const formattedHtml = marked.parse(rawText);
                aiMessage.innerHTML = `
                    <div class="avatar ai-avatar"></div>
                    <div class="message-content">${formattedHtml}</div>
                `;
            } else {
                aiMessage.innerHTML = `
                    <div class="avatar ai-avatar"></div>
                    <div class="message-content">Не удалось получить содержательный ответ.</div>
                `;
            }

        } catch (error) {
            console.error('Ошибка:', error);
            aiMessage.innerHTML = `
                <div class="avatar ai-avatar"></div>
                Произошла ошибка при получении ответа: ${error.message}
            `;
        }

        scrollToBottom();
    }

    function handleAIMessageClick(event) {
        const message = event.target.closest('.ai-message');
        if (!message) return;

        let copyPopup = message.querySelector('.copy-popup');

        if (!copyPopup) {
            copyPopup = document.createElement('div');
            copyPopup.classList.add('copy-popup');
            copyPopup.innerHTML = `
                <button>
                    <i class="fas fa-copy"></i>
                    Copy
                </button>
            `;
            message.appendChild(copyPopup);

            copyPopup.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                const textToCopy = message.innerText.replace('Copy', '').trim();
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const button = copyPopup.querySelector('button');
                    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        button.innerHTML = '<i class="fas fa-copy"></i> Copy';
                    }, 500);
                });
            });
        }

        showCopyPopup(copyPopup);
    }

    function showCopyPopup(copyPopup) {
        copyPopup.classList.add('show');
    }

    function hideCopyPopup(copyPopup) {
        copyPopup.classList.remove('show');
    }

    chatContainer.addEventListener('mouseover', (event) => {
        const message = event.target.closest('.ai-message, .user-message');
        if (message) {
            handleAIMessageClick(event);
        }
    });

    chatContainer.addEventListener('mouseout', (event) => {
        const message = event.target.closest('.ai-message, .user-message');
        if (message) {
            const copyPopup = message.querySelector('.copy-popup');
            if (copyPopup) {
                hideCopyPopup(copyPopup);
            }
        }
    });

    // Инициализация положения query bar
    checkScrollPosition();
});