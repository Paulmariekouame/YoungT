// login.js
// @ts-nocheck
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(inputId + 'Toggle');
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const modal = document.getElementById('successModal');
    
    // Simulation de connexion réussie
    modal.style.display = 'flex';
    
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 2000);
}

function loginWithGoogle() {
    console.log('Connexion avec Google');
    // Implémentation réelle ici
}

function loginWithFacebook() {
    console.log('Connexion avec Facebook');
    // Implémentation réelle ici
}