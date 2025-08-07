// script.js - Fonctionnalités pour la page des artistes
// @ts-nocheck
document.addEventListener('DOMContentLoaded', function() {
    // Animation au chargement
    animateArtistCards();
    
    // Gestion des favoris
    setupFavoriteButtons();
});

function animateArtistCards() {
    const cards = document.querySelectorAll('.artist-card-detailed');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.5s ease ${index * 0.1}s`;
        
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    });
}

function setupFavoriteButtons() {
    // Implémentation de la fonctionnalité "favoris"
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const artistId = this.dataset.artistId;
            // Ajouter/retirer des favoris via API
            toggleFavorite(artistId);
        });
    });
}

function toggleFavorite(artistId) {
    // Simulation d'appel API
    console.log(`Toggle favorite for artist ${artistId}`);
    // Implémentation réelle avec fetch() ou axios
}