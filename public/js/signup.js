// @ts-nocheck
import { 
  auth, 
  db, 
  googleProvider, 
  facebookProvider, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  doc, 
  setDoc,
  getFirebaseErrorMessage
} from './firebase.js';
import { showNotification, showLoading, hideLoading } from './notifications.js';

let currentStep = 1;
let formData = {};

// Fonction pour afficher une étape spécifique
function showStep(stepNumber) {
  
  // Masquer toutes les étapes
  document.querySelectorAll('.step-content').forEach(step => {
    step.classList.remove('active');
  });
  
  // Afficher l'étape courante
  const currentStepElement = document.getElementById(`step${stepNumber}`);
  if (!currentStepElement) {
    return;
  }
  
  console.log(`Affichage de l'étape ${stepNumber}`);
  currentStepElement.classList.add('active');
  
  // Mettre à jour l'indicateur d'étapes
  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index + 1 < stepNumber) {
      step.classList.add('completed');
    } else if (index + 1 === stepNumber) {
      step.classList.add('active');
    }
  });
  
  currentStep = stepNumber;
}

// Validation de l'étape 1
function validateStep1() {
  
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showNotification('Veuillez remplir tous les champs obligatoires', 'error');
    return false;
  }
  
  if (password !== confirmPassword) {
    showNotification('Les mots de passe ne correspondent pas', 'error');
    return false;
  }
  
  if (password.length < 8) {
    showNotification('Le mot de passe doit contenir au moins 8 caractères', 'error');
    return false;
  }
  
  // Stocker les données
  formData.firstName = firstName;
  formData.lastName = lastName;
  formData.email = email;
  formData.password = password;
  return true;
}

// Validation de l'étape 2
function validateStep2() {
  
  const accountType = document.querySelector('input[name="accountType"]:checked')?.value;
  
  if (!accountType) {
    showNotification('Veuillez sélectionner un type de compte', 'error');
    
    return false;
  }
  
  formData.accountType = accountType;
;
  
  if (accountType === 'artist') {
    const artistName = document.getElementById('artistName').value.trim();
    const genre = document.getElementById('genre').value;
    
    if (!artistName) {
      showNotification('Veuillez entrer un nom d\'artiste', 'error');
      
      return false;
    }
    
    if (!genre) {
      showNotification('Veuillez sélectionner un genre musical', 'error');
      return false;
    }
    
    formData.artistName = artistName;
    formData.genre = genre;
    formData.location = document.getElementById('location').value.trim();
    formData.bio = document.getElementById('bio').value.trim();
  } else {
    const locationFan = document.getElementById('locationFan').value.trim();
    const favoriteGenres = Array.from(
      document.getElementById('favoriteGenres').selectedOptions
    ).map(opt => opt.value);
    
    if (!locationFan) {
      showNotification('Veuillez entrer votre localisation', 'error');
      
      return false;
    }
    
    formData.locationFan = locationFan;
    formData.favoriteGenres = favoriteGenres;
    formData.interests = document.getElementById('interests').value.trim();
  }
  
  
  return true;
}

// Mise à jour du résumé
function updateSummary() {
  
  
  document.getElementById('summaryName').textContent = `${formData.firstName} ${formData.lastName}`;
  document.getElementById('summaryEmail').textContent = formData.email;
  document.getElementById('summaryAccountType').textContent = formData.accountType === 'artist' ? 'Artiste' : 'Fan';
  
  if (formData.accountType === 'artist') {
   
    document.querySelectorAll('.artist-only').forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.fan-only').forEach(el => el.style.display = 'none');
    document.getElementById('summaryArtistName').textContent = formData.artistName;
    document.getElementById('summaryGenre').textContent = formData.genre;
    document.getElementById('summaryLocation').textContent = formData.location || 'Non spécifié';
  } else {
   
    document.querySelectorAll('.artist-only').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.fan-only').forEach(el => el.style.display = 'flex');
    document.getElementById('summaryFavoriteGenres').textContent = formData.favoriteGenres.join(', ') || 'Non spécifié';
    document.getElementById('summaryLocation').textContent = formData.locationFan || 'Non spécifié';
  }
}

// Gestion de l'inscription
async function handleSignUp() {
  
  
  const terms = document.getElementById('terms').checked;
  const newsletter = document.getElementById('newsletter').checked;
  const signUpBtn = document.getElementById('signUpBtn');
  
  if (!terms) {
    showNotification('Veuillez accepter les conditions d\'utilisation', 'error');
    
    return;
  }

  const loading = showLoading('Création de votre compte...');
  signUpBtn.disabled = true;
  

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      formData.email, 
      formData.password
    );
    const user = userCredential.user;
    const role = formData.accountType;

    await setDoc(doc(db, "users", user.uid), {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role,
      created_at: new Date(),
      newsletter
    });

    // Enregistrement des données spécifiques
    if (role === 'artist') {

      await setDoc(doc(db, "artists", user.uid), {
        user_id: user.uid,
        stage_name: formData.artistName,
        genre: formData.genre,
        location: formData.location,
        bio: formData.bio,
        profile_picture: '',
        social_links: [],
        verified: false
      });
    } else {
      await setDoc(doc(db, "fans", user.uid), {
        user_id: user.uid,
        favorite_genres: formData.favoriteGenres,
        location: formData.locationFan,
        interests: formData.interests
      });
    }

    // Affichage du message de succès
    document.getElementById('successModal').style.display = 'flex';
    showNotification('Compte créé avec succès !', 'success');
    
    // Redirection automatique
    setTimeout(() => {

      window.location.href = role === 'artist' 
        ? '../html/dashboard/dashboard-artiste.html' 
        : '../index.html';
    }, 3000);

  } catch (error) {
    console.error("Erreur d'inscription:", error);
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
    signUpBtn.disabled = false;
  
  }
}

// Gestion de la connexion sociale
async function handleSocialSignUp(provider, providerName) {

  const loading = showLoading(`Inscription avec ${providerName}...`);
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ')[1] || '',
      email: user.email,
      role: 'fan',
      created_at: new Date(),
      newsletter: false
    });

    await setDoc(doc(db, "fans", user.uid), {
      user_id: user.uid,
      favorite_genres: [],
      location: '',
      interests: ''
    });

    showNotification(`Inscription avec ${providerName} réussie !`, 'success');
    setTimeout(() => {
      console.log('Redirection vers l\'accueil');
      window.location.href = '../index.html';
    }, 1500);
  } catch (error) {
    showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
    hideLoading(loading);
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  
  // Afficher la première étape
  showStep(1);

  // Navigation entre étapes - Version robuste
  const step1Next = document.getElementById('step1Next') || document.querySelector('#step1 .btn-primary');
  const step2Next = document.getElementById('step2Next') || document.querySelector('#step2 .btn-primary');
  const prevStep2 = document.getElementById('prevStep2');
  const prevStep3 = document.getElementById('prevStep3');

  if (step1Next) {
    step1Next.addEventListener('click', (e) => {
      e.preventDefault();
     
      if (validateStep1()) {
        showStep(2);
      }
    });
  } else {
    console.error('Bouton Suivant Étape 1 non trouvé');
  }

  if (step2Next) {
    step2Next.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (validateStep2()) {
        updateSummary();
        showStep(3);
      }
    });
  } else {
    console.error('Bouton Suivant Étape 2 non trouvé');
  }

  if (prevStep2) {
   
    prevStep2.addEventListener('click', (e) => {
      e.preventDefault();
      
      showStep(1);
    });
  }

  if (prevStep3) {
    
    prevStep3.addEventListener('click', (e) => {
      e.preventDefault();
      
      showStep(2);
    });
  }

  // Bouton d'inscription final
  const signUpBtn = document.getElementById('signUpBtn');
  if (signUpBtn) {
    
    signUpBtn.addEventListener('click', handleSignUp);
  } else {
    console.error('Bouton d\'inscription non trouvé');
  }

  // Gestion du type de compte
  const accountTypeRadios = document.querySelectorAll('input[name="accountType"]');
  if (accountTypeRadios.length > 0) {
  
    accountTypeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const accountType = radio.value;
        
        
        document.getElementById('artistFields').style.display = 
          accountType === 'artist' ? 'block' : 'none';
        document.getElementById('fanFields').style.display = 
          accountType === 'fan' ? 'block' : 'none';
      });
    });
  }

  // Initialisation du type de compte
  const artistRadio = document.querySelector('input[name="accountType"][value="artist"]');
  if (artistRadio) {
    artistRadio.checked = true;
    document.getElementById('artistFields').style.display = 'block';
    document.getElementById('fanFields').style.display = 'none';
  
  }

  // Toggle mot de passe
  document.querySelectorAll('.password-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-target');
      const input = document.getElementById(target);
      const icon = document.getElementById(`${target}Toggle`);
      
      if (input && icon) {
        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('fa-eye-slash');
        icon.classList.toggle('fa-eye');
        
      }
    });
  });

  // Force du mot de passe
  const passwordInput = document.getElementById('password');
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      const strengthFill = document.getElementById('strengthFill');
      const strengthText = document.getElementById('strengthText');
      
      if (!strengthFill || !strengthText) return;
      
      let strength = 0;
      if (password.length > 0) strength += 20;
      if (password.length >= 8) strength += 30;
      if (/[A-Z]/.test(password)) strength += 20;
      if (/[0-9]/.test(password)) strength += 20;
      if (/[^A-Za-z0-9]/.test(password)) strength += 10;
      
      strength = Math.min(strength, 100);
      strengthFill.style.width = `${strength}%`;
      
      if (strength < 40) {
        strengthFill.style.backgroundColor = '#f44336';
        strengthText.textContent = 'Faible';
        strengthText.style.color = '#f44336';
      } else if (strength < 70) {
        strengthFill.style.backgroundColor = '#ff9800';
        strengthText.textContent = 'Moyen';
        strengthText.style.color = '#ff9800';
      } else {
        strengthFill.style.backgroundColor = '#4caf50';
        strengthText.textContent = 'Fort';
        strengthText.style.color = '#4caf50';
      }
    });
  }

  // Connexion sociale
  const googleBtn = document.querySelector('.btn-social.google');
  const facebookBtn = document.querySelector('.btn-social.facebook');

  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      handleSocialSignUp(googleProvider, 'Google');
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener('click', () => {
      handleSocialSignUp(facebookProvider, 'Facebook');
    });
  }
});