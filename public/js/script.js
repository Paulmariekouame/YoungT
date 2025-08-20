// @ts-nocheck
import { setupAuthStateListener } from './auth.js';
import { showNotification } from './notifications.js';
import { 
  displayFeaturedArtists, 
  displayTrendingTracks, 
  displayDiscoverTracks,
  displayPodcasts, 
  displayAllArtists 
} from './content.js';

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('overlay');

  if (!mobileMenuBtn || !mobileMenu || !overlay) return;

  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    }
  });

  overlay.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  });

  const navLinks = document.querySelectorAll('.mobile-menu .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
  });
}

function setupTrackControls() {
  // Écouter les clics sur les boutons de lecture
  document.addEventListener('click', (e) => {
    // Lecture des titres
    if (e.target.closest('.play-track-btn')) {
      const button = e.target.closest('.play-track-btn');
      const trackId = button.dataset.trackId;
      const icon = button.querySelector('i');
      
      if (icon) {
        icon.classList.toggle('fa-play');
        icon.classList.toggle('fa-pause');
        // Ajouter la logique de lecture/pause ici
        console.log("Lecture du titre:", trackId);
        showNotification("Lecture en cours...", "info");
      }
    }
    
    // Lecture des podcasts
    if (e.target.closest('.play-podcast-btn')) {
      const button = e.target.closest('.play-podcast-btn');
      const podcastId = button.dataset.podcastId;
      const icon = button.querySelector('i');
      
      if (icon) {
        icon.classList.toggle('fa-play');
        icon.classList.toggle('fa-pause');
        // Ajouter la logique de lecture/pause ici
        console.log("Lecture du podcast:", podcastId);
        showNotification("Lecture du podcast en cours...", "info");
      }
    }
    
    // Like des titres
    if (e.target.closest('.like-btn')) {
      const button = e.target.closest('.like-btn');
      const trackId = button.dataset.trackId;
      const icon = button.querySelector('i');
      
      if (icon) {
        icon.classList.toggle('fas');
        icon.classList.toggle('far');
        // Ajouter la logique de like ici
        console.log("Like du titre:", trackId);
        const action = icon.classList.contains('fas') ? 'ajouté aux' : 'retiré des';
        showNotification(`Titre ${action} favoris`, "success");
      }
    }
    
    // Partage des titres
    if (e.target.closest('.share-btn')) {
      const button = e.target.closest('.share-btn');
      const trackId = button.dataset.trackId;
      
      // Ajouter la logique de partage ici
      console.log("Partage du titre:", trackId);
      showNotification("Fonction de partage bientôt disponible!", "info");
    }
    
    // Partage des podcasts
    if (e.target.closest('.share-podcast-btn')) {
      const button = e.target.closest('.share-podcast-btn');
      const podcastId = button.dataset.podcastId;
      
      // Ajouter la logique de partage ici
      console.log("Partage du podcast:", podcastId);
      showNotification("Fonction de partage bientôt disponible!", "info");
    }
  });
}

// Fonction pour initialiser l'affichage dynamique en fonction de la page
function initializeDynamicContent() {
  // Page d'accueil
  if (document.getElementById('featuredArtists')) {
    displayFeaturedArtists();
  }
  
  if (document.getElementById('trendingTracks')) {
    displayTrendingTracks();
  }
  
  // Page de découverte
  if (document.getElementById('tracksList')) {
    displayDiscoverTracks();
  }
  
  // Page de podcasts
  if (document.getElementById('podcastsList')) {
    displayPodcasts();
  }
  
  // Page d'artistes
  if (document.getElementById('artistsGrid')) {
    displayAllArtists();
  }
  
  // Page de profil artiste
  if (document.getElementById('artistProfile')) {
    const urlParams = new URLSearchParams(window.location.search);
    const artistId = urlParams.get('id');
    if (artistId) {
      import('./content.js').then(module => {
        module.displayArtistProfile(artistId);
      });
    }
  }
}

// Fonction pour gérer les filtres de genre
function setupGenreFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Retirer la classe active de tous les boutons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Ajouter la classe active au bouton cliqué
      button.classList.add('active');
      
      // Filtrer les éléments par genre
      const genre = button.dataset.genre;
      filterTracksByGenre(genre);
    });
  });
}

function filterTracksByGenre(genre) {
  const trackItems = document.querySelectorAll('.track-item');
  
  trackItems.forEach(item => {
    if (genre === 'Tous' || item.dataset.genre === genre) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Fonction pour la recherche
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterTracksBySearch(searchTerm);
    });
  }
}

function filterTracksBySearch(searchTerm) {
  const trackItems = document.querySelectorAll('.track-item');
  
  trackItems.forEach(item => {
    const title = item.dataset.title || '';
    const artist = item.dataset.artist || '';
    
    if (title.includes(searchTerm) || artist.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

// Fonction pour gérer le défilement infini (optionnel)
function setupInfiniteScroll() {
  let isLoading = false;
  
  window.addEventListener('scroll', () => {
    if (isLoading) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    // Charger plus de contenu quand l'utilisateur est proche du bas
    if (scrollTop + clientHeight >= scrollHeight - 300) {
      isLoading = true;
      // Implémenter le chargement de contenu supplémentaire ici
      console.log("Chargement de contenu supplémentaire...");
      
      // Simuler un chargement
      setTimeout(() => {
        isLoading = false;
      }, 1000);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMobileMenu();
  setupTrackControls();
  setupAuthStateListener();
  initializeDynamicContent();
  setupGenreFilters();
  setupSearch();
  setupInfiniteScroll();
  
  // Gestion des notifications persistantes après redirection
  const urlParams = new URLSearchParams(window.location.search);
  const successMessage = urlParams.get('success');
  const errorMessage = urlParams.get('error');
  
  if (successMessage) {
    showNotification(decodeURIComponent(successMessage), 'success');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  if (errorMessage) {
    showNotification(decodeURIComponent(errorMessage), 'error');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

// Fonctions globales pour la compatibilité
window.filterTracks = function() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    filterTracksBySearch(searchInput.value.toLowerCase());
  }
};

window.filterByGenre = function(genre) {
  filterTracksByGenre(genre);
};

window.togglePlay = function(trackId) {
  const icon = document.getElementById(`play-icon-${trackId}`);
  if (icon) {
    icon.classList.toggle('fa-play');
    icon.classList.toggle('fa-pause');
    // Ajouter la logique de lecture/pause ici
    console.log("Lecture du titre:", trackId);
    showNotification("Lecture en cours...", "info");
  }
};

window.togglePlayPodcast = function(podcastId) {
  const icon = document.getElementById(`play-icon-podcast-${podcastId}`);
  if (icon) {
    icon.classList.toggle('fa-play');
    icon.classList.toggle('fa-pause');
    // Ajouter la logique de lecture/pause ici
    console.log("Lecture du podcast:", podcastId);
    showNotification("Lecture du podcast en cours...", "info");
  }
};

window.toggleLike = function(trackId) {
  const icon = document.getElementById(`like-icon-${trackId}`);
  if (icon) {
    icon.classList.toggle('far');
    icon.classList.toggle('fas');
    // Ajouter la logique de like ici
    console.log("Like du titre:", trackId);
    const action = icon.classList.contains('fas') ? 'ajouté aux' : 'retiré des';
    showNotification(`Titre ${action} favoris`, "success");
  }
};




window.shareTrack = function(trackId) {
  // Implémenter la logique de partage
  console.log("Partage du titre:", trackId);
  showNotification("Fonction de partage bientôt disponible!", "info");
};

window.sharePodcast = function(podcastId) {
  // Implémenter la logique de partage
  console.log("Partage du podcast:", podcastId);
  showNotification("Fonction de partage bientôt disponible!", "info");
};

window.isTrackLiked = function(trackId) {
  // Vérifier si l'utilisateur a liké ce titre
  // Pour l'instant, retourner false
  return false;
};