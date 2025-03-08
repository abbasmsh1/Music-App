let audioContext;
let audioElement;
let currentSong = null;

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