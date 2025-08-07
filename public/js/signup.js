// Gestion des étapes
// @ts-nocheck
let currentStep = 1;

function showStep(stepNumber) {
    // Masquer toutes les étapes
    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });
    
    // Afficher l'étape actuelle
    document.getElementById(`step${stepNumber}`).classList.add('active');
    
    // Mettre à jour l'indicateur d'étapes
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
    
    currentStep = stepNumber;
}

function nextStep(e, stepNumber) {
    e.preventDefault();
    
    // Validation basique
    if (stepNumber === 2 && !validateStep1()) {
        return;
    }
    
    if (stepNumber === 3 && !validateStep2()) {
        return;
    }
    
    showStep(stepNumber);
}

function previousStep(stepNumber) {
    showStep(stepNumber);
}

function validateStep1() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return false;
    }
    
    return true;
}

function validateStep2() {
    // Validation basique de l'étape 2
    return true;
}

// Afficher la force du mot de passe
document.getElementById('password').addEventListener('input', function() {
    const password = this.value;
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    // Calcul simplifié de la force
    let strength = 0;
    if (password.length > 0) strength += 20;
    if (password.length >= 8) strength += 30;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    strength = Math.min(strength, 100);
    strengthFill.style.width = `${strength}%`;
    
    // Couleur et texte
    if (strength < 40) {
        strengthFill.style.backgroundColor = 'var(--danger)';
        strengthText.textContent = 'Faible';
        strengthText.style.color = 'var(--danger)';
    } else if (strength < 70) {
        strengthFill.style.backgroundColor = 'var(--warning)';
        strengthText.textContent = 'Moyen';
        strengthText.style.color = 'var(--warning)';
    } else {
        strengthFill.style.backgroundColor = 'var(--success)';
        strengthText.textContent = 'Fort';
        strengthText.style.color = 'var(--success)';
    }
});

// Basculer la visibilité du mot de passe
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(`${inputId}Toggle`);
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        toggle.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Gestion de l'inscription
function handleSignUp() {
    if (!document.getElementById('terms').checked) {
        alert('Veuillez accepter les conditions d\'utilisation');
        return;
    }
    
    // Récupérer les données du formulaire
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        artistName: document.getElementById('artistName').value,
        accountType: document.querySelector('input[name="accountType"]:checked').value,
        genre: document.getElementById('genre').value,
        location: document.getElementById('location').value,
        bio: document.getElementById('bio').value,
        newsletter: document.getElementById('newsletter').checked
    };
    
    // Afficher le récapitulatif
    document.getElementById('summaryName').textContent = `${formData.firstName} ${formData.lastName}`;
    document.getElementById('summaryEmail').textContent = formData.email;
    document.getElementById('summaryArtistName').textContent = formData.artistName;
    document.getElementById('summaryGenre').textContent = document.getElementById('genre').options[document.getElementById('genre').selectedIndex].text;
    document.getElementById('summaryLocation').textContent = formData.location;
    
    // Afficher la modal de succès
    document.getElementById('successModal').style.display = 'flex';
    
    // Simulation d'envoi
    console.log('Données d\'inscription:', formData);
}

// Fermer la modal
document.querySelector('.modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
});