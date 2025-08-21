// @ts-nocheck
import { 
  auth, 
  db, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  deleteDoc,
  signOut,
  onAuthStateChanged,
  setDoc,
  orderBy,
  limit
} from './firebase.js';
import { showNotification, showLoading, hideLoading } from './notifications.js';
import { getFirebaseErrorMessage } from './firebase.js';

// Configuration Cloudinary
const cloudinaryConfig = {
  cloudName: 'dwwyaunav',
  uploadPreset: 'YoungTalent_Uploads',
  apiKey: '128565628613445'
};

// Éléments DOM
const DOM = {
  sections: {
    overview: document.getElementById('overviewSection'),
    music: document.getElementById('musicSection'),
    podcasts: document.getElementById('podcastsSection'),
    analytics: document.getElementById('analyticsSection'),
    profile: document.getElementById('profileSection')
  },
  stats: {
    plays: document.getElementById('totalPlays'),
    followers: document.getElementById('totalFollowers'),
    likes: document.getElementById('totalLikes'),
    tracks: document.getElementById('totalTracks'),
    podcasts: document.getElementById('totalPodcast')
  },
  uploadForms: {
    track: document.getElementById('uploadArea'),
    podcast: document.getElementById('podcastUploadArea')
  }
};

// Variables globales
let currentUser = null;
let audienceChart = null;
let demographicChart = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM chargé, initialisation de dashboard-artiste.js');
  initializeDashboard();
});

async function initializeDashboard() {
  try {
    setupNavigation();
    setupEventListeners();
    await verifyAuthentication();
  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    showNotification("Erreur d'initialisation du tableau de bord", "error");
  }
}

async function verifyAuthentication() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'artist') {
        await loadArtistData(user.uid);
      } else {
        console.error("Utilisateur non autorisé ou non artiste");
        showNotification("Accès non autorisé", "error");
        redirectToHome();
      }
    } else {
      console.error("Aucun utilisateur connecté");
      showNotification("Veuillez vous connecter", "error");
      redirectToLogin();
    }
  });
}

function redirectToHome() {
  window.location.href = '../../index.html';
}

function redirectToLogin() {
  window.location.href = '../../html/login.html';
}

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item, .nav-itemHome');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const overlay = document.getElementById('overlay');

  if (!navItems.length) {
    console.error("Aucun élément de navigation trouvé");
    return;
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      toggleActiveNavItem(item);
      if (item.classList.contains('nav-item')) {
        showSection(item.dataset.section);
      } else if (item.classList.contains('nav-itemHome')) {
        redirectToHome();
      }
      if (sidebar && window.innerWidth <= 768) {
        sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });

  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleMobileSidebar);
  } else {
    console.error("Bouton sidebarToggle non trouvé");
  }

  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    });
  } else {
    console.error("Bouton sidebarCloseBtn non trouvé");
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  } else {
    console.error("Overlay non trouvé");
  }
}

function toggleActiveNavItem(activeItem) {
  document.querySelectorAll('.nav-item, .nav-itemHome').forEach(item => {
    item.classList.remove('active');
  });
  activeItem.classList.add('active');
}

function toggleMobileSidebar() {
  const sidebar = document.querySelector('.dashboard-sidebar');
  const overlay = document.getElementById('overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  } else {
    console.error("Sidebar ou overlay non trouvé");
  }
}

function showSection(section) {
  Object.values(DOM.sections).forEach(sec => {
    if (sec) sec.classList.remove('active');
  });

  if (DOM.sections[section]) {
    DOM.sections[section].classList.add('active');
    updateDashboardTitle(section);
    loadSectionData(section);
  } else {
    console.error(`Section ${section} non trouvée`);
    showNotification(`Erreur : Section ${section} non trouvée`, "error");
  }
}

function updateDashboardTitle(section) {
  const titleElement = document.getElementById('dashboardTitle');
  if (titleElement) {
    const navItem = document.querySelector(`.nav-item[data-section="${section}"] span`);
    titleElement.textContent = navItem?.textContent || section;
  } else {
    console.error("dashboardTitle non trouvé");
  }
}


function loadSectionData(section) {
  switch(section) {
    case 'music':
      loadArtistTracks();
      break;
    case 'podcasts':
      loadArtistPodcasts();
      break;
    case 'analytics':
      loadAnalyticsData();
      break;
    case 'profile':
      loadProfileData();
      break;
    default:
      console.error(`Section inconnue: ${section}`);
      break;
  }
}

function setupEventListeners() {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  else console.error("logoutBtn non trouvé");
  if (logoutBtnDropdown) logoutBtnDropdown.addEventListener('click', handleLogout);
  else console.error("logoutBtnDropdown non trouvé");

  setupUploadForm('track');
  setupUploadForm('podcast');

  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const avatarInput = document.getElementById('avatarInput');
  const artistProfileForm = document.getElementById('artistProfileForm');
  const addSocialLink = document.getElementById('addSocialLink');
  const uploadNewTrack = document.getElementById('uploadNewTrack');

  if (changeAvatarBtn) changeAvatarBtn.addEventListener('click', triggerAvatarUpload);
  else console.error("changeAvatarBtn non trouvé");

  if (avatarInput) avatarInput.addEventListener('click', uploadAvatar);
  else console.error("avatarInput non trouvé");

  if (artistProfileForm) artistProfileForm.addEventListener('submit', saveProfile);
  else console.error("artistProfileForm non trouvé");

  if (addSocialLink) addSocialLink.addEventListener('click', addSocialLinkField);
  else console.error("addSocialLink non trouvé");

  if (uploadNewTrack) uploadNewTrack.addEventListener('click', () => showUploadForm('track'));
  else console.error("uploadNewTrack non trouvé");
}

function setupUploadForm(type) {
  const btnId = type === 'track' ? 'uploadMusicBtn' : 'createPodcastBtn';
  const cancelId = type === 'track' ? 'cancelUpload' : 'cancelPodcastUpload';
  const submitId = type === 'track' ? 'submitTrack' : 'submitPodcast';
  
  const uploadBtn = document.getElementById(btnId);
  const cancelBtn = document.getElementById(cancelId);
  const submitBtn = document.getElementById(submitId);

  if (uploadBtn) uploadBtn.addEventListener('click', () => showUploadForm(type));
  else console.error(`${btnId} non trouvé`);

  if (cancelBtn) cancelBtn.addEventListener('click', () => hideUploadForm(type));
  else console.error(`${cancelId} non trouvé`);

  if (submitBtn) submitBtn.addEventListener('click', type === 'track' ? uploadTrack : uploadPodcast);
  else console.error(`${submitId} non trouvé`);
}

function showUploadForm(type) {
  if (DOM.uploadForms[type]) {
    DOM.uploadForms[type].style.display = 'block';
  } else {
    console.error(`Formulaire d'upload ${type} non trouvé`);
    showNotification(`Erreur : Formulaire d'upload ${type} non trouvé`, "error");
  }
}

function hideUploadForm(type) {
  if (DOM.uploadForms[type]) {
    DOM.uploadForms[type].style.display = 'none';
    resetUploadForm(type);
  } else {
    console.error(`Formulaire d'upload ${type} non trouvé`);
  }
}

function resetUploadForm(type) {
  const formPrefix = type === 'track' ? 'track' : 'podcast';
  const titleInput = document.getElementById(`${formPrefix}Title`);
  const descriptionInput = document.getElementById(`${formPrefix}Description`);
  const fileInput = document.getElementById(`${formPrefix}File`);
  const coverInput = document.getElementById(`${formPrefix}Cover`);
  const progressBar = document.getElementById(type === 'track' ? 'progressBar' : 'podcastProgressBar');
  const progressText = document.getElementById(type === 'track' ? 'progressText' : 'podcastProgressText');

  if (titleInput) titleInput.value = '';
  if (descriptionInput && type === 'podcast') descriptionInput.value = '';
  if (fileInput) fileInput.value = '';
  if (coverInput) coverInput.value = '';
  if (progressBar) progressBar.style.width = '0%';
  if (progressText) progressText.textContent = '0%';
}

async function loadArtistData(artistId) {
  const loading = showLoading('Chargement des données...');
  
  try {
    const [artistDoc, userDoc] = await Promise.all([
      getDoc(doc(db, "artists", artistId)),
      getDoc(doc(db, "users", artistId))
    ]);
    
    if (artistDoc.exists() && userDoc.exists()) {
      updateUIWithArtistData(artistDoc.data());
      await loadStatistics(artistId);
    } else {
      console.error("Données artiste ou utilisateur non trouvées");
      showNotification("Données non trouvées", "error");
    }
  } catch (error) {
    console.error("Erreur de chargement des données artiste:", error);
    showNotification(getFirebaseErrorMessage(error), "error");
  } finally {
    hideLoading(loading);
  }
}

function updateUIWithArtistData(artistData) {
  const artistNameDisplay = document.getElementById('artistNameDisplay');
  const profileDisplayName = document.getElementById('profileDisplayName');
  const profileImage = document.getElementById('profileImage');
  const profileAvatar = document.getElementById('profileAvatar');

  if (artistNameDisplay) artistNameDisplay.textContent = artistData.stage_name || 'Artiste inconnu';
  if (profileDisplayName) profileDisplayName.textContent = artistData.stage_name || 'Artiste inconnu';
  if (artistData.profile_picture) {
    if (profileImage) profileImage.src = artistData.profile_picture;
    if (profileAvatar) profileAvatar.src = artistData.profile_picture;
  }
}

async function loadStatistics(artistId) {
  try {
    const [tracksSnapshot, followersSnapshot, podcastsSnapshot] = await Promise.all([
      getDocs(query(collection(db, "tracks"), where("artist_id", "==", artistId))),
      getDocs(query(collection(db, "followers"), where("artist_id", "==", artistId))),
      getDocs(query(collection(db, "podcasts"), where("artist_id", "==", artistId)))
    ]);
    
    updateStatistics(tracksSnapshot, followersSnapshot, podcastsSnapshot);
    loadRecentTracks(tracksSnapshot);
  } catch (error) {
    console.error("Erreur de chargement des statistiques:", error);
    showNotification("Erreur de chargement des statistiques: " + getFirebaseErrorMessage(error), "error");
  }
}

function updateStatistics(tracksSnapshot, followersSnapshot, podcastsSnapshot) {
  if (DOM.stats.tracks) DOM.stats.tracks.textContent = tracksSnapshot.size.toLocaleString();
  if (DOM.stats.podcasts) DOM.stats.podcasts.textContent = podcastsSnapshot.size.toLocaleString();
  
  let totalPlays = 0;
  let totalLikes = 0;
  
  tracksSnapshot.forEach(doc => {
    totalPlays += doc.data().play_count || 0;
    totalLikes += doc.data().like_count || 0;
  });
  
  podcastsSnapshot.forEach(doc => {
    totalPlays += doc.data().play_count || 0;
  });
  
  if (DOM.stats.plays) DOM.stats.plays.textContent = totalPlays.toLocaleString();
  if (DOM.stats.likes) DOM.stats.likes.textContent = totalLikes.toLocaleString();
  if (DOM.stats.followers) DOM.stats.followers.textContent = followersSnapshot.size.toLocaleString();
}

function loadRecentTracks(tracksSnapshot) {
  const tracksList = document.getElementById('recentTracksList');
  if (!tracksList) {
    console.error("recentTracksList non trouvé");
    return;
  }
  
  tracksList.innerHTML = '';
  
  tracksSnapshot.docs.slice(0, 5).forEach(doc => {
    const track = doc.data();
    tracksList.appendChild(createTrackElement(doc.id, track));
  });
  
  setupTrackActions();
}

function createTrackElement(trackId, track) {
  const element = document.createElement('div');
  element.className = 'track-item';
  element.innerHTML = `
    <div class="track-info">
      <img src="${track.cover_url || 'https://via.placeholder.com/60'}" alt="${track.title}" loading="lazy">
      <div class="track-details">
        <h5>${track.title}</h5>
        <span class="genre-badge">${track.genre}</span>
        <div class="track-stats">
          <span><i class="fas fa-headphones"></i> ${track.play_count || 0}</span>
          <span><i class="fas fa-heart"></i> ${track.like_count || 0}</span>
        </div>
      </div>
    </div>
    <div class="track-actions">
      <button class="btn btn-outline btn-sm edit-track" data-track-id="${trackId}">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-outline btn-sm delete-track" data-track-id="${trackId}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  return element;
}

function setupTrackActions() {
  document.querySelectorAll('.edit-track').forEach(btn => {
    btn.addEventListener('click', (e) => editTrack(e.target.dataset.trackId));
  });
  
  document.querySelectorAll('.delete-track').forEach(btn => {
    btn.addEventListener('click', (e) => deleteTrack(e.target.dataset.trackId));
  });
}

async function uploadTrack() {
  const title = document.getElementById('trackTitle')?.value.trim();
  const genre = document.getElementById('trackGenre')?.value;
  const audioFile = document.getElementById('trackFile')?.files[0];
  const coverFile = document.getElementById('trackCover')?.files[0];
  
  if (!validateUploadForm(title, audioFile)) return;
  
  const loading = showLoading('Upload en cours...');
  const uploadProgress = document.getElementById('uploadProgress');
  if (uploadProgress) uploadProgress.style.display = 'block';
  
  try {
    const [coverUrl, audioUrl] = await Promise.all([
      coverFile ? uploadToCloudinary(coverFile, 'image') : Promise.resolve(''),
      uploadToCloudinary(audioFile, 'audio')
    ]);
    
    const trackRef = await saveTrackToFirestore(title, genre, audioUrl, coverUrl);
    
    showNotification('Titre uploadé avec succès ! En attente d\'approbation.', 'success');
    hideUploadForm('track');
    await loadArtistTracks();
    // Pas de mise à jour dynamique ici car le statut est "pending"
  } catch (error) {
    console.error("Erreur d'upload:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
    if (uploadProgress) uploadProgress.style.display = 'none';
  }
}

function validateUploadForm(title, audioFile) {
  if (!title || !audioFile) {
    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
    return false;
  }
  return true;
}

async function saveTrackToFirestore(title, genre, audioUrl, coverUrl = '') {
  const trackRef = await addDoc(collection(db, "tracks"), {
    title,
    genre,
    artist_id: currentUser.uid,
    artist_name: currentUser.displayName || 'Artiste inconnu',
    audio_url: audioUrl,
    cover_url: coverUrl,
    play_count: 0,
    like_count: 0,
    duration: 0, // À implémenter si possible
    created_at: new Date(),
    status: 'pending'
  });
  return trackRef;
}

async function uploadPodcast() {
  const title = document.getElementById('podcastTitle')?.value.trim();
  const description = document.getElementById('podcastDescription')?.value.trim();
  const audioFile = document.getElementById('podcastFile')?.files[0];
  const coverFile = document.getElementById('podcastCover')?.files[0];
  
  if (!validatePodcastForm(title, description, audioFile)) return;
  
  const loading = showLoading('Upload en cours...');
  const podcastUploadProgress = document.getElementById('podcastUploadProgress');
  if (podcastUploadProgress) podcastUploadProgress.style.display = 'block';
  
  try {
    const [coverUrl, audioUrl] = await Promise.all([
      coverFile ? uploadToCloudinary(coverFile, 'image') : Promise.resolve(''),
      uploadToCloudinary(audioFile, 'audio')
    ]);
    
    const podcastRef = await savePodcastToFirestore(title, description, audioUrl, coverUrl);
    
    showNotification('Podcast uploadé avec succès ! En attente d\'approbation.', 'success');
    hideUploadForm('podcast');
    await loadArtistPodcasts();
    // Pas de mise à jour dynamique ici car le statut est "pending"
  } catch (error) {
    console.error("Erreur d'upload:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
    if (podcastUploadProgress) podcastUploadProgress.style.display = 'none';
  }
}

function validatePodcastForm(title, description, audioFile) {
  if (!title || !description || !audioFile) {
    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
    return false;
  }
  return true;
}

async function savePodcastToFirestore(title, description, audioUrl, coverUrl = '') {
  const podcastRef = await addDoc(collection(db, "podcasts"), {
    title,
    description,
    artist_id: currentUser.uid,
    artist_name: currentUser.displayName || 'Artiste inconnu',
    audio_url: audioUrl,
    cover_url: coverUrl,
    play_count: 0,
    duration: 0, // À implémenter si possible
    created_at: new Date(),
    status: 'pending'
  });
  return podcastRef;
}

async function uploadToCloudinary(file, type) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    const endpoint = type === 'image' 
      ? `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`
      : `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/video/upload`;
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpoint, true);
    
    xhr.upload.onprogress = updateProgressBar(type);
    
    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        if (response.secure_url) {
          console.log(`Upload réussi (${type}):`, response.secure_url);
          resolve(response.secure_url);
        } else {
          console.error('Réponse Cloudinary:', response);
          reject(new Error('URL sécurisée non trouvée dans la réponse Cloudinary'));
        }
      } else {
        console.error('Erreur Cloudinary:', xhr.status, xhr.statusText, xhr.responseText);
        reject(new Error(`Échec de l'upload: ${xhr.statusText} - ${xhr.responseText}`));
      }
    };
    
    xhr.onerror = () => {
      console.error('Erreur réseau:', xhr.statusText);
      reject(new Error('Erreur réseau lors de l\'upload'));
    };
    xhr.send(formData);
  });
}

function updateProgressBar(type) {
  return (e) => {
    if (e.lengthComputable) {
      const percentComplete = Math.round((e.loaded / e.total) * 100);
      const progressBar = document.getElementById(type === 'track' ? 'progressBar' : 'podcastProgressBar');
      const progressText = document.getElementById(type === 'track' ? 'progressText' : 'podcastProgressText');
      
      if (progressBar) progressBar.style.width = percentComplete + '%';
      if (progressText) progressText.textContent = percentComplete + '%';
    }
  };
}

async function handleLogout() {
  try {
    await signOut(auth);
    showNotification('Déconnexion réussie', 'success');
    setTimeout(redirectToHome, 1500);
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}

async function loadArtistTracks() {
  try {
    const tracksQuery = query(
      collection(db, "tracks"),
      where("artist_id", "==", currentUser.uid)
    );
    const snapshot = await getDocs(tracksQuery);
    
    const musicList = document.getElementById('musicList');
    if (!musicList) {
      console.error("musicList non trouvé");
      return;
    }
    
    musicList.innerHTML = '';
    
    snapshot.forEach(doc => {
      musicList.appendChild(createMusicListItem(doc.id, doc.data()));
    });
    
    setupTrackActions();
  } catch (error) {
    console.error("Erreur de chargement des titres:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}

function createMusicListItem(trackId, track) {
  const element = document.createElement('div');
  element.className = 'track-item';
  element.innerHTML = `
    <div class="track-info">
      <img src="${track.cover_url || 'https://via.placeholder.com/60'}" alt="${track.title}" loading="lazy">
      <div class="track-details">
        <h5>${track.title}</h5>
        <span class="genre-badge">${track.genre}</span>
        <div class="track-stats">
          <span><i class="fas fa-headphones"></i> ${track.play_count || 0}</span>
          <span><i class="fas fa-heart"></i> ${track.like_count || 0}</span>
          <span>${track.status === 'approved' ? '✅ Approuvé' : '⏳ En attente'}</span>
        </div>
      </div>
    </div>
    <div class="track-actions">
      <button class="btn btn-outline btn-sm edit-track" data-track-id="${trackId}">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-outline btn-sm delete-track" data-track-id="${trackId}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  return element;
}

async function loadArtistPodcasts() {
  try {
    const podcastsQuery = query(
      collection(db, "podcasts"),
      where("artist_id", "==", currentUser.uid)
    );
    const snapshot = await getDocs(podcastsQuery);
    
    const podcastList = document.getElementById('podcastList');
    if (!podcastList) {
      console.error("podcastList non trouvé");
      return;
    }
    
    podcastList.innerHTML = '';
    
    snapshot.forEach(doc => {
      podcastList.appendChild(createPodcastListItem(doc.id, doc.data()));
    });
    
    setupPodcastActions();
  } catch (error) {
    console.error("Erreur de chargement des podcasts:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}

function createPodcastListItem(podcastId, podcast) {
  const element = document.createElement('div');
  element.className = 'podcast-item';
  element.innerHTML = `
    <div class="podcast-info">
      <img src="${podcast.cover_url || 'https://via.placeholder.com/60'}" alt="${podcast.title}" loading="lazy">
      <div class="podcast-details">
        <h5>${podcast.title}</h5>
        <p>${podcast.description || 'Aucune description'}</p>
        <div class="podcast-stats">
          <span><i class="fas fa-headphones"></i> ${podcast.play_count || 0}</span>
          <span>${podcast.status === 'approved' ? '✅ Approuvé' : '⏳ En attente'}</span>
        </div>
      </div>
    </div>
    <div class="podcast-actions">
      <button class="btn btn-outline btn-sm edit-podcast" data-podcast-id="${podcastId}">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn btn-outline btn-sm delete-podcast" data-podcast-id="${podcastId}">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  return element;
}

function setupPodcastActions() {
  document.querySelectorAll('.edit-podcast').forEach(btn => {
    btn.addEventListener('click', (e) => editPodcast(e.target.dataset.podcastId));
  });
  
  document.querySelectorAll('.delete-podcast').forEach(btn => {
    btn.addEventListener('click', (e) => deletePodcast(e.target.dataset.podcastId));
  });
}

async function loadAnalyticsData() {
  try {
    if (typeof Chart === 'undefined') {
      console.error("Chart.js non chargé");
      showNotification("Erreur : Bibliothèque Chart.js non chargée", "error");
      return;
    }

    const audienceCanvas = document.getElementById('audienceChart');
    const demographicCanvas = document.getElementById('demographicChart');

    if (!audienceCanvas || !demographicCanvas) {
      console.error("Canvas de graphiques non trouvés", {
        audienceCanvas: !!audienceCanvas,
        demographicCanvas: !!demographicCanvas
      });
      showNotification("Erreur : Graphiques non affichés", "error");
      return;
    }

    if (audienceChart) {
      audienceChart.destroy();
      audienceChart = null;
    }
    if (demographicChart) {
      demographicChart.destroy();
      demographicChart = null;
    }
    
    const audienceCtx = audienceCanvas.getContext('2d');
    audienceChart = new Chart(audienceCtx, {
      type: 'line',
      data: await getAudienceChartData(),
      options: getChartOptions('Écoutes')
    });
    
    const demoCtx = demographicCanvas.getContext('2d');
    demographicChart = new Chart(demoCtx, {
      type: 'doughnut',
      data: await getDemographicChartData(),
      options: { responsive: true }
    });
    
    await loadTopTracks();
  } catch (error) {
    console.error("Erreur de chargement des analytiques:", error);
    showNotification("Erreur de chargement des graphiques", "error");
  }
}

async function getAudienceChartData() {
  try {
    const tracksQuery = query(
      collection(db, "tracks"),
      where("artist_id", "==", currentUser.uid)
    );
    const snapshot = await getDocs(tracksQuery);
    const monthlyPlays = {};

    snapshot.forEach(doc => {
      const track = doc.data();
      const createdAt = track.created_at?.toDate();
      if (createdAt) {
        const monthYear = `${createdAt.getMonth() + 1}/${createdAt.getFullYear()}`;
        monthlyPlays[monthYear] = (monthlyPlays[monthYear] || 0) + (track.play_count || 0);
      }
    });

    const labels = Object.keys(monthlyPlays).sort();
    const data = labels.map(label => monthlyPlays[label]);

    return {
      labels: labels.length ? labels : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Écoutes',
        data: data.length ? data : [1200, 1900, 3000, 5000, 2000, 3000],
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    };
  } catch (error) {
    console.error("Erreur dans getAudienceChartData:", error);
    return {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Écoutes',
        data: [1200, 1900, 3000, 5000, 2000, 3000],
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    };
  }
}

async function getDemographicChartData() {
  try {
    const followersQuery = query(
      collection(db, "followers"),
      where("artist_id", "==", currentUser.uid)
    );
    const snapshot = await getDocs(followersQuery);
    const ageGroups = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 };

    for (const doc of snapshot.docs) {
      const followerId = doc.data().user_id;
      const userDoc = await getDoc(doc(db, "users", followerId));
      if (userDoc.exists()) {
        const age = userDoc.data().age;
        if (age) {
          if (age <= 24) ageGroups['18-24']++;
          else if (age <= 34) ageGroups['25-34']++;
          else if (age <= 44) ageGroups['35-44']++;
          else ageGroups['45+']++;
        }
      }
    }

    const total = Object.values(ageGroups).reduce((sum, val) => sum + val, 0);
    const data = total ? Object.values(ageGroups) : [45, 30, 15, 10];

    return {
      labels: ['18-24 ans', '25-34 ans', '35-44 ans', '45+ ans'],
      datasets: [{
        data,
        backgroundColor: [
          'rgba(249, 115, 22, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)'
        ]
      }]
    };
  } catch (error) {
    console.error("Erreur dans getDemographicChartData:", error);
    return {
      labels: ['18-24 ans', '25-34 ans', '35-44 ans', '45+ ans'],
      datasets: [{
        data: [45, 30, 15, 10],
        backgroundColor: [
          'rgba(249, 115, 22, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)'
        ]
      }]
    };
  }
}

function getChartOptions(title) {
  return {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: title }
    }
  };
}

async function loadTopTracks() {
  const topTracksList = document.getElementById('topTracksList');
  if (!topTracksList) {
    console.error("topTracksList non trouvé");
    return;
  }

  try {
    const tracksQuery = query(
      collection(db, "tracks"),
      where("artist_id", "==", currentUser.uid),
      orderBy("play_count", "desc"),
      limit(5)
    );
    
    const snapshot = await getDocs(tracksQuery);
    topTracksList.innerHTML = '';
    
    snapshot.forEach((doc, index) => {
      const track = doc.data();
      topTracksList.appendChild(createTopTrackElement(index + 1, track));
    });
  } catch (error) {
    console.error("Erreur de chargement des top tracks:", error);
    showNotification("Erreur de chargement des top tracks", "error");
  }
}

function createTopTrackElement(position, track) {
  const element = document.createElement('div');
  element.className = 'top-track-item';
  element.innerHTML = `
    <span class="track-position">${position}</span>
    <span class="track-title">${track.title}</span>
    <span class="track-plays">${track.play_count || 0} écoutes</span>
  `;
  return element;
}

async function loadProfileData() {
  try {
    const artistDoc = await getDoc(doc(db, "artists", currentUser.uid));
    
    if (artistDoc.exists()) {
      const artist = artistDoc.data();
      fillProfileForm(artist);
    } else {
      console.error("Données artiste non trouvées");
      showNotification("Erreur : Profil artiste non trouvé", "error");
    }
  } catch (error) {
    console.error("Erreur de chargement du profil:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}

function fillProfileForm(artist) {
  const artistName = document.getElementById('artistName');
  const artistGenre = document.getElementById('artistGenre');
  const artistLocation = document.getElementById('artistLocation');
  const artistBio = document.getElementById('artistBio');
  const profileAvatar = document.getElementById('profileAvatar');

  if (artistName) artistName.value = artist.stage_name || '';
  if (artistGenre) artistGenre.value = artist.genre || 'rap';
  if (artistLocation) artistLocation.value = artist.location || '';
  if (artistBio) artistBio.value = artist.bio || '';
  if (artist.profile_picture && profileAvatar) profileAvatar.src = artist.profile_picture;

  const socialLinksContainer = document.getElementById('socialLinks');
  if (socialLinksContainer) {
    socialLinksContainer.innerHTML = '';
    Object.entries(artist.social_links || {}).forEach(([platform, url]) => {
      addSocialLinkField(platform, url);
    });
  }
}

async function saveProfile(e) {
  e.preventDefault();
  
  const stageName = document.getElementById('artistName')?.value.trim();
  if (!stageName) {
    showNotification('Le nom d\'artiste est obligatoire', 'error');
    return;
  }
  
  const loading = showLoading('Enregistrement en cours...');
  
  try {
    const profileData = getProfileFormData();
    await updateArtistProfile(profileData);
    
    updateUIWithArtistData(profileData);
    showNotification('Profil mis à jour avec succès', 'success');
  } catch (error) {
    console.error("Erreur de sauvegarde du profil:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

function getProfileFormData() {
  const socialLinks = {};
  
  document.querySelectorAll('.social-link-item').forEach(item => {
    const platform = item.querySelector('.social-platform')?.value;
    const url = item.querySelector('.social-url')?.value.trim();
    if (platform && url) {
      socialLinks[platform] = url;
    }
  });
  
  return {
    stage_name: document.getElementById('artistName')?.value.trim() || '',
    genre: document.getElementById('artistGenre')?.value || 'rap',
    location: document.getElementById('artistLocation')?.value.trim() || '',
    bio: document.getElementById('artistBio')?.value.trim() || '',
    social_links: socialLinks,
    updated_at: new Date()
  };
}

async function updateArtistProfile(profileData) {
  await setDoc(doc(db, "artists", currentUser.uid), profileData, { merge: true });
}

function triggerAvatarUpload() {
  const avatarInput = document.getElementById('avatarInput');
  if (avatarInput) avatarInput.click();
  else console.error("avatarInput non trouvé");
}

async function uploadAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const loading = showLoading('Upload de l\'avatar...');
  
  try {
    const imageUrl = await uploadToCloudinary(file, 'image');
    await updateArtistProfile({ profile_picture: imageUrl });
    
    const profileImage = document.getElementById('profileImage');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileImage) profileImage.src = imageUrl;
    if (profileAvatar) profileAvatar.src = imageUrl;
    showNotification('Avatar mis à jour avec succès', 'success');
  } catch (error) {
    console.error("Erreur d'upload de l'avatar:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

function addSocialLinkField(platform = '', url = '') {
  const socialLinksContainer = document.getElementById('socialLinks');
  if (!socialLinksContainer) {
    console.error("socialLinks non trouvé");
    return;
  }
  
  const linkId = Date.now();
  const linkElement = document.createElement('div');
  linkElement.className = 'social-link-item';
  linkElement.innerHTML = `
    <select class="social-platform">
      <option value="">Choisir une plateforme</option>
      <option value="facebook" ${platform === 'facebook' ? 'selected' : ''}>Facebook</option>
      <option value="instagram" ${platform === 'instagram' ? 'selected' : ''}>Instagram</option>
      <option value="twitter" ${platform === 'twitter' ? 'selected' : ''}>Twitter</option>
      <option value="youtube" ${platform === 'youtube' ? 'selected' : ''}>YouTube</option>
      <option value="tiktok" ${platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
      <option value="soundcloud" ${platform === 'soundcloud' ? 'selected' : ''}>SoundCloud</option>
      <option value="spotify" ${platform === 'spotify' ? 'selected' : ''}>Spotify</option>
    </select>
    <input type="url" class="social-url" placeholder="URL" value="${url}">
    <button type="button" class="btn btn-outline btn-sm remove-social-link" data-link-id="${linkId}">
      <i class="fas fa-times"></i>
    </button>
  `;
  socialLinksContainer.appendChild(linkElement);
  
  document.querySelector(`.remove-social-link[data-link-id="${linkId}"]`).addEventListener('click', removeSocialLink);
}

function removeSocialLink(e) {
  e.currentTarget.closest('.social-link-item').remove();
}

async function editTrack(trackId) {
  showNotification('Fonctionnalité d\'édition à venir', 'info');
}

async function deleteTrack(trackId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce titre ?')) return;
  
  try {
    await deleteDoc(doc(db, "tracks", trackId));
    showNotification('Titre supprimé avec succès', 'success');
    loadArtistTracks();
  } catch (error) {
    console.error("Erreur de suppression du titre:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}

async function editPodcast(podcastId) {
  showNotification('Fonctionnalité d\'édition à venir', 'info');
}

async function deletePodcast(podcastId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce podcast ?')) return;
  
  try {
    await deleteDoc(doc(db, "podcasts", podcastId));
    showNotification('Podcast supprimé avec succès', 'success');
    loadArtistPodcasts();
  } catch (error) {
    console.error("Erreur de suppression du podcast:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}