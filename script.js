let clickCount = 0;
let isLoggedIn = false;
localStorage.setItem('pigClickerLoggedIn', 'true');
let isGuest = false;
// GitHub Configuration - Edit these values
let githubConfig = {
    username: 'Toytjeo',
    repo: 'RomaTyrok',
    token: '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'
};
// Pig sounds (using Web Audio API to generate pig-like sounds)
        // Pig sounds (using real pig sound files)
        const pigAudioFiles = [
            new Audio('https://cdn.pixabay.com/download/audio/2022/11/05/audio_89a50f3748.mp3?filename=pig-125132.mp3'),
            new Audio('https://cdn.pixabay.com/download/audio/2022/11/05/audio_89a50f3748.mp3?filename=pig-125132.mp3')
        ];
        
        // Alternative: Create multiple Audio objects with different pig sounds
        
        function playPigSound() {
            // Method 1: Using pre-loaded audio files
            try {
                const randomIndex = Math.floor(Math.random() * pigAudioFiles.length);
                const audio = new Audio(pigAudioFiles[randomIndex].src);
                audio.playbackRate = 0.5 + Math.random() * 1.0; // Random pitch between 0.5x and 1.5x speed
                audio.volume = 0.2 + Math.random() * 0.3; // Random volume between 0.2 and 0.5
                audio.currentTime = 0;
                audio.play().catch(e => console.log('Audio play failed:', e));
            } catch (error) {
                console.log('Pig sound failed, using fallback');
                playFallbackSound();
            }
        }
        
        function playFallbackSound() {
            // Fallback to generated sound if audio files fail
            const fallbackAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = fallbackAudioContext.createOscillator();
            const gainNode = fallbackAudioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(fallbackAudioContext.destination);
                        
            // More pig-like sound
            const frequency = 150 + Math.random() * 200;
            oscillator.frequency.setValueAtTime(frequency, fallbackAudioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, fallbackAudioContext.currentTime + 0.15);

            gainNode.gain.setValueAtTime(0.2, fallbackAudioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, fallbackAudioContext.currentTime + 0.3);

            oscillator.start(fallbackAudioContext.currentTime);
            oscillator.stop(fallbackAudioContext.currentTime + 0.3);
        }

function login() {
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (password === 'romatyrok42') {
        isLoggedIn = true;
        isGuest = false;
        showGameSection();
        document.getElementById('button3').disabled = false;
        document.getElementById('statusMessage').classList.add('hidden');
        errorDiv.textContent = '';
        
        // Load current click count from GitHub
        loadClickCount();
    } else {
        errorDiv.textContent = 'Неверный пароль!';
    }
}

function loginAsGuest() {
    isGuest = true;
    isLoggedIn = false;
    showGameSection();
    document.getElementById('statusMessage').classList.remove('hidden');
    document.getElementById('button3').disabled = true;
    
    // Load current click count from GitHub for viewing
    loadClickCount();
}

function showGameSection() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('gameSection').classList.remove('hidden');
    document.getElementById('statsSection').classList.remove('hidden');
}

async function loadClickCount() {
    if (!githubConfig.username || !githubConfig.token || 
        githubConfig.username === 'YOUR_GITHUB_USERNAME' || 
        githubConfig.token === 'YOUR_GITHUB_TOKEN') {
        document.getElementById('githubStatus').textContent = 'Не настроен';
        return;
    }
    
    try {
        const response = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/clicks.json`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const content = JSON.parse(atob(data.content));
            clickCount = content.clicks || 0;
            updateDisplay();
            document.getElementById('githubStatus').textContent = 'Подключен';
            document.getElementById('lastUpdate').textContent = new Date(content.lastUpdate).toLocaleString();
        } else if (response.status === 404) {
            // File doesn't exist yet, will be created on first click
            document.getElementById('githubStatus').textContent = 'Готов к синхронизации';
        }
    } catch (error) {
        console.error('Error loading click count:', error);
        document.getElementById('githubStatus').textContent = 'Ошибка подключения';
    }
}

async function saveClickCount() {
    if (!githubConfig.username || !githubConfig.token) return;
    
    const data = {
        clicks: clickCount,
        lastUpdate: new Date().toISOString()
    };
    
    try {
        // First, try to get the current file to get its SHA
        let sha = null;
        try {
            const getResponse = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/clicks.json`, {
                headers: {
                    'Authorization': `token ${githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (getResponse.ok) {
                const currentData = await getResponse.json();
                sha = currentData.sha;
            }
        } catch (e) {
            // File doesn't exist, which is fine for creation
        }
        
        const body = {
            message: `Update click count to ${clickCount}`,
            content: btoa(JSON.stringify(data, null, 2))
        };
        
        if (sha) {
            body.sha = sha;
        }
        
        const response = await fetch(`https://api.github.com/repos/${githubConfig.username}/${githubConfig.repo}/contents/clicks.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            document.getElementById('githubStatus').textContent = 'Синхронизировано';
            document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Error saving click count:', error);
        document.getElementById('githubStatus').textContent = 'Ошибка сохранения';
    }
}

function addOne() {
    if (!isLoggedIn || isGuest) return;
    
    clickCount++;
    updateDisplay();
    playPigSound();
    
    // Save to GitHub (with debouncing to avoid too many API calls)
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(saveClickCount, 1000);
}

function updateDisplay() {
    document.getElementById('number3').textContent = clickCount;
}

// Handle Enter key for login
document.getElementById('loginPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        login();
    }
});

// Initialize the game
window.onload = function() {
    // Disable the button initially
    document.getElementById('button3').disabled = true;
    if (localStorage.getItem('pigClickerLoggedIn') === 'true') {
        isLoggedIn = true;
        showGameSection();
        document.getElementById('button3').disabled = false;
        document.getElementById('statusMessage').classList.add('hidden');
        loadClickCount();
    }
};

// Initialize audio context on first user interaction
document.addEventListener('click', function initAudio() {
    document.removeEventListener('click', initAudio);
});
