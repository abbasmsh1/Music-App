let audioContext;
let audioElement;
let currentSong = null;

// Keyboard shortcuts
const SHORTCUTS = {
    'Space': 'Play/Pause',
    'ArrowRight': 'Next Song',
    'ArrowLeft': 'Previous Song',
    'ArrowUp': 'Volume Up',
    'ArrowDown': 'Volume Down',
    'M': 'Mute/Unmute',
    'L': 'Toggle Loop',
    'S': 'Toggle Shuffle',
    '?': 'Show Shortcuts'
};

let isShuffle = false;
let isLooping = false;
let previousVolume = 1;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioElement = new Audio();
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('ended', () => {
            document.getElementById('play-icon').textContent = 'play_arrow';
        });
    }
}

function playSong(url, title) {
    initAudio();
    
    if (currentSong === url) {
        togglePlay();
        return;
    }

    currentSong = url;
    audioElement.src = url;
    audioElement.play();
    document.getElementById('current-song').textContent = `Now Playing: ${title}`;
    document.getElementById('play-icon').textContent = 'pause';
}

function togglePlay() {
    if (!audioElement || !currentSong) return;

    if (audioElement.paused) {
        audioElement.play();
        document.getElementById('play-icon').textContent = 'pause';
    } else {
        audioElement.pause();
        document.getElementById('play-icon').textContent = 'play_arrow';
    }
}

function updateProgress() {
    const progress = document.getElementById('progress');
    const value = (audioElement.currentTime / audioElement.duration) * 100;
    progress.style.width = value + '%';
}

function showCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').classList.add('show');
}

function hideCreatePlaylistModal() {
    document.getElementById('createPlaylistModal').classList.remove('show');
}

async function createPlaylist(event) {
    event.preventDefault();
    const form = event.target;
    const title = form.title.value;

    try {
        const response = await fetch('/create_playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        });

        if (response.ok) {
            window.location.reload();
        } else {
            console.error('Failed to create playlist');
        }
    } catch (error) {
        console.error('Error:', error);
    }

    hideCreatePlaylistModal();
}

document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
        case 'Space':
            e.preventDefault();
            togglePlay();
            break;
        case 'ArrowRight':
            nextSong();
            break;
        case 'ArrowLeft':
            previousSong();
            break;
        case 'ArrowUp':
            e.preventDefault();
            adjustVolume(0.1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            adjustVolume(-0.1);
            break;
        case 'KeyM':
            toggleMute();
            break;
        case 'KeyL':
            toggleLoop();
            break;
        case 'KeyS':
            toggleShuffle();
            break;
        case 'Slash':
            if (e.shiftKey) toggleShortcutsPanel();
            break;
    }
});

function adjustVolume(delta) {
    if (!audioElement) return;
    const newVolume = Math.max(0, Math.min(1, audioElement.volume + delta));
    audioElement.volume = newVolume;
    volumeSlider.value = newVolume * 100;
    volumeLevel.textContent = `${Math.round(newVolume * 100)}%`;
}

function toggleMute() {
    if (!audioElement) return;
    if (audioElement.volume > 0) {
        previousVolume = audioElement.volume;
        adjustVolume(-previousVolume);
    } else {
        adjustVolume(previousVolume);
    }
}

function toggleLoop() {
    if (!audioElement) return;
    isLooping = !isLooping;
    audioElement.loop = isLooping;
    showNotification(`Loop ${isLooping ? 'enabled' : 'disabled'}`);
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    showNotification(`Shuffle ${isShuffle ? 'enabled' : 'disabled'}`);
}

// Create shortcuts panel
const shortcutsPanel = document.createElement('div');
shortcutsPanel.className = 'keyboard-shortcuts';
shortcutsPanel.innerHTML = `
    <h3>Keyboard Shortcuts</h3>
    <div class="shortcut-list">
        ${Object.entries(SHORTCUTS).map(([key, action]) => `
            <div class="shortcut-item">
                <span class="shortcut-key">${key}</span>
                <span>${action}</span>
            </div>
        `).join('')}
    </div>
`;
document.body.appendChild(shortcutsPanel);

function toggleShortcutsPanel() {
    shortcutsPanel.classList.toggle('show');
}

// Context menu
const contextMenu = document.createElement('div');
contextMenu.className = 'context-menu';
document.body.appendChild(contextMenu);

document.addEventListener('contextmenu', (e) => {
    const songItem = e.target.closest('.song-item');
    if (!songItem) return;

    e.preventDefault();
    const songId = songItem.dataset.songId;
    const songTitle = songItem.querySelector('.song-title').textContent;

    contextMenu.innerHTML = `
        <div class="context-menu-item" onclick="playSong('${songItem.dataset.filePath}', '${songTitle}')">
            <span class="material-icons">play_arrow</span>
            Play
        </div>
        <div class="context-menu-item" onclick="addToQueue('${songItem.dataset.filePath}', '${songTitle}')">
            <span class="material-icons">queue_music</span>
            Add to Queue
        </div>
        <div class="context-menu-separator"></div>
        <div class="context-menu-item" onclick="showAddToPlaylistModal(${songId})">
            <span class="material-icons">playlist_add</span>
            Add to Playlist
        </div>
    `;

    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
});

document.addEventListener('click', () => {
    contextMenu.style.display = 'none';
});

// Progress bar preview
const progressBar = document.querySelector('.progress');
const progressPreview = document.createElement('div');
progressPreview.className = 'progress-preview';
progressBar.appendChild(progressPreview);

progressBar.addEventListener('mousemove', (e) => {
    if (!audioElement || !audioElement.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * audioElement.duration;
    
    progressPreview.style.left = `${e.clientX - rect.left}px`;
    progressPreview.textContent = formatTime(time);
});

progressBar.addEventListener('click', (e) => {
    if (!audioElement || !audioElement.duration) return;
    
    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioElement.currentTime = percent * audioElement.duration;
});

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Queue management
let queue = [];

function addToQueue(url, title) {
    queue.push({ url, title });
    showNotification(`Added "${title}" to queue`);
}

audioElement.addEventListener('ended', () => {
    if (isLooping) {
        audioElement.play();
    } else if (queue.length > 0) {
        const next = isShuffle ? queue.splice(Math.floor(Math.random() * queue.length), 1)[0] : queue.shift();
        playSong(next.url, next.title);
    }
}); 