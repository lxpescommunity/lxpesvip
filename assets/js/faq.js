document.addEventListener('DOMContentLoaded', () => {
    // --- 1. SELETORES DE ELEMENTOS ---
    const form = document.getElementById('faq-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const popularQuestionsList = document.getElementById('popular-questions-list'); // Novo seletor
    const apiEndpoint = 'http://localhost:4000/api/ask';

    // --- 2. LISTENERS DE EVENTOS ---

    // Listener para o formulário de envio (usuário digitando)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const question = userInput.value.trim();
        if (question) {
            handleUserQuestion(question);
            userInput.value = '';
        }
    });

    // Listener para os botões de perguntas populares (usando delegação de eventos)
    if (popularQuestionsList) {
        popularQuestionsList.addEventListener('click', (e) => {
            // Verifica se o elemento clicado é um botão dentro da lista
            if (e.target && e.target.classList.contains('popular-question-btn')) {
                const question = e.target.textContent;
                // Reutiliza a mesma função para enviar a pergunta ao chat
                handleUserQuestion(question);
            }
        });
    }

    // --- 3. FUNÇÕES DO CHAT ---

    /**
     * Adiciona uma nova mensagem (do usuário ou da IA) à caixa de chat.
     * @param {string} text - O conteúdo da mensagem.
     * @param {string} sender - 'user' ou 'ai'.
     */
    function addMessageToChat(text, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `message-${sender}`);
        const p = document.createElement('p');
        p.innerHTML = text.replace(/\n/g, '<br>'); // Converte quebras de linha em <br> para exibição correta
        messageElement.appendChild(p);
        chatBox.appendChild(messageElement);
        // Rola automaticamente para a mensagem mais recente
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }

    /**
     * Mostra o indicador visual de que a IA está "digitando".
     */
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('message', 'message-ai', 'typing-indicator');
        indicator.innerHTML = `<span></span><span></span><span></span>`;
        chatBox.appendChild(indicator);
        chatBox.scrollTop = chatBox.scrollHeight;
        return indicator;
    }

    /**
     * Função principal que gerencia o envio de uma pergunta e o recebimento de uma resposta.
     * @param {string} question - A pergunta a ser enviada para a IA.
     */
    async function handleUserQuestion(question) {
        // 1. Mostra a pergunta do usuário na tela
        addMessageToChat(question, 'user');
        
        // 2. Desabilita o campo de input e o botão para evitar envios duplicados
        userInput.disabled = true;
        form.querySelector('button').disabled = true;

        // 3. Mostra o indicador "digitando..."
        const typingIndicator = showTypingIndicator();

        try {
            // 4. Envia a pergunta para o nosso backend via API
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question }),
            });

            // 5. Remove o indicador "digitando..." assim que a resposta chegar
            if (chatBox.contains(typingIndicator)) {
                chatBox.removeChild(typingIndicator);
            }
            
            if (!response.ok) {
                // Se a resposta não for OK (ex: erro 500 no servidor), lança um erro
                const errorData = await response.json();
                throw new Error(errorData.error || 'A resposta da rede não foi "ok"');
            }

            const data = await response.json();

            // 6. Mostra a resposta da IA na tela
            addMessageToChat(data.answer, 'ai');

        } catch (error) {
            console.error('Erro ao buscar resposta da IA:', error);
            // Garante que o indicador seja removido mesmo em caso de erro
            if(chatBox.contains(typingIndicator)){
                 chatBox.removeChild(typingIndicator);
            }
            addMessageToChat('Houve um problema de conexão com o assistente. Por favor, tente novamente mais tarde.', 'ai');
        } finally {
            // 7. Reabilita o campo de input e o botão, independentemente do resultado
            userInput.disabled = false;
            form.querySelector('button').disabled = false;
            userInput.focus(); // Coloca o foco de volta no campo de texto
        }
    }
});