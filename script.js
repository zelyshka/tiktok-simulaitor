(function() {
    // ========== КОНСТАНТЫ ==========
    const MIN_VIEWERS = 18000;
    const MAX_VIEWERS = 39000;
    const CHAT_OVERLAY_LIMIT = 5;

    // Уровни сложности
    const DIFFICULTY = {
        easy: { msgInterval: [3000, 7000], viewerDelta: [100, 300] },
        medium: { msgInterval: [2000, 4000], viewerDelta: [200, 500] },
        hard: { msgInterval: [1000, 2500], viewerDelta: [300, 800] }
    };

    // ========== СОСТОЯНИЕ ==========
    let viewers = Math.floor(Math.random() * (MAX_VIEWERS - MIN_VIEWERS + 1)) + MIN_VIEWERS;
    let followers = Math.floor(Math.random() * (5000000 - 100000 + 1)) + 100000;
    let currentDifficulty = 'medium';
    let soundEnabled = true;

    // ========== DOM ЭЛЕМЕНТЫ ==========
    const viewerEl = document.getElementById('viewerCount');
    const followersEl = document.getElementById('followers');
    const chatMessages = document.getElementById('chatMessages');
    const chatOverlay = document.getElementById('chatOverlay');
    const donationsEl = document.getElementById('donations');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const donateBtn = document.getElementById('donateBtn');
    const difficultySelect = document.getElementById('difficultySelect');
    const soundToggle = document.getElementById('soundToggle');
    const modal = document.getElementById('donateModal');
    const closeBtn = document.querySelector('.close');
    const confirmDonateBtn = document.getElementById('confirmDonate');
    const streamArea = document.getElementById('streamArea');

    let selectedDonateAmount = 0;

    // ========== ДАННЫЕ БОТОВ ==========
    const botNames = [
        'хуесос', 'Макс', 'Лина', 'Тим', 'QCold', 'Дiкстiр Морган',
        'Соня', 'РоманПиздорван', 'Лиза', 'радик', 'Алекс', 'Мила',
        'хлеб', 'Арина', 'Егор', 'Катя', 'Влад', 'Маша'
    ];

    const botPhrases = [
        'найс', '❤️', 'ахуеть', 'ку', 'w', 'сосать', '😂', 'как дела?',
        'вода', 'воздух', 'подписался', '+', '👀', 'лучший', 'хуй', 'кек',
        'чебурек', 'ну такое', 'давай', 'еще', 'погнали', '🖕🖕🖕',
        '💉💉💉', '🚬🚬🚬', 'кто смотрит?', 'из Ирпени', 'из Новосибирска',
        'лол кек', 'крутяк', 'ваще', 'ого', 'хехехе', 'нууу такое', 'брооо',
        '❤️❤️❤️', '🔥🔥🔥', '💀', '👀👀👀', 'класс!', 'вау', 'nice',
        'супер', 'топ', 'лучше всех', 'спасибо', 'круто', 'пиздос'
    ];

    // ========== ЗВУКИ ==========
    function playSound(type) {
        if (!soundEnabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'message') {
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'donate') {
                oscillator.frequency.value = 1200;
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (e) {
            // Звук не поддерживается
        }
    }

    // ========== ФУНКЦИИ ==========
    function randomBotMessage() {
        const name = botNames[Math.floor(Math.random() * botNames.length)];
        let text = botPhrases[Math.floor(Math.random() * botPhrases.length)];

        // 10% шанс на подписку
        if (Math.random() < 0.1) {
            text = 'подписался(ась)! 🎉';
            followers += Math.floor(Math.random() * 10) + 1;
            updateFollowers();
        }

        return { user: name, text: text };
    }

    function updateViewers() {
        const difficulty = DIFFICULTY[currentDifficulty];
        const delta = (Math.random() > 0.5 ? 1 : -1) *
            (Math.floor(Math.random() * difficulty.viewerDelta[1]) + difficulty.viewerDelta[0]);

        let newVal = viewers + delta;
        if (newVal < MIN_VIEWERS) newVal = MIN_VIEWERS + Math.floor(Math.random() * 2000);
        if (newVal > MAX_VIEWERS) newVal = MAX_VIEWERS - Math.floor(Math.random() * 2000);
        viewers = Math.floor(newVal);
        viewerEl.textContent = viewers.toLocaleString();
    }

    function updateFollowers() {
        followersEl.textContent = followers.toLocaleString();
    }

    function addMessage(user, text, isBot = false) {
        // В чат сообщений
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        msgDiv.innerHTML = `<span class="user">${user}:</span> ${text}`;
        chatMessages.appendChild(msgDiv);

        const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 10;
        if (isAtBottom) chatMessages.scrollTop = chatMessages.scrollHeight;

        // На оверлей чата (видно во время стрима)
        const overlayMsg = document.createElement('div');
        overlayMsg.className = 'msg';
        overlayMsg.innerHTML = `<span class="user">${user}:</span> ${text}`;
        chatOverlay.appendChild(overlayMsg);

        while (chatOverlay.children.length > CHAT_OVERLAY_LIMIT) {
            chatOverlay.removeChild(chatOverlay.firstChild);
        }

        playSound('message');
    }

    function generateBotMessage() {
        const bot = randomBotMessage();
        addMessage(bot.user, bot.text, true);
    }

    function sendUserMessage() {
        const text = chatInput.value.trim();
        if (text === '') return;

        addMessage('Вы', text, false);
        chatInput.value = '';

        // 40% шанс на ответ бота
        if (Math.random() < 0.4) {
            setTimeout(() => {
                const bot = randomBotMessage();
                addMessage(bot.user, bot.text, true);
            }, 600 + Math.random() * 1200);
        }
    }

    function addDonation(amount, message) {
        const donationText = message
            ? `💎 ${amount}₽: "${message}"`
            : `💎 ${amount}₽`;

        // В основной чат
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        msgDiv.innerHTML = `<span class="user">ДОНАТ:</span> ${donationText}`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // На оверлей (видно во время стрима)
        const donationItem = document.createElement('div');
        donationItem.className = 'donation-item';
        donationItem.textContent = donationText;
        donationsEl.appendChild(donationItem);

        // Удалить после 5 секунд
        setTimeout(() => {
            if (donationsEl.contains(donationItem)) {
                donationsEl.removeChild(donationItem);
            }
        }, 5000);

        viewers += Math.floor(Math.random() * 50) + 10;
        updateViewers();

        playSound('donate');
    }

    function initChat() {
        const starters = [
            { user: 'хуесос', text: 'ку' },
            { user: 'Макс', text: 'салам ебырь' },
            { user: 'QCold', text: '❤️' },
            { user: 'Тим', text: 'море пиво' }
        ];
        starters.forEach(s => addMessage(s.user, s.text, true));
    }

    // ========== EVENT LISTENERS ==========
    streamArea.addEventListener('mousemove', (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
        const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
        e.target.style.setProperty('--mouse-x', x + '%');
        e.target.style.setProperty('--mouse-y', y + '%');
    });

    sendBtn.addEventListener('click', sendUserMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendUserMessage();
    });

    // Сложность
    difficultySelect.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        console.log('Сложность изменена на:', currentDifficulty);
    });

    // Звук
    soundToggle.addEventListener('change', (e) => {
        soundEnabled = e.target.checked;
    });

    // Донат кнопка
    donateBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    // Закрыть модал
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        selectedDonateAmount = 0;
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            selectedDonateAmount = 0;
        }
    });

    // Выбор суммы доната
    document.querySelectorAll('.donate-amount').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.donate-amount').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedDonateAmount = parseInt(this.dataset.amount);
        });
    });

    // Подтверждение доната
    confirmDonateBtn.addEventListener('click', () => {
        if (selectedDonateAmount === 0) {
            alert('Выбери сумму!');
            return;
        }

        const message = document.getElementById('donateMessage').value.trim();
        addDonation(selectedDonateAmount, message);

        // Сброс
        modal.classList.add('hidden');
        selectedDonateAmount = 0;
        document.getElementById('donateMessage').value = '';
        document.querySelectorAll('.donate-amount').forEach(b => b.classList.remove('selected'));
    });

    // ========== ИНТЕРВАЛЫ ==========
    setInterval(updateViewers, 3000 + Math.random() * 2000);

    setInterval(() => {
        const difficulty = DIFFICULTY[currentDifficulty];
        generateBotMessage();
    }, () => {
        const difficulty = DIFFICULTY[currentDifficulty];
        return difficulty.msgInterval[0] + Math.random() * (difficulty.msgInterval[1] - difficulty.msgInterval[0]);
    }());

    // Иногда несколько сообщений подряд
    setInterval(() => {
        if (Math.random() < 0.3) {
            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                setTimeout(generateBotMessage, i * 400);
            }
        }
    }, 8000);

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    viewerEl.textContent = viewers.toLocaleString();
    followersEl.textContent = followers.toLocaleString();
    initChat();

    console.log('✅ TikTok Live Simulator запущен!');
    console.log('👥 Зрителей:', viewers);
    console.log('👤 Подписчиков:', followers);
})();