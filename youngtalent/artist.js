// Artist Page JavaScript
let currentAudio = null;
let isPlaying = false;
let currentTrackId = null;
let currentTrackIndex = 0;
let playlist = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePlaylist();
    setupEventListeners();
});

// Initialize playlist from tracks on page
function initializePlaylist() {
    const trackItems = document.querySelectorAll('.track-item');
    playlist = Array.from(trackItems).map((item, index) => ({
        id: item.dataset.trackId,
        index: index,
        element: item
    }));
}

// Setup event listeners
function setupEventListeners() {
    // Volume slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            if (currentAudio) {
                currentAudio.volume = this.value / 100;
            }
        });
    }

    // Progress bar click
    const progressBar = document.querySelector('.progress');
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            if (currentAudio) {
                const rect = this.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                currentAudio.currentTime = percent * currentAudio.duration;
            }
        });
    }
}

// Play track function
function playTrack(trackId, title, artist) {
    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Update current track info
    currentTrackId = trackId;
    currentTrackIndex = playlist.findIndex(track => track.id == trackId);

    // Create new audio element
    currentAudio = new Audio(`uploads/tracks/track_${trackId}.mp3`);
    
    // Update player UI
    updatePlayerUI(title, artist);
    showPlayer();

    // Setup audio event listeners
    setupAudioEventListeners();

    // Play the track
    currentAudio.play().then(() => {
        isPlaying = true;
        updatePlayButton(true);
        updateTrackPlayButton(trackId, true);
    }).catch(error => {
        console.error('Error playing track:', error);
        showNotification('Erreur lors de la lecture', 'error');
    });

    // Update play count (you can make an AJAX call here)
    updatePlayCount(trackId);
}

// Play podcast function
function playPodcast(podcastId, title, artist) {
    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    // Create new audio element for podcast
    currentAudio = new Audio(`uploads/podcasts/podcast_${podcastId}.mp3`);
    
    // Update player UI
    updatePlayerUI(title, artist, true);
    showPlayer();

    // Setup audio event listeners
    setupAudioEventListeners();

    // Play the podcast
    currentAudio.play().then(() => {
        isPlaying = true;
        updatePlayButton(true);
    }).catch(error => {
        console.error('Error playing podcast:', error);
        showNotification('Erreur lors de la lecture', 'error');
    });

    // Update play count
    updatePodcastPlayCount(podcastId);
}

// Setup audio event listeners
function setupAudioEventListeners() {
    if (!currentAudio) return;

    currentAudio.addEventListener('loadedmetadata', function() {
        document.getElementById('total-time').textContent = formatTime(this.duration);
    });

    currentAudio.addEventListener('timeupdate', function() {
        const progress = (this.currentTime / this.duration) * 100;
        document.getElementById('progress-bar').style.width = progress + '%';
        document.getElementById('current-time').textContent = formatTime(this.currentTime);
    });

    currentAudio.addEventListener('ended', function() {
        nextTrack();
    });

    currentAudio.addEventListener('error', function() {
        showNotification('Erreur lors du chargement du fichier audio', 'error');
    });
}

// Update player UI
function updatePlayerUI(title, artist, isPodcast = false) {
    document.getElementById('current-track-title').textContent = title;
    document.getElementById('current-track-artist').textContent = artist;
    
    // Update image (you can add logic to show track/podcast image)
    const defaultImage = isPodcast ? '/placeholder.svg?height=50&width=50&text=Podcast' : '/placeholder.svg?height=50&width=50&text=Music';
    document.getElementById('current-track-image').src = defaultImage;
}

// Show player
function showPlayer() {
    const player = document.getElementById('music-player');
    if (player) {
        player.classList.remove('d-none');
        // Add padding to body to account for fixed player
        document.body.style.paddingBottom = '100px';
    }
}

// Hide player
function hidePlayer() {
    const player = document.getElementById('music-player');
    if (player) {
        player.classList.add('d-none');
        document.body.style.paddingBottom = '0';
    }
}

// Toggle play/pause
function togglePlayPause() {
    if (!currentAudio) return;

    if (isPlaying) {
        currentAudio.pause();
        isPlaying = false;
        updatePlayButton(false);
        updateTrackPlayButton(currentTrackId, false);
    } else {
        currentAudio.play().then(() => {
            isPlaying = true;
            updatePlayButton(true);
            updateTrackPlayButton(currentTrackId, true);
        });
    }
}

// Update play button
function updatePlayButton(playing) {
    const playBtn = document.getElementById('play-pause-btn');
    const icon = playBtn.querySelector('i');
    
    if (playing) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    }
}

// Update track play button
function updateTrackPlayButton(trackId, playing) {
    const trackItem = document.querySelector(`[data-track-id="${trackId}"]`);
    if (trackItem) {
        const playBtn = trackItem.querySelector('.play-btn i');
        if (playing) {
            playBtn.classList.remove('fa-play');
            playBtn.classList.add('fa-pause');
        } else {
            playBtn.classList.remove('fa-pause');
            playBtn.classList.add('fa-play');
        }
    }
}

// Previous track
function previousTrack() {
    if (playlist.length === 0) return;
    
    currentTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1;
    const track = playlist[currentTrackIndex];
    const trackElement = track.element;
    const title = trackElement.querySelector('h6').textContent;
    const artist = document.querySelector('.artist-name').textContent;
    
    playTrack(track.id, title, artist);
}

// Next track
function nextTrack() {
    if (playlist.length === 0) return;
    
    currentTrackIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0;
    const track = playlist[currentTrackIndex];
    const trackElement = track.element;
    const title = trackElement.querySelector('h6').textContent;
    const artist = document.querySelector('.artist-name').textContent;
    
    playTrack(track.id, title, artist);
}

// Play random track
function playRandomTrack() {
    if (playlist.length === 0) {
        showNotification('Aucune musique disponible', 'warning');
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * playlist.length);
    const track = playlist[randomIndex];
    const trackElement = track.element;
    const title = trackElement.querySelector('h6').textContent;
    const artist = document.querySelector('.artist-name').textContent;
    
    currentTrackIndex = randomIndex;
    playTrack(track.id, title, artist);
}

// Toggle mute
function toggleMute() {
    if (!currentAudio) return;
    
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    
    if (currentAudio.muted) {
        currentAudio.muted = false;
        volumeBtn.classList.remove('fa-volume-mute');
        volumeBtn.classList.add('fa-volume-up');
        volumeSlider.value = currentAudio.volume * 100;
    } else {
        currentAudio.muted = true;
        volumeBtn.classList.remove('fa-volume-up');
        volumeBtn.classList.add('fa-volume-mute');
        volumeSlider.value = 0;
    }
}

// Toggle like
function toggleLike() {
    if (!currentTrackId) return;
    
    const likeBtn = document.getElementById('like-btn');
    const isLiked = likeBtn.classList.contains('text-danger');
    
    // Make AJAX call to toggle like
    fetch('ajax/toggle_like.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_id: currentTrackId,
            action: isLiked ? 'unlike' : 'like'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isLiked) {
                likeBtn.classList.remove('text-danger');
                likeBtn.classList.add('text-white');
            } else {
                likeBtn.classList.remove('text-white');
                likeBtn.classList.add('text-danger');
            }
            showNotification(data.message, 'success');
        }
    })
    .catch(error => {
        console.error('Error toggling like:', error);
    });
}

// Share artist
function shareArtist() {
    const artistName = document.querySelector('.artist-name').textContent;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: `${artistName} - Young Talent`,
            text: `Découvrez ${artistName} sur Young Talent`,
            url: url
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Lien copié dans le presse-papiers', 'success');
        });
    }
}

// Share track
function shareTrack(trackId) {
    const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
    const title = trackElement.querySelector('h6').textContent;
    const artist = document.querySelector('.artist-name').textContent;
    const url = `${window.location.origin}/track.php?id=${trackId}`;
    
    if (navigator.share) {
        navigator.share({
            title: `${title} - ${artist}`,
            text: `Écoutez "${title}" de ${artist} sur Young Talent`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Lien copié dans le presse-papiers', 'success');
        });
    }
}

// Like track
function likeTrack(trackId) {
    fetch('ajax/toggle_like.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_id: trackId,
            action: 'like'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Ajouté aux favoris', 'success');
            // Update like count in UI
            const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
            const likeCount = trackElement.querySelector('.fa-heart').nextElementSibling;
            if (likeCount) {
                likeCount.textContent = parseInt(likeCount.textContent.replace(/[^\d]/g, '')) + 1;
            }
        }
    })
    .catch(error => {
        console.error('Error liking track:', error);
    });
}

// Add to playlist
function addToPlaylist(trackId) {
    // This would open a modal to select playlist
    showNotification('Fonctionnalité à venir', 'info');
}

// Update play count
function updatePlayCount(trackId) {
    fetch('ajax/update_play_count.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            track_id: trackId,
            type: 'track'
        })
    })
    .catch(error => {
        console.error('Error updating play count:', error);
    });
}

// Update podcast play count
function updatePodcastPlayCount(podcastId) {
    fetch('ajax/update_play_count.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            podcast_id: podcastId,
            type: 'podcast'
        })
    })
    .catch(error => {
        console.error('Error updating podcast play count:', error);
    });
}

// Format time helper
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.code) {
        case 'Space':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            previousTrack();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextTrack();
            break;
        case 'KeyM':
            e.preventDefault();
            toggleMute();
            break;
    }
});