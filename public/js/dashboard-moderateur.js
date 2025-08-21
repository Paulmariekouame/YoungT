// @ts-nocheck
import { 
  auth, 
  db, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc,
  onAuthStateChanged,
  signOut,
  getDoc
} from './firebase.js';
import { showNotification, showLoading, hideLoading } from './notifications.js';
import { getFirebaseErrorMessage } from './firebase.js';
import { getUserRole } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const role = await getUserRole(user.uid, user.email);
      if (role === 'moderator') {
        console.log('Accès autorisé, chargement du dashboard');
        loadDashboardData();
      } else {
        console.warn('Accès refusé : rôle non modérateur');
        window.location.href = '../index.html';
      }
    } else {
      console.warn('Utilisateur non connecté');
      window.location.href = '../../html/login.html';
    }
  });
});

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
        const section = item.getAttribute('data-section');
        showSection(section);
      } else if (item.classList.contains('nav-itemHome')) {
        window.location.href = '../index.html';
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
  document.querySelectorAll('.dashboard-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const sectionElement = document.getElementById(`${section}Section`);
  const dashboardTitle = document.getElementById('dashboardTitle');
  if (sectionElement && dashboardTitle) {
    sectionElement.classList.add('active');
    dashboardTitle.textContent = 
      document.querySelector(`.nav-item[data-section="${section}"] span`)?.textContent || 'Tableau de bord';
    
    switch(section) {
      case 'users':
        loadUsers();
        break;
      case 'content':
        loadContent();
        break;
      case 'reports':
        loadReports();
        break;
    }
  } else {
    console.error(`Section ${section} ou dashboardTitle non trouvé`);
    showNotification(`Erreur : Section ${section} non trouvée`, 'error');
  }
}

function setupEventListeners() {
  const logoutBtn = document.getElementById('logoutBtn');
  const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (logoutBtnDropdown) logoutBtnDropdown.addEventListener('click', handleLogout);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      switchContentTab(tab);
    });
  });

  const userSearch = document.getElementById('userSearch');
  if (userSearch) userSearch.addEventListener('input', filterUsers);

  const saveSettingsBtn = document.getElementById('saveSettings');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);
}

async function loadDashboardData() {
  const loading = showLoading('Chargement des données...');
  
  try {
    const usersQuery = query(collection(db, "users"));
    const songsQuery = query(collection(db, "songs"));
    const podcastsQuery = query(collection(db, "podcasts"));
    const reportsQuery = query(collection(db, "reports"));
    
    const [usersSnapshot, songsSnapshot, podcastsSnapshot, reportsSnapshot] = await Promise.all([
      getDocs(usersQuery),
      getDocs(songsQuery),
      getDocs(podcastsQuery),
      getDocs(reportsQuery)
    ]);
    
    const totalUsers = document.getElementById('totalUsers');
    const totalTracks = document.getElementById('totalTracks');
    const totalPodcasts = document.getElementById('totalPodcasts');
    const totalReports = document.getElementById('totalReports');
    
    if (totalUsers) totalUsers.textContent = usersSnapshot.size;
    if (totalTracks) totalTracks.textContent = songsSnapshot.size;
    if (totalPodcasts) totalPodcasts.textContent = podcastsSnapshot.size;
    if (totalReports) totalReports.textContent = reportsSnapshot.size;
    
    loadRecentActivity();
    
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

async function loadRecentActivity() {
  try {
    const recentSongsQuery = query(
      collection(db, "songs"),
      orderBy("created_at", "desc"),
      limit(3)
    );
    
    const recentPodcastsQuery = query(
      collection(db, "podcasts"),
      orderBy("created_at", "desc"),
      limit(3)
    );
    
    const recentReportsQuery = query(
      collection(db, "reports"),
      orderBy("created_at", "desc"),
      limit(3)
    );
    
    const [songsSnapshot, podcastsSnapshot, reportsSnapshot] = await Promise.all([
      getDocs(recentSongsQuery),
      getDocs(recentPodcastsQuery),
      getDocs(recentReportsQuery)
    ]);
    
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    
    songsSnapshot.forEach(doc => {
      const song = doc.data();
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="fas fa-music"></i>
        </div>
        <div class="activity-details">
          <p>Nouveau titre: <strong>${song.title || 'Sans titre'}</strong></p>
          <small>${song.created_at?.toDate().toLocaleString() || 'Date inconnue'}</small>
        </div>
        <div class="activity-status ${song.status || 'pending'}">
          ${song.status === 'approved' ? 'Approuvé' : 'En attente'}
        </div>
      `;
      activityList.appendChild(activityItem);
    });
    
    podcastsSnapshot.forEach(doc => {
      const podcast = doc.data();
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="fas fa-podcast"></i>
        </div>
        <div class="activity-details">
          <p>Nouveau podcast: <strong>${podcast.title || 'Sans titre'}</strong></p>
          <small>${podcast.created_at?.toDate().toLocaleString() || 'Date inconnue'}</small>
        </div>
        <div class="activity-status ${podcast.status || 'pending'}">
          ${podcast.status === 'approved' ? 'Approuvé' : 'En attente'}
        </div>
      `;
      activityList.appendChild(activityItem);
    });
    
    reportsSnapshot.forEach(doc => {
      const report = doc.data();
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="fas fa-flag"></i>
        </div>
        <div class="activity-details">
          <p>Nouveau signalement: <strong>${report.reason || 'Sans raison'}</strong></p>
          <small>${report.created_at?.toDate().toLocaleString() || 'Date inconnue'}</small>
        </div>
        <div class="activity-status ${report.resolved ? 'resolved' : 'pending'}">
          ${report.resolved ? 'Résolu' : 'En attente'}
        </div>
      `;
      activityList.appendChild(activityItem);
    });
    
  } catch (error) {
    console.error("Erreur lors du chargement de l'activité récente:", error);
  }
}

async function loadUsers() {
  const loading = showLoading('Chargement des utilisateurs...');
  
  try {
    const usersQuery = query(collection(db, "users"));
    const snapshot = await getDocs(usersQuery);
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
      console.error("usersTableBody non trouvé");
      return;
    }
    
    tbody.innerHTML = '';
    
    snapshot.forEach(doc => {
      const user = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.displayName || user.firstName + ' ' + user.lastName || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.role || 'fan'}</td>
        <td>
          <span class="status-badge ${user.status || 'active'}">
            ${user.status || 'active'}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm edit-user" data-user-id="${doc.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-outline btn-sm ${user.status === 'banned' ? 'btn-success' : 'btn-danger'}" 
                  data-user-id="${doc.id}">
            ${user.status === 'banned' ? '<i class="fas fa-check"></i>' : '<i class="fas fa-ban"></i>'}
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    document.querySelectorAll('.edit-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userId = e.currentTarget.getAttribute('data-user-id');
        editUser(userId);
      });
    });
    
    document.querySelectorAll('.btn-danger, .btn-success').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const userId = e.currentTarget.getAttribute('data-user-id');
        const isBanning = e.currentTarget.classList.contains('btn-danger');
        
        try {
          await updateDoc(doc(db, "users", userId), {
            status: isBanning ? 'banned' : 'active'
          });
          showNotification(`Utilisateur ${isBanning ? 'banni' : 'réactivé'} avec succès`, 'success');
          loadUsers();
        } catch (error) {
          showNotification(getFirebaseErrorMessage(error), 'error');
        }
      });
    });
    
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

async function loadContent() {
  switchContentTab('tracks');
}

async function switchContentTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
  
  document.querySelectorAll('.content-tab').forEach(tabElement => {
    tabElement.style.display = 'none';
  });
  
  const tabElement = document.getElementById(`${tab}Tab`);
  if (tabElement) {
    tabElement.style.display = 'block';
    
    if (tabElement.innerHTML.trim() === '') {
      const loading = showLoading(`Chargement des ${tab}...`);
      
      try {
        switch(tab) {
          case 'tracks':
            await loadTracks();
            break;
          case 'podcasts':
            await loadPodcasts();
            break;
          case 'artists':
            await loadArtists();
            break;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de ${tab}:`, error);
        showNotification(getFirebaseErrorMessage(error), 'error');
      } finally {
        hideLoading(loading);
      }
    }
  }
}

async function loadTopTracks() {
  const loading = showLoading('Chargement des meilleurs titres...');
  try {
    const tracksQuery = query(
      collection(db, "songs"),
      orderBy("play_count", "desc"),
      limit(5)
    );
    const snapshot = await getDocs(tracksQuery);
    const topTracksList = document.getElementById('topTracksList');
    if (!topTracksList) {
      console.error('topTracksList non trouvé');
      return;
    }

    topTracksList.innerHTML = '';
    
    snapshot.forEach((doc, index) => {
      const track = doc.data();
      const trackElement = document.createElement('li');
      trackElement.className = 'track-item';
      trackElement.innerHTML = `
        <span class="track-rank">${index + 1}</span>
        <img src="${track.cover_url || 'https://via.placeholder.com/50'}" alt="${track.title || 'Sans titre'}">
        <div class="track-info">
          <h4>${track.title || 'Sans titre'}</h4>
          <p>${track.artist_name || 'Artiste inconnu'}</p>
        </div>
        <span class="track-stats">
          <i class="fas fa-headphones"></i> ${track.play_count || 0}
        </span>
      `;
      topTracksList.appendChild(trackElement);
    });
  } catch (error) {
    console.error('Erreur dans loadTopTracks:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

async function loadTracks() {
  const loading = showLoading('Chargement des titres...');
  try {
    const songsQuery = query(
      collection(db, "songs"),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(songsQuery);
    const musicList = document.getElementById('musicList');
    if (!musicList) {
      console.error('musicList non trouvé');
      return;
    }
    
    musicList.innerHTML = '';
    
    snapshot.forEach(doc => {
      const track = doc.data();
      const trackElement = document.createElement('div');
      trackElement.className = 'content-item';
      trackElement.innerHTML = `
        <div class="content-info">
          <img src="${track.cover_url || 'https://via.placeholder.com/60'}" alt="${track.title || 'Sans titre'}">
          <div class="content-details">
            <h4>${track.title || 'Sans titre'}</h4>
            <p>${track.artist_name || 'Artiste inconnu'} • ${track.genre || 'N/A'}</p>
            <div class="content-stats">
              <span><i class="fas fa-headphones"></i> ${track.play_count || 0}</span>
              <span><i class="fas fa-heart"></i> ${track.like_count || 0}</span>
            </div>
          </div>
        </div>
        <div class="content-status ${track.status || 'pending'}">
          ${track.status === 'approved' ? 'Approuvé' : 'En attente'}
        </div>
        <div class="content-actions">
          <button class="btn btn-outline btn-sm approve-btn" data-id="${doc.id}" data-type="song">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn btn-outline btn-sm reject-btn" data-id="${doc.id}" data-type="song">
            <i class="fas fa-times"></i>
          </button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${doc.id}" data-type="song">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      musicList.appendChild(trackElement);
    });
    
    setupContentActionButtons();
  } catch (error) {
    console.error('Erreur dans loadTracks:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

async function loadPodcasts() {
  const loading = showLoading('Chargement des podcasts...');
  try {
    const podcastsQuery = query(
      collection(db, "podcasts"),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(podcastsQuery);
    const podcastList = document.getElementById('podcastList');
    if (!podcastList) {
      console.error('podcastList non trouvé');
      return;
    }
    
    podcastList.innerHTML = '';
    
    snapshot.forEach(doc => {
      const podcast = doc.data();
      const podcastElement = document.createElement('div');
      podcastElement.className = 'content-item';
      podcastElement.innerHTML = `
        <div class="content-info">
          <img src="${podcast.cover_url || 'https://via.placeholder.com/60'}" alt="${podcast.title || 'Sans titre'}">
          <div class="content-details">
            <h4>${podcast.title || 'Sans titre'}</h4>
            <p>${podcast.artist_name || 'Artiste inconnu'}</p>
            <div class="content-stats">
              <span><i class="fas fa-headphones"></i> ${podcast.play_count || 0}</span>
            </div>
          </div>
        </div>
        <div class="content-status ${podcast.status || 'pending'}">
          ${podcast.status === 'approved' ? 'Approuvé' : 'En attente'}
        </div>
        <div class="content-actions">
          <button class="btn btn-outline btn-sm approve-btn" data-id="${doc.id}" data-type="podcast">
            <i class="fas fa-check"></i>
          </button>
          <button class="btn btn-outline btn-sm reject-btn" data-id="${doc.id}" data-type="podcast">
            <i class="fas fa-times"></i>
          </button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${doc.id}" data-type="podcast">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      podcastList.appendChild(podcastElement);
    });
    
    setupContentActionButtons();
  } catch (error) {
    console.error('Erreur dans loadPodcasts:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

async function loadArtists() {
  const loading = showLoading('Chargement des artistes...');
  try {
    const artistsQuery = query(
      collection(db, "artists"),
      orderBy("created_at", "desc")
    );
    const snapshot = await getDocs(artistsQuery);
    const artistsList = document.getElementById('artistsList');
    if (!artistsList) {
      console.error('artistsList non trouvé');
      return;
    }
    
    artistsList.innerHTML = '';
    
    snapshot.forEach(doc => {
      const artist = doc.data();
      const artistElement = document.createElement('div');
      artistElement.className = 'content-item';
      artistElement.innerHTML = `
        <div class="content-info">
          <img src="${artist.profile_picture || 'https://via.placeholder.com/60'}" alt="${artist.stage_name || 'Sans nom'}">
          <div class="content-details">
            <h4>${artist.stage_name || 'Sans nom'}</h4>
            <p>${artist.genre || 'N/A'}</p>
          </div>
        </div>
        <div class="content-status ${artist.verified ? 'verified' : 'unverified'}">
          ${artist.verified ? 'Vérifié' : 'Non vérifié'}
        </div>
        <div class="content-actions">
          <button class="btn btn-outline btn-sm verify-btn" data-id="${doc.id}" data-verified="${artist.verified}">
            <i class="fas fa-${artist.verified ? 'times' : 'check'}"></i>
            ${artist.verified ? 'Désactiver' : 'Vérifier'}
          </button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${doc.id}" data-type="artist">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      artistsList.appendChild(artistElement);
    });
    
    document.querySelectorAll('.verify-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const artistId = e.currentTarget.getAttribute('data-id');
        const isVerified = e.currentTarget.getAttribute('data-verified') === 'true';
        
        try {
          await updateDoc(doc(db, "artists", artistId), {
            verified: !isVerified
          });
          showNotification(`Artiste ${!isVerified ? 'vérifié' : 'désactivé'} avec succès`, 'success');
          loadArtists();
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'artiste:', error);
          showNotification(getFirebaseErrorMessage(error), 'error');
        }
      });
    });
    
    document.querySelectorAll('.delete-btn[data-type="artist"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const artistId = e.currentTarget.getAttribute('data-id');
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet artiste ?')) return;
        
        try {
          await deleteDoc(doc(db, "artists", artistId));
          showNotification('Artiste supprimé avec succès', 'success');
          loadArtists();
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'artiste:', error);
          showNotification(getFirebaseErrorMessage(error), 'error');
        }
      });
    });
  } catch (error) {
    console.error('Erreur dans loadArtists:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

function setupContentActionButtons() {
  document.querySelectorAll('.approve-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const type = e.currentTarget.getAttribute('data-type');
      
      try {
        await updateDoc(doc(db, `${type}s`, id), {
          status: 'approved'
        });
        showNotification('Contenu approuvé avec succès', 'success');
        switchContentTab(type === 'song' ? 'tracks' : type);
      } catch (error) {
        console.error(`Erreur lors de l'approbation du ${type}:`, error);
        showNotification(getFirebaseErrorMessage(error), 'error');
      }
    });
  });
  
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const type = e.currentTarget.getAttribute('data-type');
      
      try {
        await updateDoc(doc(db, `${type}s`, id), {
          status: 'rejected'
        });
        showNotification('Contenu rejeté avec succès', 'success');
        switchContentTab(type === 'song' ? 'tracks' : type);
      } catch (error) {
        console.error(`Erreur lors du rejet du ${type}:`, error);
        showNotification(getFirebaseErrorMessage(error), 'error');
      }
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const type = e.currentTarget.getAttribute('data-type');
      
      if (!confirm(`Êtes-vous sûr de vouloir supprimer ce ${type === 'song' ? 'titre' : type} ?`)) return;
      
      try {
        await deleteDoc(doc(db, `${type}s`, id));
        showNotification(`${type === 'song' ? 'Titre' : type === 'podcast' ? 'Podcast' : 'Artiste'} supprimé avec succès`, 'success');
        switchContentTab(type === 'song' ? 'tracks' : type);
      } catch (error) {
        console.error(`Erreur lors de la suppression du ${type}:`, error);
        showNotification(getFirebaseErrorMessage(error), 'error');
      }
    });
  });
}

async function loadReports() {
  const loading = showLoading('Chargement des signalements...');
  
  try {
    const reportsQuery = query(
      collection(db, "reports"),
      orderBy("created_at", "desc")
    );
    
    const snapshot = await getDocs(reportsQuery);
    const reportsList = document.getElementById('reportsList');
    if (!reportsList) {
      console.error('reportsList non trouvé');
      return;
    }
    
    reportsList.innerHTML = '';
    
    for (const doc of snapshot.docs) {
      const report = doc.data();
      const contentDoc = await getDoc(doc(db, `${report.contentType}s`, report.contentId));
      const content = contentDoc.data() || {};
      
      const reportElement = document.createElement('div');
      reportElement.className = 'report-item';
      reportElement.innerHTML = `
        <div class="report-content">
          <h4>${report.reason || 'Sans raison'}</h4>
          <p>${report.details || 'Aucun détail fourni'}</p>
          <small>Signalé par: ${report.reporterEmail || 'Inconnu'} • ${report.created_at?.toDate().toLocaleString() || 'Date inconnue'}</small>
        </div>
        <div class="report-linked">
          <p>${report.contentType === 'song' ? 'Titre' : 'Podcast'}: ${content.title || 'Supprimé'}</p>
          <p>Artiste: ${content.artist_name || 'Inconnu'}</p>
        </div>
        <div class="report-status ${report.resolved ? 'resolved' : 'pending'}">
          ${report.resolved ? 'Résolu' : 'En attente'}
        </div>
        <div class="report-actions">
          <button class="btn btn-outline btn-sm resolve-btn" data-id="${doc.id}" data-resolved="${report.resolved}">
            <i class="fas fa-${report.resolved ? 'undo' : 'check'}"></i>
            ${report.resolved ? 'Rouvrir' : 'Résoudre'}
          </button>
          <button class="btn btn-outline btn-sm delete-btn" data-id="${doc.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      reportsList.appendChild(reportElement);
    }
    
    document.querySelectorAll('.resolve-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const reportId = e.currentTarget.getAttribute('data-id');
        const isResolved = e.currentTarget.getAttribute('data-resolved') === 'true';
        
        try {
          await updateDoc(doc(db, "reports", reportId), {
            resolved: !isResolved
          });
          showNotification(`Signalement ${!isResolved ? 'résolu' : 'rouvert'} avec succès`, 'success');
          loadReports();
        } catch (error) {
          console.error('Erreur lors de la gestion du signalement:', error);
          showNotification(getFirebaseErrorMessage(error), 'error');
        }
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const reportId = e.currentTarget.getAttribute('data-id');
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce signalement ?')) return;
        
        try {
          await deleteDoc(doc(db, "reports", reportId));
          showNotification('Signalement supprimé avec succès', 'success');
          loadReports();
        } catch (error) {
          console.error('Erreur lors de la suppression du signalement:', error);
          showNotification(getFirebaseErrorMessage(error), 'error');
        }
      });
    });
    
  } catch (error) {
    console.error('Erreur dans loadReports:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

function filterUsers() {
  const searchTerm = document.getElementById('userSearch')?.value.toLowerCase();
  const rows = document.querySelectorAll('#usersTableBody tr');
  
  rows.forEach(row => {
    const name = row.querySelector('td:nth-child(1)')?.textContent.toLowerCase();
    const email = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase();
    const role = row.querySelector('td:nth-child(3)')?.textContent.toLowerCase();
    
    if (name?.includes(searchTerm) || email?.includes(searchTerm) || role?.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

async function saveSettings() {
  const loading = showLoading('Enregistrement des paramètres...');
  
  try {
    const moderationLevel = document.getElementById('moderationLevel')?.value;
    const autoApprove = document.getElementById('autoApprove')?.checked;
    const reportThreshold = document.getElementById('reportThreshold')?.value;
    
    const templates = [];
    document.querySelectorAll('.template-item').forEach(item => {
      const title = item.querySelector('h5')?.textContent;
      const content = item.querySelector('.template-content')?.value;
      if (title && content) {
        templates.push({ title, content });
      }
    });
    
    await setDoc(doc(db, "settings", "moderation"), {
      level: moderationLevel || 'medium',
      autoApprove: autoApprove || false,
      reportThreshold: parseInt(reportThreshold) || 5,
      templates,
      updatedAt: new Date()
    });
    
    showNotification('Paramètres enregistrés avec succès', 'success');
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des paramètres:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

async function editUser(userId) {
  console.log("Édition de l'utilisateur:", userId);
  showNotification('Fonctionnalité d\'édition à venir', 'info');
}

async function handleLogout() {
  try {
    await signOut(auth);
    showNotification('Déconnexion réussie', 'success');
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 2000);
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  }
}