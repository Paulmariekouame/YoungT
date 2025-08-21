// @ts-nocheck
import { auth, db, doc, getDoc, signOut, onAuthStateChanged } from './firebase.js';
import { showNotification } from './notifications.js';
import { getFirebaseErrorMessage } from './firebase.js';

const moderatorEmails = ["admin@youngtalent.com", "moderator@youngtalent.com"];

export async function getUserRole(uid, email) {
  if (!uid || !email) return 'fan';
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return moderatorEmails.includes(email) ? 'moderator' : userDoc.data().role || 'fan';
    }
    return 'fan';
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    return 'fan';
  }
}

export function setupAuthStateListener() {
  const navButtons = document.getElementById('navButtons');
  const profileDropdown = document.getElementById('profileDropdown');
  const mobileNavButtons = document.getElementById('mobileNavButtons');
  const mobileProfileDropdown = document.getElementById('mobileProfileDropdown');
  const userEmail = document.getElementById('userEmail');
  const mobileUserEmail = document.getElementById('mobileUserEmail');
  const dashboardLink = document.getElementById('dashboardLink');
  const mobileDashboardLink = document.getElementById('mobileDashboardLink');
  const logoutBtn = document.getElementById('logoutBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

  // Vérification stricte des éléments
  if (!navButtons || !profileDropdown || !mobileNavButtons || !mobileProfileDropdown) {
    console.warn("Certains éléments de navigation (navButtons, profileDropdown, mobileNavButtons, mobileProfileDropdown) non trouvés");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    const isInRoot = window.location.pathname === '/' || window.location.pathname.includes('/index.html');
    const basePath = isInRoot ? '' : '../';

    if (user) {
      // Utilisateur connecté - Desktop
      navButtons.style.display = 'none';
      profileDropdown.style.display = 'block';
      
      // Utilisateur connecté - Mobile
      mobileNavButtons.style.display = 'none'; // Masquer les boutons de connexion/inscription
      mobileProfileDropdown.style.display = 'flex'; // Afficher le menu déroulant du profil
      
      // Forcer l'application des styles pour éviter les conflits CSS
      mobileNavButtons.style.setProperty('display', 'none', 'important');
      mobileProfileDropdown.style.setProperty('display', 'flex', 'important');

      // Affichage de l'email utilisateur
      if (userEmail) userEmail.textContent = user.email || 'Utilisateur';
      if (mobileUserEmail) mobileUserEmail.textContent = user.email || 'Utilisateur';

      // Récupération du rôle utilisateur
      const role = await getUserRole(user.uid, user.email);

      // Gestion du lien tableau de bord - Desktop
      if (dashboardLink) {
        if (role === 'artist') {
          dashboardLink.style.display = 'block';
          dashboardLink.href = `${basePath}html/dashboard/dashboard-artiste.html`;
        } else if (role === 'moderator') {
          dashboardLink.style.display = 'block';
          dashboardLink.href = `${basePath}html/dashboard/dashboard-moderateur.html`;
        } else {
          dashboardLink.style.display = 'none';
        }
      }

      // Gestion du lien tableau de bord - Mobile
      if (mobileDashboardLink) {
        if (role === 'artist') {
          mobileDashboardLink.style.display = 'block';
          mobileDashboardLink.href = `${basePath}html/dashboard/dashboard-artiste.html`;
        } else if (role === 'moderator') {
          mobileDashboardLink.style.display = 'block';
          mobileDashboardLink.href = `${basePath}html/dashboard/dashboard-moderateur.html`;
        } else {
          mobileDashboardLink.style.display = 'none';
        }
      }

      // Gestion de la déconnexion - Desktop
      if (logoutBtn) {
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        document.getElementById('logoutBtn').onclick = async (e) => {
          e.preventDefault();
          try {
            await signOut(auth);
            showNotification('Déconnexion réussie', 'success');
            setTimeout(() => {
              window.location.href = `${basePath}index.html`;
            }, 2000);
          } catch (error) {
            showNotification(getFirebaseErrorMessage(error), 'error');
          }
        };
      }

      // Gestion de la déconnexion - Mobile
      if (mobileLogoutBtn) {
        const newMobileLogoutBtn = mobileLogoutBtn.cloneNode(true);
        mobileLogoutBtn.parentNode.replaceChild(newMobileLogoutBtn, mobileLogoutBtn);
        
        document.getElementById('mobileLogoutBtn').onclick = async (e) => {
          e.preventDefault();
          try {
            await signOut(auth);
            showNotification('Déconnexion réussie', 'success');
            setTimeout(() => {
              window.location.href = `${basePath}index.html`;
            }, 2000);
          } catch (error) {
            showNotification(getFirebaseErrorMessage(error), 'error');
          }
        };
      }
    } else {
      // Utilisateur non connecté - Desktop
      navButtons.style.display = 'flex';
      profileDropdown.style.display = 'none';
      
      // Utilisateur non connecté - Mobile
      mobileNavButtons.style.display = 'flex';
      mobileProfileDropdown.style.display = 'none';
      
      // Forcer l'application des styles pour éviter les conflits CSS
      mobileNavButtons.style.setProperty('display', 'flex', 'important');
      mobileProfileDropdown.style.setProperty('display', 'none', 'important');

      // Masquer les liens de tableau de bord
      if (dashboardLink) dashboardLink.style.display = 'none';
      if (mobileDashboardLink) mobileDashboardLink.style.display = 'none';
    }
  });
}

export function setupProfileDropdowns() {
  const profileBtns = document.querySelectorAll('.profile-btn');
  
  profileBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = btn.parentElement;
      const dropdownContent = dropdown?.querySelector('.dropdown-content');
      if (dropdownContent) {
        dropdownContent.classList.toggle('show');
        document.querySelectorAll('.dropdown-content').forEach(content => {
          if (content !== dropdownContent) {
            content.classList.remove('show');
          }
        });
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-content').forEach(content => {
      content.classList.remove('show');
    });
  });
}