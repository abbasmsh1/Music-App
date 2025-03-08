// Queue management
let currentQueue = [];
let currentQueueIndex = -1;

function playPlaylist() {
    const songElements = document.querySelectorAll('.song-item');
    currentQueue = Array.from(songElements).map(el => ({
        url: el.getAttribute('data-file-path'),
        title: el.querySelector('.song-title').textContent
    }));
    currentQueueIndex = 0;
    playSong(currentQueue[0].url, currentQueue[0].title);
}

function nextSong() {
    if (currentQueue.length === 0) return;
    currentQueueIndex = (currentQueueIndex + 1) % currentQueue.length;
    playSong(currentQueue[currentQueueIndex].url, currentQueue[currentQueueIndex].title);
}

function previousSong() {
    if (currentQueue.length === 0) return;
    currentQueueIndex = (currentQueueIndex - 1 + currentQueue.length) % currentQueue.length;
    playSong(currentQueue[currentQueueIndex].url, currentQueue[currentQueueIndex].title);
}

// Drag and drop reordering
let draggedItem = null;

document.addEventListener('DOMContentLoaded', () => {
    const songList = document.querySelector('.song-list');
    if (!songList) return;

    const songs = songList.querySelectorAll('.song-item');
    songs.forEach(song => {
        song.setAttribute('draggable', true);
        
        song.addEventListener('dragstart', (e) => {
            draggedItem = song;
            e.dataTransfer.effectAllowed = 'move';
            song.classList.add('dragging');
        });

        song.addEventListener('dragend', () => {
            draggedItem = null;
            song.classList.remove('dragging');
        });

        song.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (song !== draggedItem) {
                const rect = song.getBoundingClientRect();
                const midY = rect.y + rect.height / 2;
                if (e.clientY < midY) {
                    song.parentNode.insertBefore(draggedItem, song);
                } else {
                    song.parentNode.insertBefore(draggedItem, song.nextSibling);
                }
            }
        });
    });
});

// Song search and filtering
function filterSongs() {
    const searchInput = document.getElementById('songSearch');
    const filter = searchInput.value.toLowerCase();
    const songs = document.querySelectorAll('.available-songs .song-item');

    songs.forEach(song => {
        const title = song.querySelector('.song-title').textContent.toLowerCase();
        song.style.display = title.includes(filter) ? '' : 'none';
    });
}

// Playlist management
async function addSongToPlaylist(playlistId, songId) {
    try {
        const response = await fetch(`/playlist/${playlistId}/songs/${songId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.location.reload();
        } else {
            showNotification('Failed to add song to playlist', 'error');
        }
    } catch (error) {
        showNotification('Error adding song to playlist', 'error');
    }
}

async function removeSongFromPlaylist(event, playlistId, songId) {
    event.stopPropagation();
    if (!confirm('Remove this song from the playlist?')) return;

    try {
        const response = await fetch(`/playlist/${playlistId}/songs/${songId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            const songElement = event.target.closest('.song-item');
            songElement.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                songElement.remove();
                updateSongCount();
            }, 300);
        } else {
            showNotification('Failed to remove song', 'error');
        }
    } catch (error) {
        showNotification('Error removing song', 'error');
    }
}

// UI feedback
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
}

function updateSongCount() {
    const songCount = document.querySelectorAll('.song-item').length;
    const countElement = document.querySelector('.playlist-info p');
    if (countElement) {
        countElement.textContent = `${songCount} songs`;
    }
}

// Modal management
function showAddSongsModal() {
    document.getElementById('addSongsModal').classList.add('show');
    document.getElementById('songSearch').focus();
}

function hideAddSongsModal() {
    document.getElementById('addSongsModal').classList.remove('show');
}

// Volume control
let volumeTimeout;
const volumeControl = document.createElement('div');
volumeControl.className = 'volume-control';
volumeControl.innerHTML = `
    <input type="range" min="0" max="100" value="100" class="volume-slider">
    <span class="volume-level">100%</span>
`;

document.querySelector('.controls').appendChild(volumeControl);

const volumeSlider = volumeControl.querySelector('.volume-slider');
const volumeLevel = volumeControl.querySelector('.volume-level');

volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value;
    if (audioElement) {
        audioElement.volume = volume / 100;
        volumeLevel.textContent = `${volume}%`;
    }
}); 