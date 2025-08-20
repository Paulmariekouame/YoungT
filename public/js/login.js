// @ts-nocheck
import { 
  auth, 
  db, 
  googleProvider, 
  facebookProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  doc, 
  setDoc, 
  getDoc,
  getFirebaseErrorMessage 
} from './firebase.js';
import { showNotification, showLoading, hideLoading } from './notifications.js';
import { getUserRole } from './auth.js';

async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');

  if (!emailInput || !passwordInput || !loginBtn) {
    showNotification('Erreur : éléments du formulaire manquants', 'error');
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showNotification('Veuillez remplir tous les champs', 'error');
    return;
  }

  const loading = showLoading('Connexion en cours...');
  loginBtn.disabled = true;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const role = await getUserRole(user.uid, user.email);

    showNotification('Connexion réussie !', 'success');
    
    const successModal = document.getElementById('successModal');
    if (successModal) {
      successModal.style.display = 'flex';
    }
    
    setTimeout(() => {
      const isInRoot = window.location.pathname === '/' || window.location.pathname.includes('/index.html');
      const basePath = isInRoot ? '' : '../';
      if (role === 'artist') {
        window.location.href = `${basePath}html/dashboard/dashboard-artiste.html`;
      } else if (role === 'moderator') {
        window.location.href = `${basePath}html/dashboard/dashboard-moderateur.html`;
      } else {
        window.location.href = `${basePath}index.html`;
      }
    }, 2000);
  } catch (error) {
    console.error("Erreur de connexion:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
    loginBtn.disabled = false;
  }
}

async function handleSocialLogin(provider, providerName) {
  const loading = showLoading(`Connexion avec ${providerName}...`);
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ')[1] || '',
        email: user.email || '',
        role: 'fan',
        created_at: new Date(),
        newsletter: false
      });

      await setDoc(doc(db, "fans", user.uid), {
        user_id: user.uid,
        favorite_genres: [],
        location: '',
        interests: '',
        following_count: 0,
        liked_tracks: []
      });
    }

    const role = await getUserRole(user.uid, user.email);
    showNotification(`Connexion avec ${providerName} réussie !`, 'success');
    
    setTimeout(() => {
      const isInRoot = window.location.pathname === '/' || window.location.pathname.includes('/index.html');
      const basePath = isInRoot ? '' : '../';
      if (role === 'artist') {
        window.location.href = `${basePath}html/dashboard/dashboard-artiste.html`;
      } else if (role === 'moderator') {
        window.location.href = `${basePath}html/dashboard/dashboard-moderateur.html`;
      } else {
        window.location.href = `${basePath}index.html`;
      }
    }, 2000);
  } catch (error) {
    console.error(`Erreur ${providerName} Auth:`, error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      const input = document.getElementById(target);
      const toggle = document.getElementById(`${target}Toggle`);
      if (input && toggle) {
        input.type = input.type === 'password' ? 'text' : 'password';
        toggle.classList.toggle('fa-eye-slash');
        toggle.classList.toggle('fa-eye');
      }
    });
  });

  const googleBtn = document.querySelector('.btn-social.google');
  const facebookBtn = document.querySelector('.btn-social.facebook');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', () => handleSocialLogin(googleProvider, 'Google'));
  }
  
  if (facebookBtn) {
    facebookBtn.addEventListener('click', () => handleSocialLogin(facebookProvider, 'Facebook'));
  }

  const rememberCheckbox = document.getElementById('remember');
  if (rememberCheckbox) {
    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail && document.getElementById('loginEmail')) {
      document.getElementById('loginEmail').value = savedEmail;
      rememberCheckbox.checked = true;
    }
    rememberCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        const email = document.getElementById('loginEmail')?.value;
        if (email) localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
    });
  }

  const successModal = document.getElementById('successModal');
  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.style.display = 'none';
      }
    });
  }
});