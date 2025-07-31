// Podcast JavaScript - Young Talent
document.addEventListener('DOMContentLoaded', function() {
    initializePodcastPlayer();
    initializePodcastActions();
    initializeShareFunctions();
});

// Variables globales
let audioElement;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let playbackSpeed = 1;

// Initialiser le lecteur audio
function initializePodcastPlayer() {
    audioElement = document.getElementById('audioElement');
    
    if (!audioElement) return;
    
    // Éléments de contrôle
    const playPauseBtn = document.getElementById('playPauseBtn');
    const mainPlayBtn = document.getElementById('mainPlayBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const currentTimeDisplay = document.getElementById('currentTime');
    const totalTimeDisplay = document.getElementById('totalTime');
    const volumeBtn = document.getElementById('volumeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const speedBtn = document.getElementById('speedBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Event listeners pour l'audio
    audioElement.addEventListener('loadedmetadata', function() {
        duration = audioElement.duration;
        totalTimeDisplay.textContent = formatTime(duration);
        
        // Mettre à jour les données globales
        if (window.podcastData) {
            window.podcastData.duration = duration;
        }
    });
    
    audioElement.addEventListener('timeupdate', function() {
        currentTime = audioElement.currentTime;
        const progress = (currentTime / duration) * 100;
        
        progressFill.style.width = progress + '%';
        currentTimeDisplay.textContent = formatTime(currentTime);
        
        // Mettre à jour le mini-player si disponible
        if (window.YT && window.YT.footer && window.YT.footer.updateMiniPlayerProgress) {
            window.YT.footer.updateMiniPlayerProgress(progress);
        }
    });
    
    audioElement.addEventListener('play', function() {
        isPlaying = true;
        updatePlayButtons(true);
        
        // Afficher le mini-player
        if (window.YT && window.YT.footer && window.YT.footer.showMiniPlayer) {
            window.YT.footer.showMiniPlayer(window.podcastData);
        }
        
        // Tracking
        trackEvent('podcast_play', {
            podcast_id: window.podcastData.id,
            podcast_title: window.podcastData.title,
            artist: window.podcastData.artist
        });
    });
    
    audioElement.addEventListener('pause', function() {
        isPlaying = false;
        updatePlayButtons(false);
        
        // Tracking
        trackEvent('podcast_pause', {
            podcast_id: window.podcastData.id,
            current_time: currentTime,
            progress: (currentTime / duration) * 100
        });
    });
    
    audioElement.addEventListener('ended', function() {
        isPlaying = false;
        updatePlayButtons(false);
        
        // Reset progress
        progressFill.style.width = '0%';
        currentTimeDisplay.textContent = '00:00';
        
        // Tracking
        trackEvent('podcast_complete', {
            podcast_id: window.podcastData.id,
            duration: duration
        });
    });
    
    audioElement.addEventListener('error', function(e) {
        console.error('Erreur audio:', e);
        showToast('Erreur lors du chargement de l\'audio', 'error');
    });
    
    // Contrôles play/pause
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
    }
    
    if (mainPlayBtn) {
        mainPlayBtn.addEventListener('click', togglePlayPause);
    }
    
    // Barre de progression
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progressWidth = rect.width;
            const clickProgress = (clickX / progressWidth) * 100;
            
            const newTime = (clickProgress / 100) * duration;
            audioElement.currentTime = newTime;
            
            // Tracking
            trackEvent('podcast_seek', {
                podcast_id: window.podcastData.id,
                from_time: currentTime,
                to_time: newTime
            });
        });
    }
    
    // Contrôle du volume
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            audioElement.volume = volume;
            
            // Mettre à jour l'icône
            updateVolumeIcon(volume);
        });
    }
    
    if (volumeBtn) {
        volumeBtn.addEventListener('click', function() {
            if (audioElement.muted) {
                audioElement.muted = false;
                volumeSlider.value = audioElement.volume * 100;
            } else {
                audioElement.muted = true;
                volumeSlider.value = 0;
            }
            
            updateVolumeIcon(audioElement.muted ? 0 : audioElement.volume);
        });
    }
    
    // Contrôle de la vitesse
    if (speedBtn) {
        speedBtn.addEventListener('click', function() {
            const speedModal = new bootstrap.Modal(document.getElementById('speedModal'));
            speedModal.show();
        });
    }
    
    // Téléchargement
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (window.podcastData.audioUrl) {
                const link = document.createElement('a');
                link.href = window.podcastData.audioUrl;
                link.download = `${window.podcastData.title} - ${window.podcastData.artist}.mp3`;
                link.click();
                
                // Tracking
                trackEvent('podcast_download', {
                    podcast_id: window.podcastData.id
                });
            }
        });
    }
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
        // Espace pour play/pause
        if (e.code === 'Space' && !isInputFocused()) {
            e.preventDefault();
            togglePlayPause();
        }
        
        // Flèches pour navigation
        if (e.code === 'ArrowLeft' && !isInputFocused()) {
            e.preventDefault();
            audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
        }
        
        if (e.code === 'ArrowRight' && !isInputFocused()) {
            e.preventDefault();
            audioElement.currentTime = Math.min(duration, audioElement.currentTime + 10);
        }
        
        // Volume
        if (e.code === 'ArrowUp' && !isInputFocused()) {
            e.preventDefault();
            audioElement.volume = Math.min(1, audioElement.volume + 0.1);
            volumeSlider.value = audioElement.volume * 100;
            updateVolumeIcon(audioElement.volume);
        }
        
        if (e.code === 'ArrowDown' && !isInputFocused()) {
            e.preventDefault();
            audioElement.volume = Math.max(0, audioElement.volume - 0.1);
            volumeSlider.value = audioElement.volume * 100;
            updateVolumeIcon(audioElement.volume);
        }
        
        // Mute
        if (e.code === 'KeyM' && !isInputFocused()) {
            e.preventDefault();
            audioElement.muted = !audioElement.muted;
            updateVolumeIcon(audioElement.muted ? 0 : audioElement.volume);
        }
    });
}

// Fonctions utilitaires du lecteur
function togglePlayPause() {
    if (isPlaying) {
        audioElement.pause();
    } else {
        audioElement.play().catch(error => {
            console.error('Erreur lecture:', error);
            showToast('Impossible de lire l\'audio', 'error');
        });
    }
}

function updatePlayButtons(playing) {
    const playPauseBtn = document.getElementById('playPauseBtn');
    const mainPlayBtn = document.getElementById('mainPlayBtn');
    
    const icon = playing ? 'fa-pause' : 'fa-play';
    
    if (playPauseBtn) {
        const iconElement = playPauseBtn.querySelector('i');
        iconElement.className = `fas ${icon}`;
    }
    
    if (mainPlayBtn) {
        const iconElement = mainPlayBtn.querySelector('i');
        iconElement.className = `fas ${icon}`;
    }
}

function updateVolumeIcon(volume) {
    const volumeBtn = document.getElementById('volumeBtn');
    if (!volumeBtn) return;
    
    const iconElement = volumeBtn.querySelector('i');
    
    if (volume === 0) {
        iconElement.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        iconElement.className = 'fas fa-volume-down';
    } else {
        iconElement.className = 'fas fa-volume-up';
    }
}

function setPlaybackSpeed(speed) {
    playbackSpeed = speed;
    audioElement.playbackRate = speed;
    
    // Mettre à jour l'affichage
    const speedText = document.querySelector('.speed-text');
    if (speedText) {
        speedText.textContent = speed + 'x';
    }
    
    // Fermer le modal
    const speedModal = bootstrap.Modal.getInstance(document.getElementById('speedModal'));
    if (speedModal) {
        speedModal.hide();
    }
    
    // Tracking
    trackEvent('podcast_speed_change', {
        podcast_id: window.podcastData.id,
        speed: speed
    });
    
    showToast(`Vitesse de lecture: ${speed}x`, 'info');
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    );
}

// Actions du podcast (like, commentaire)
function initializePodcastActions() {
    const likeBtn = document.getElementById('likeBtn');
    
    if (likeBtn) {
        likeBtn.addEventListener('click', function() {
            const podcastId = this.dataset.podcastId;
            const isLiked = this.dataset.liked === 'true';
            
            toggleLike(podcastId, isLiked);
        });
    }
    
    // Formulaire de commentaire
    const commentForm = document.querySelector('.comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Publication...';
            submitBtn.disabled = true;
            
            // Le formulaire sera soumis normalement, mais on peut ajouter une validation
            const textarea = this.querySelector('textarea[name="comment"]');
            if (textarea.value.trim().length < 5) {
                e.preventDefault();
                showToast('Le commentaire doit contenir au moins 5 caractères', 'error');
                
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Toggle like/unlike
function toggleLike(podcastId, isCurrentlyLiked) {
    const likeBtn = document.getElementById('likeBtn');
    const likeText = document.getElementById('likeText');
    const likesCount = document.getElementById('likesCount');
    
    // Désactiver le bouton temporairement
    likeBtn.disabled = true;
    
    fetch('podcast.php?id=' + podcastId, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `action=like&csrf_token=${encodeURIComponent(window.podcastData.csrfToken)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const newLikedState = data.liked;
            
            // Mettre à jour l'interface
            likeBtn.dataset.liked = newLikedState;
            likeText.textContent = newLikedState ? 'Aimé' : 'Aimer';
            
            // Mettre à jour le compteur
            const currentCount = parseInt(likesCount.textContent.replace(/[^\d]/g, ''));
            const newCount = newLikedState ? currentCount + 1 : currentCount - 1;
            likesCount.textContent = formatNumber(newCount);
            
            // Animation du bouton
            likeBtn.classList.add('animate__animated', 'animate__pulse');
            setTimeout(() => {
                likeBtn.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
            
            // Tracking
            trackEvent(newLikedState ? 'podcast_like' : 'podcast_unlike', {
                podcast_id: podcastId
            });
            
            showToast(newLikedState ? 'Podcast ajouté à vos favoris !' : 'Podcast retiré de vos favoris', 'success');
        } else {
            showToast('Erreur lors de l\'action', 'error');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        showToast('Erreur de connexion', 'error');
    })
    .finally(() => {
        likeBtn.disabled = false;
    });
}

// Fonctions de partage
function initializeShareFunctions() {
    // Les fonctions de partage sont définies globalement pour être accessibles depuis le HTML
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(window.podcastData.title);
    const description = encodeURIComponent(`Écoutez "${window.podcastData.title}" par ${window.podcastData.artist} sur Young Talent`);
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title} - ${description}`;
    
    openShareWindow(shareUrl, 'Facebook');
    
    trackEvent('podcast_share', {
        podcast_id: window.podcastData.id,
        platform: 'facebook'
    });
}

function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`🎧 Écoutez "${window.podcastData.title}" par ${window.podcastData.artist} sur @YoungTalent`);
    
    const shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}&hashtags=podcast,youngtalent,musique`;
    
    openShareWindow(shareUrl, 'Twitter');
    
    trackEvent('podcast_share', {
        podcast_id: window.podcastData.id,
        platform: 'twitter'
    });
}

function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`🎧 Écoute ce podcast génial: "${window.podcastData.title}" par ${window.podcastData.artist}\n\n${window.location.href}`);
    
    const shareUrl = `https://wa.me/?text=${text}`;
    
    if (isMobile()) {
        window.location.href = shareUrl;
    } else {
        openShareWindow(shareUrl, 'WhatsApp');
    }
    
    trackEvent('podcast_share', {
        podcast_id: window.podcastData.id,
        platform: 'whatsapp'
    });
}

function copyLink() {
    const shareUrl = document.getElementById('shareUrl');
    const url = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('Lien copié dans le presse-papiers !', 'success');
        }).catch(() => {
            fallbackCopyText(url);
        });
    } else {
        fallbackCopyText(url);
    }
    
    trackEvent('podcast_share', {
        podcast_id: window.podcastData.id,
        platform: 'copy_link'
    });
}

function fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showToast('Lien copié dans le presse-papiers !', 'success');
    } catch (err) {
        showToast('Impossible de copier le lien', 'error');
    }
    
    document.body.removeChild(textArea);
}

function openShareWindow(url, platform) {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
        url,
        `share-${platform}`,
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
}

// Fonctions utilitaires
function scrollToComments() {
    const commentsSection = document.getElementById('commentsSection');
    if (commentsSection) {
        commentsSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Focus sur le textarea si connecté
        setTimeout(() => {
            const textarea = document.querySelector('.comment-form textarea');
            if (textarea) {
                textarea.focus();
            }
        }, 500);
    }
}

function addToPlaylist() {
    if (!window.YT.isLoggedIn) {
        showToast('Connectez-vous pour ajouter à une playlist', 'info');
        setTimeout(() => {
            window.location.href = 'login.php';
        }, 2000);
        return;
    }
    
    // Ouvrir le modal de sélection de playlist (à implémenter)
    showToast('Fonctionnalité à venir !', 'info');
    
    trackEvent('podcast_add_to_playlist_attempt', {
        podcast_id: window.podcastData.id
    });
}

function formatNumber(number) {
    if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
    } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
    }
    return number.toString();
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function trackEvent(eventName, parameters) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Console log pour debug
    if (window.YT && window.YT.isDevelopment) {
        console.log('Track Event:', eventName, parameters);
    }
}

function showToast(message, type = 'info') {
    // Utiliser la fonction toast du header si disponible
    if (window.YT && window.YT.header && window.YT.header.showToast) {
        window.YT.header.showToast(message, type);
    } else if (window.YT && window.YT.footer && window.YT.footer.showToast) {
        window.YT.footer.showToast(message, type);
    } else {
        // Fallback
        alert(message);
    }
}

// Initialisation automatique du mini-player si un podcast est en cours
window.addEventListener('load', function() {
    // Vérifier si un podcast était en cours de lecture
    const savedPodcast = localStorage.getItem('currentPodcast');
    if (savedPodcast) {
        try {
            const podcastData = JSON.parse(savedPodcast);
            if (podcastData.id === window.podcastData.id && podcastData.currentTime > 0) {
                audioElement.currentTime = podcastData.currentTime;
                
                // Demander si l'utilisateur veut reprendre
                if (confirm(`Reprendre la lecture à ${formatTime(podcastData.currentTime)} ?`)) {
                    audioElement.play();
                }
            }
        } catch (e) {
            console.error('Erreur lors de la récupération du podcast sauvegardé:', e);
        }
    }
});

// Sauvegarder la progression avant de quitter
window.addEventListener('beforeunload', function() {
    if (audioElement && currentTime > 0) {
        const podcastData = {
            id: window.podcastData.id,
            currentTime: currentTime,
            timestamp: Date.now()
        };
        
        localStorage.setItem('currentPodcast', JSON.stringify(podcastData));
    }
});

// Export des fonctions pour usage global
window.podcastPlayer = {
    togglePlayPause,
    setPlaybackSpeed,
    shareOnFacebook,
    shareOnTwitter,
    shareOnWhatsApp,
    copyLink,
    scrollToComments,
    addToPlaylist
};