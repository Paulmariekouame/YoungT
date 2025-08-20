// @ts-nocheck
// content.js
import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc
} from './firebase.js';

import { showNotification } from './notifications.js';

// Fonction pour formater la durée
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Afficher les artistes en vedette
export async function displayFeaturedArtists() {
  try {
    const artistsContainer = document.getElementById('featuredArtists');
    if (!artistsContainer) return;

    // Récupérer les artistes (exemple: les 6 premiers)
    const artistsQuery = query(collection(db, "artists"), limit(6));
    const snapshot = await getDocs(artistsQuery);
    
    artistsContainer.innerHTML = '';
    
    if (snapshot.empty) {
      artistsContainer.innerHTML = '<p class="no-results">Aucun artiste à afficher pour le moment.</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const artist = doc.data();
      const artistElement = createArtistCard(artist, doc.id);
      artistsContainer.appendChild(artistElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des artistes:", error);
    const artistsContainer = document.getElementById('featuredArtists');
    if (artistsContainer) {
      artistsContainer.innerHTML = '<p class="error">Erreur de chargement des artistes.</p>';
    }
  }
}

// Créer une carte artiste
function createArtistCard(artist, artistId) {
  const card = document.createElement('div');
  card.className = 'artist-card';
  card.innerHTML = `
    <a href="html/artist-profile.html?id=${artistId}">
      <div class="artist-image">
        <img src="${artist.profile_picture || 'https://via.placeholder.com/150x150?text=Artiste'}" 
             alt="${artist.stage_name}" loading="lazy">
        ${artist.verified ? '<div class="verified-badge"><i class="fas fa-check"></i></div>' : ''}
      </div>
      <div class="artist-info">
        <h4>${artist.stage_name || 'Artiste inconnu'}</h4>
        <span class="genre-badge">${artist.genre || 'Inconnu'}</span>
        <div class="artist-stats">
          <span><i class="fas fa-headphones"></i> ${(artist.play_count || 0).toLocaleString()}</span>
          <span><i class="fas fa-users"></i> ${(artist.follower_count || 0).toLocaleString()}</span>
        </div>
      </div>
    </a>
  `;
  return card;
}

// Afficher les titres tendance sur la page d'accueil
export async function displayTrendingTracks() {
  try {
    const tracksContainer = document.getElementById('trendingTracks');
    if (!tracksContainer) return;

    // Récupérer les titres approuvés, triés par nombre d'écoutes
    const tracksQuery = query(
      collection(db, "tracks"), 
      where("status", "==", "approved"),
      orderBy("play_count", "desc"),
      limit(5)
    );
    
    const snapshot = await getDocs(tracksQuery);
    tracksContainer.innerHTML = '';
    
    if (snapshot.empty) {
      tracksContainer.innerHTML = '<p class="no-results">Aucun titre à afficher pour le moment.</p>';
      return;
    }
    
    snapshot.forEach((doc, index) => {
      const track = doc.data();
      const trackElement = createTrackElement(track, doc.id, index + 1);
      tracksContainer.appendChild(trackElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des titres:", error);
    const tracksContainer = document.getElementById('trendingTracks');
    if (tracksContainer) {
      tracksContainer.innerHTML = '<p class="error">Erreur de chargement des titres.</p>';
    }
  }
}

// Afficher les titres sur la page de découverte
export async function displayDiscoverTracks() {
  try {
    const tracksContainer = document.getElementById('tracksList');
    if (!tracksContainer) return;

    // Récupérer les titres approuvés, triés par date de création
    const tracksQuery = query(
      collection(db, "tracks"), 
      where("status", "==", "approved"),
      orderBy("created_at", "desc"),
      limit(20)
    );
    
    const snapshot = await getDocs(tracksQuery);
    tracksContainer.innerHTML = '';
    
    if (snapshot.empty) {
      tracksContainer.innerHTML = '<p class="no-results">Aucun titre à afficher pour le moment.</p>';
      return;
    }
    
    snapshot.forEach((doc, index) => {
      const track = doc.data();
      const trackElement = createDiscoverTrackElement(track, doc.id, index + 1);
      tracksContainer.appendChild(trackElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des titres:", error);
    const tracksContainer = document.getElementById('tracksList');
    if (tracksContainer) {
      tracksContainer.innerHTML = '<p class="error">Erreur de chargement des titres.</p>';
    }
  }
}

// Créer un élément de piste pour la page de découverte
function createDiscoverTrackElement(track, trackId, position) {
  const element = document.createElement('div');
  element.className = 'track-item';
  element.setAttribute('data-genre', track.genre || 'Inconnu');
  element.setAttribute('data-title', track.title.toLowerCase());
  element.setAttribute('data-artist', track.artist_name.toLowerCase());
  
  element.innerHTML = `
    <div class="track-info">
      <span class="track-number">${position}</span>
      <img src="${track.cover_url || 'https://via.placeholder.com/60x60?text=Track'}" 
           alt="${track.title}" class="track-image" loading="lazy">
      ${position <= 3 ? '<div class="hot-badge">🔥 HOT</div>' : ''}
      <div class="track-details">
        <h4>${track.title}</h4>
        <a href="artist-profile.html?id=${track.artist_id}" class="artist-link">${track.artist_name}</a>
        <div class="track-meta">
          <span class="genre-badge">${track.genre || 'Inconnu'}</span>
          <span>${formatDuration(track.duration)}</span>
        </div>
      </div>
    </div>
    <div class="track-stats">
      <div class="stat">
        <span>${(track.play_count || 0).toLocaleString()}</span>
        <small>Écoutes</small>
      </div>
      <div class="stat">
        <span>${(track.like_count || 0).toLocaleString()}</span>
        <small>Likes</small>
      </div>
    </div>
    <div class="track-actions">
      <button class="btn btn-primary btn-sm play-track-btn" data-track-id="${trackId}">
        <i class="fas fa-play" id="play-icon-${trackId}"></i>
      </button>
      <button class="btn-icon like-btn" data-track-id="${trackId}">
        <i class="${isTrackLiked(trackId) ? 'fas' : 'far'} fa-heart" id="like-icon-${trackId}"></i>
      </button>
      <button class="btn-icon share-btn" data-track-id="${trackId}">
        <i class="fas fa-share"></i>
      </button>
    </div>
  `;
  return element;
}

// Créer un élément de piste pour la page d'accueil
function createTrackElement(track, trackId, position) {
  const element = document.createElement('div');
  element.className = 'track-item';
  
  element.innerHTML = `
    <div class="track-info">
      <span class="track-number">${position}</span>
      <img src="${track.cover_url || 'https://via.placeholder.com/60x60?text=Track'}" 
           alt="${track.title}" class="track-image" loading="lazy">
      ${position <= 3 ? '<div class="hot-badge">🔥 HOT</div>' : ''}
      <div class="track-details">
        <h4>${track.title}</h4>
        <a href="html/artist-profile.html?id=${track.artist_id}">${track.artist_name}</a>
        <div class="track-meta">
          <span class="genre-badge">${track.genre || 'Inconnu'}</span>
          <span>${formatDuration(track.duration)}</span>
        </div>
        <div class="track-stats">
          <span><i class="fas fa-headphones"></i> ${(track.play_count || 0).toLocaleString()}</span>
          <span><i class="fas fa-heart"></i> ${(track.like_count || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div class="track-actions">
      <button class="btn btn-primary btn-sm play-track-btn" data-track-id="${trackId}">
        <i class="fas fa-play" id="play-icon-${trackId}"></i>
      </button>
      <button class="btn-icon like-btn" data-track-id="${trackId}">
        <i class="${isTrackLiked(trackId) ? 'fas' : 'far'} fa-heart" id="like-icon-${trackId}"></i>
      </button>
      <button class="btn-icon share-btn" data-track-id="${trackId}">
        <i class="fas fa-share"></i>
      </button>
    </div>
  `;
  return element;
}

// Afficher les podcasts
export async function displayPodcasts() {
  try {
    const podcastsContainer = document.getElementById('podcastsList');
    if (!podcastsContainer) return;

    // Récupérer les podcasts approuvés
    const podcastsQuery = query(
      collection(db, "podcasts"), 
      where("status", "==", "approved"),
      orderBy("created_at", "desc")
    );
    
    const snapshot = await getDocs(podcastsQuery);
    podcastsContainer.innerHTML = '';
    
    if (snapshot.empty) {
      podcastsContainer.innerHTML = '<p class="no-results">Aucun podcast à afficher pour le moment.</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const podcast = doc.data();
      const podcastElement = createPodcastElement(podcast, doc.id);
      podcastsContainer.appendChild(podcastElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des podcasts:", error);
    const podcastsContainer = document.getElementById('podcastsList');
    if (podcastsContainer) {
      podcastsContainer.innerHTML = '<p class="error">Erreur de chargement des podcasts.</p>';
    }
  }
}

// Créer un élément podcast
function createPodcastElement(podcast, podcastId) {
  const element = document.createElement('div');
  element.className = 'podcast-item';
  element.innerHTML = `
    <div class="podcast-image">
      <img src="${podcast.cover_url || 'https://via.placeholder.com/150x150?text=Podcast'}" 
           alt="${podcast.title}" loading="lazy">
    </div>
    <div class="podcast-content">
      <div class="podcast-header">
        <h3>${podcast.title}</h3>
        <a href="artist-profile.html?id=${podcast.artist_id}" class="host-link">par ${podcast.artist_name}</a>
      </div>
      <p class="podcast-description">${podcast.description || 'Aucune description disponible.'}</p>
      <div class="podcast-meta">
        <div class="meta-item">
          <i class="fas fa-clock"></i>
          <span>${formatDuration(podcast.duration)}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-users"></i>
          <span>${(podcast.play_count || 0).toLocaleString()} écoutes</span>
        </div>
      </div>
      <div class="podcast-actions">
        <button class="btn btn-primary play-podcast-btn" data-podcast-id="${podcastId}">
          <i class="fas fa-play" id="play-icon-podcast-${podcastId}"></i>
          Écouter
        </button>
        <button class="btn btn-outline btn-sm share-podcast-btn" data-podcast-id="${podcastId}">
          <i class="fas fa-share"></i>
          Partager
        </button>
      </div>
    </div>
  `;
  return element;
}

// Afficher les artistes sur la page artistes
export async function displayAllArtists() {
  try {
    const artistsContainer = document.getElementById('artistsGrid');
    if (!artistsContainer) return;

    const artistsQuery = query(collection(db, "artists"), orderBy("stage_name"));
    const snapshot = await getDocs(artistsQuery);
    
    artistsContainer.innerHTML = '';
    
    if (snapshot.empty) {
      artistsContainer.innerHTML = '<p class="no-results">Aucun artiste à afficher pour le moment.</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const artist = doc.data();
      const artistElement = createDetailedArtistCard(artist, doc.id);
      artistsContainer.appendChild(artistElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des artistes:", error);
    const artistsContainer = document.getElementById('artistsGrid');
    if (artistsContainer) {
      artistsContainer.innerHTML = '<p class="error">Erreur de chargement des artistes.</p>';
    }
  }
}

// Créer une carte artiste détaillée
function createDetailedArtistCard(artist, artistId) {
  const card = document.createElement('div');
  card.className = 'artist-card-detailed';
  card.innerHTML = `
    <div class="artist-image">
      <img src="${artist.profile_picture || 'https://via.placeholder.com/200x200?text=Artiste'}" 
           alt="${artist.stage_name}" loading="lazy">
      ${artist.verified ? '<div class="verified-badge"><i class="fas fa-star"></i></div>' : ''}
    </div>
    <div class="artist-info">
      <h4>${artist.stage_name || 'Artiste inconnu'}</h4>
      <span class="genre-badge">${artist.genre || 'Inconnu'}</span>
      <p class="artist-bio">${artist.bio || 'Aucune biographie disponible.'}</p>
      <div class="artist-stats">
        <div class="stat">
          <span class="stat-value">${(artist.follower_count || 0).toLocaleString()}</span>
          <span class="stat-label">Followers</span>
        </div>
        <div class="stat">
          <span class="stat-value">${(artist.track_count || 0).toLocaleString()}</span>
          <span class="stat-label">Titres</span>
        </div>
      </div>
      <a href="artist-profile.html?id=${artistId}" class="btn btn-secondary">
        <i class="fas fa-users"></i>
        Voir Profil
      </a>
    </div>
  `;
  return card;
}

// Afficher le profil d'un artiste spécifique
export async function displayArtistProfile(artistId) {
  try {
    // Récupérer les données de l'artiste
    const artistDoc = await getDoc(doc(db, "artists", artistId));
    
    if (!artistDoc.exists()) {
      document.getElementById('artistProfile').innerHTML = '<p class="error">Artiste non trouvé.</p>';
      return;
    }
    
    const artist = artistDoc.data();
    
    // Mettre à jour les informations de l'artiste
    document.getElementById('artistName').textContent = artist.stage_name || 'Artiste inconnu';
    document.getElementById('artistGenre').textContent = artist.genre || 'Inconnu';
    document.getElementById('artistLocation').textContent = artist.location || 'Non spécifié';
    document.getElementById('artistBio').textContent = artist.bio || 'Aucune biographie disponible.';
    document.getElementById('artistImage').src = artist.profile_picture || 'https://via.placeholder.com/300x300?text=Artiste';
    
    // Mettre à jour les stats
    document.getElementById('followerCount').textContent = (artist.follower_count || 0).toLocaleString();
    document.getElementById('trackCount').textContent = (artist.track_count || 0).toLocaleString();
    document.getElementById('playCount').textContent = (artist.play_count || 0).toLocaleString();
    
    // Afficher les liens sociaux
    const socialLinksContainer = document.getElementById('socialLinks');
    socialLinksContainer.innerHTML = '';
    
    if (artist.social_links) {
      Object.entries(artist.social_links).forEach(([platform, url]) => {
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.className = 'social-link';
          link.innerHTML = `<i class="fab fa-${platform}"></i>`;
          socialLinksContainer.appendChild(link);
        }
      });
    }
    
    // Charger les titres de l'artiste
    await displayArtistTracks(artistId);
    
    // Charger les podcasts de l'artiste
    await displayArtistPodcasts(artistId);
    
  } catch (error) {
    console.error("Erreur de chargement du profil artiste:", error);
    document.getElementById('artistProfile').innerHTML = '<p class="error">Erreur de chargement du profil.</p>';
  }
}

// Afficher les titres d'un artiste
async function displayArtistTracks(artistId) {
  try {
    const tracksContainer = document.getElementById('artistTracks');
    if (!tracksContainer) return;

    const tracksQuery = query(
      collection(db, "tracks"), 
      where("artist_id", "==", artistId),
      where("status", "==", "approved"),
      orderBy("created_at", "desc")
    );
    
    const snapshot = await getDocs(tracksQuery);
    tracksContainer.innerHTML = '';
    
    if (snapshot.empty) {
      tracksContainer.innerHTML = '<p class="no-results">Cet artiste n\'a pas encore publié de titres.</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const track = doc.data();
      const trackElement = createArtistTrackElement(track, doc.id);
      tracksContainer.appendChild(trackElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des titres de l'artiste:", error);
    const tracksContainer = document.getElementById('artistTracks');
    if (tracksContainer) {
      tracksContainer.innerHTML = '<p class="error">Erreur de chargement des titres.</p>';
    }
  }
}

// Créer un élément de piste pour le profil artiste
function createArtistTrackElement(track, trackId) {
  const element = document.createElement('div');
  element.className = 'track-item';
  element.innerHTML = `
    <div class="track-info">
      <img src="${track.cover_url || 'https://via.placeholder.com/60x60?text=Track'}" 
           alt="${track.title}" class="track-image" loading="lazy">
      <div class="track-details">
        <h4>${track.title}</h4>
        <div class="track-meta">
          <span class="genre-badge">${track.genre || 'Inconnu'}</span>
          <span>${formatDuration(track.duration)}</span>
        </div>
        <div class="track-stats">
          <span><i class="fas fa-headphones"></i> ${(track.play_count || 0).toLocaleString()}</span>
          <span><i class="fas fa-heart"></i> ${(track.like_count || 0).toLocaleString()}</span>
        </div>
      </div>
    </div>
    <div class="track-actions">
      <button class="btn btn-primary btn-sm play-track-btn" data-track-id="${trackId}">
        <i class="fas fa-play" id="play-icon-${trackId}"></i>
      </button>
      <button class="btn-icon like-btn" data-track-id="${trackId}">
        <i class="${isTrackLiked(trackId) ? 'fas' : 'far'} fa-heart" id="like-icon-${trackId}"></i>
      </button>
    </div>
  `;
  return element;
}

// Afficher les podcasts d'un artiste
async function displayArtistPodcasts(artistId) {
  try {
    const podcastsContainer = document.getElementById('artistPodcasts');
    if (!podcastsContainer) return;

    const podcastsQuery = query(
      collection(db, "podcasts"), 
      where("artist_id", "==", artistId),
      where("status", "==", "approved"),
      orderBy("created_at", "desc")
    );
    
    const snapshot = await getDocs(podcastsQuery);
    podcastsContainer.innerHTML = '';
    
    if (snapshot.empty) {
      podcastsContainer.innerHTML = '<p class="no-results">Cet artiste n\'a pas encore publié de podcasts.</p>';
      return;
    }
    
    snapshot.forEach(doc => {
      const podcast = doc.data();
      const podcastElement = createArtistPodcastElement(podcast, doc.id);
      podcastsContainer.appendChild(podcastElement);
    });
  } catch (error) {
    console.error("Erreur de chargement des podcasts de l'artiste:", error);
    const podcastsContainer = document.getElementById('artistPodcasts');
    if (podcastsContainer) {
      podcastsContainer.innerHTML = '<p class="error">Erreur de chargement des podcasts.</p>';
    }
  }
}

// Créer un élément podcast pour le profil artiste
function createArtistPodcastElement(podcast, podcastId) {
  const element = document.createElement('div');
  element.className = 'podcast-item';
  element.innerHTML = `
    <div class="podcast-image">
      <img src="${podcast.cover_url || 'https://via.placeholder.com/100x100?text=Podcast'}" 
           alt="${podcast.title}" loading="lazy">
    </div>
    <div class="podcast-content">
      <div class="podcast-header">
        <h4>${podcast.title}</h4>
      </div>
      <p class="podcast-description">${podcast.description || 'Aucune description disponible.'}</p>
      <div class="podcast-meta">
        <div class="meta-item">
          <i class="fas fa-clock"></i>
          <span>${formatDuration(podcast.duration)}</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-users"></i>
          <span>${(podcast.play_count || 0).toLocaleString()} écoutes</span>
        </div>
      </div>
      <div class="podcast-actions">
        <button class="btn btn-primary btn-sm play-podcast-btn" data-podcast-id="${podcastId}">
          <i class="fas fa-play" id="play-icon-podcast-${podcastId}"></i>
          Écouter
        </button>
      </div>
    </div>
  `;
  return element;
}


// Fonctions utilitaires pour la lecture
function togglePlay(trackId) {
  // Implémentez la logique de lecture/pause
  console.log("Lecture du titre:", trackId);
}

function togglePlayPodcast(podcastId) {
  // Implémentez la logique de lecture/pause pour les podcasts
  console.log("Lecture du podcast:", podcastId);
}

function toggleLike(trackId) {
  // Implémentez la logique de like
  console.log("Like du titre:", trackId);
}

function isTrackLiked(trackId) {
  // Vérifiez si l'utilisateur a liké ce titre
  return false;
}

function shareTrack(trackId) {
  // Implémentez la logique de partage
  console.log("Partage du titre:", trackId);
}

function sharePodcast(podcastId) {
  // Implémentez la logique de partage
  console.log("Partage du podcast:", podcastId);
}