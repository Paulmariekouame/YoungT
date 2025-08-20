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

  if (!navButtons || !profileDropdown) {
    console.warn("Éléments navButtons ou profileDropdown non trouvés");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    const isInRoot = window.location.pathname === '/' || window.location.pathname.includes('/index.html');
    const basePath = isInRoot ? '' : '../';

    if (user) {
      navButtons.style.display = 'none';
      profileDropdown.style.display = 'block';
      if (mobileNavButtons) mobileNavButtons.style.display = 'none';
      if (mobileProfileDropdown) mobileProfileDropdown.style.display = 'block';
      
      if (userEmail) userEmail.textContent = user.email || 'Utilisateur';
      if (mobileUserEmail) mobileUserEmail.textContent = user.email || 'Utilisateur';

      const role = await getUserRole(user.uid, user.email);

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

      if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
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

      if (mobileLogoutBtn) {
        mobileLogoutBtn.onclick = async (e) => {
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
      navButtons.style.display = 'flex';
      profileDropdown.style.display = 'none';
      if (mobileNavButtons) mobileNavButtons.style.display = 'flex';
      if (mobileProfileDropdown) mobileProfileDropdown.style.display = 'none';
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