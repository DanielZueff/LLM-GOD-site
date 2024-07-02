document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const queryInput = document.getElementById('query-input');
    const chatContainer = document.getElementById('chat-container');
    const queryBarContainer = document.querySelector('.query-bar-container');
    const siteName = document.getElementById('site-name');
    const centerTitle = document.getElementById('center-title');

    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        this.querySelector('i').classList.toggle('fa-sun');
        this.querySelector('i').classList.toggle('fa-moon');
    });

    document.body.addEventListener('keydown', function(e) {
        if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && !queryInput.matches(':focus')) {
            e.preventDefault();
            queryInput.focus();
            queryInput.value += e.key;
        }
    });

    queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendQuery();
        }
    });

    queryInput.setAttribute('autocomplete', 'off');
    queryInput.setAttribute('autofill', 'off');

    function scrollToBottom() {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }

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

    function showChat() {
        centerTitle.classList.add('hidden');
        siteName.classList.remove('hidden');
        siteName.classList.add('visible');
        chatContainer.style.display = 'flex';
    }

        // Функция для сброса чата
    async function resetChat() {
        try {
            const response = await fetch('/reset-chat', { method: 'POST' });
            if (response.ok) {
                chatContainer.innerHTML = '';
            } else {
                console.error('Failed to reset chat');
            }
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    }

    // Вызываем сброс чата при загрузке страницы
    resetChat();

    // Обновленный обработчик клика на название сайта
    siteName.addEventListener('click', async function() {
        try {
            const response = await fetch('/reset-chat', { method: 'POST' });
            if (response.ok) {
                location.reload();
                chatContainer.innerHTML = '';
            } else {
                console.error('Failed to reset chat');
            }
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    });

    async function sendQuery() {
        const question = queryInput.value.trim();
        if (question.length < 2) {
            alert('Пожалуйста, введите более длинный запрос.');
            return;
        }

        showChat();
        queryInput.value = '';

        addMessage('user', question);

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
                addMessage('ai', rawText);
            } else {
                addMessage('ai', 'Не удалось получить содержательный ответ.');
            }

        } catch (error) {
            console.error('Ошибка:', error);
            addMessage('ai', `Произошла ошибка при получении ответа: ${error.message}`);
        }

        scrollToBottom();
    }

    function addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${type}-message`);

        const avatar = document.createElement('div');
        avatar.classList.add('avatar', `${type}-avatar`);
        if (type === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        if (type === 'ai') {
            messageContent.innerHTML = marked.parse(content);
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatContainer.appendChild(messageDiv);

        scrollToBottom();
    }

    function handleMessageClick(event) {
        const message = event.target.closest('.ai-message');
        if (!message) return;

        let copyPopup = message.querySelector('.copy-popup');

        if (!copyPopup) {
            copyPopup = createCopyPopup();
            message.appendChild(copyPopup);
        }

        showCopyPopup(copyPopup);
    }

    function createCopyPopup() {
        const copyPopup = document.createElement('div');
        copyPopup.classList.add('copy-popup');
        copyPopup.innerHTML = `
            <button>
                <i class="fas fa-copy"></i>
                Copy
            </button>
        `;

        copyPopup.querySelector('button').addEventListener('click', (e) => {
            e.stopPropagation();
            const textToCopy = e.target.closest('.message').querySelector('.message-content').innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const button = copyPopup.querySelector('button');
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i> Copy';
                }, 500);
            });
        });

        return copyPopup;
    }

    function showCopyPopup(copyPopup) {
        copyPopup.classList.add('show');
    }

    function hideCopyPopup(copyPopup) {
        copyPopup.classList.remove('show');
    }

    chatContainer.addEventListener('mouseover', handleMessageClick);

    chatContainer.addEventListener('mouseout', (event) => {
        const message = event.target.closest('.ai-message, .user-message');
        if (message) {
            const copyPopup = message.querySelector('.copy-popup');
            if (copyPopup) {
                hideCopyPopup(copyPopup);
            }
        }
    });

    checkScrollPosition();
    chatContainer.innerHTML = '';
});