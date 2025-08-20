// @ts-nocheck
import { db, doc, getDoc, collection, query, where, getDocs } from '../js/firebase.js';
import { showNotification } from '../js/notifications.js';
import { getFirebaseErrorMessage } from '../js/firebase.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const artistId = urlParams.get('id');

  if (!artistId) {
    showNotification('ID artiste manquant', 'error');
    window.location.href = 'artists.html';
    return;
  }

  try {
    await loadArtistProfile(artistId);
    await loadArtistContent(artistId);
  } catch (error) {
    console.error('Erreur de chargement du profil:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
});

async function loadArtistProfile(artistId) {
  const artistDoc = await getDoc(doc(db, 'artists', artistId));
  if (!artistDoc.exists()) {
    showNotification('Artiste non trouvé', 'error');
    return;
  }

  const artist = artistDoc.data();
  const artistContainer = document.querySelector('.artist-profile');
  if (!artistContainer) {
    console.error('Conteneur artist-profile non trouvé');
    return;
  }

  artistContainer.innerHTML = `
    <div class="artist-header">
      <img src="${artist.profile_picture || 'https://via.placeholder.com/200x200?text=Artiste'}" alt="${artist.stage_name}" class="artist-image" loading="lazy">
      <div class="artist-info">
        <h2>${artist.stage_name || 'Artiste inconnu'}</h2>
        <span class="genre-badge">${artist.genre || 'Inconnu'}</span>
        <p class="artist-bio">${artist.bio || 'Aucune bio disponible'}</p>
        <div class="artist-stats">
          <div class="stat">
            <span class="stat-value">${artist.followers_count?.toLocaleString() || 0}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat">
            <span class="stat-value">${artist.tracks_count?.toLocaleString() || 0}</span>
            <span class="stat-label">Titres</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function loadArtistContent(artistId) {
  const tracksContainer = document.createElement('div');
  tracksContainer.className = 'tracks-list';
  const podcastsContainer = document.createElement('div');
  podcastsContainer.className = 'podcasts-list';

  const main = document.querySelector('main.artists-page');
  main.appendChild(tracksContainer);
  main.appendChild(podcastsContainer);

  try {
    const tracksQuery = query(
      collection(db, 'tracks'),
      where('artist_id', '==', artistId),
      where('status', '==', 'approved'),
      orderBy('play_count', 'desc')
    );
    const tracksSnapshot = await getDocs(tracksQuery);

    tracksContainer.innerHTML = '<h3>Pistes</h3>';
    tracksSnapshot.forEach((doc, index) => {
      const track = doc.data();
      tracksContainer.appendChild(createTrackItem(doc.id, track, index + 1));
    });

    const podcastsQuery = query(
      collection(db, 'podcasts'),
      where('artist_id', '==', artistId),
      where('status', '==', 'approved'),
      orderBy('play_count', 'desc')
    );
    const podcastsSnapshot = await getDocs(podcastsQuery);

    podcastsContainer.innerHTML = '<h3>Podcasts</h3>';
    podcastsSnapshot.forEach(doc => {
      const podcast = doc.data();
      podcastsContainer.appendChild(createPodcastItem(doc.id, podcast));
    });
  } catch (error) {
    console.error('Erreur de chargement du contenu artiste:', error);
    showNotification('Erreur de chargement du contenu', 'error');
  }
}

// Réutilisation des fonctions createTrackItem et createPodcastItem depuis content.js
import { createTrackItem, createPodcastItem, formatDuration, togglePlay, toggleLike, shareTrack, sharePodcast } from '../js/content.js';