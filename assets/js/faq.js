document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('faq-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const popularQuestionsList = document.getElementById('popular-questions-list');
    
    const apiEndpoint = '/api/ask';

    const addMessageToChat = (text, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `message-${sender}`);
        const p = document.createElement('p');
        p.innerHTML = text.replace(/\n/g, '<br>');
        messageElement.appendChild(p);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const showTypingIndicator = () => {
        const indicator = document.createElement('div');
        indicator.classList.add('message', 'message-ai', 'typing-indicator');
        indicator.innerHTML = `<span></span><span></span><span></span>`;
        chatBox.appendChild(indicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        return indicator;
    };

    const handleUserQuestion = async (question) => {
        if (!question.trim()) return;

        addMessageToChat(question, 'user');
        userInput.value = '';
        userInput.disabled = true;
        form.querySelector('button').disabled = true;

        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            if (chatBox.contains(typingIndicator)) {
                chatBox.removeChild(typingIndicator);
            }
            
            if (!response.ok) {
                throw new Error('A resposta da rede não foi "ok"');
            }

            const data = await response.json();
            addMessageToChat(data.answer, 'ai');

        } catch (error) {
            console.error('Erro ao buscar resposta da IA:', error);
             if (chatBox.contains(typingIndicator)) {
                chatBox.removeChild(typingIndicator);
            }
            addMessageToChat('Houve um problema de conexão com o assistente. Tente novamente.', 'ai');
        } finally {
            userInput.disabled = false;
            form.querySelector('button').disabled = false;
            userInput.focus();
        }
    };
    
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleUserQuestion(userInput.value.trim());
        });
    }

    if (popularQuestionsList) {
        popularQuestionsList.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('popular-question-btn')) {
                handleUserQuestion(e.target.textContent.trim());
            }
        });
    }
});