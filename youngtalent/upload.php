<?php
require_once 'functions.php';
session_start();

// Vérification de l'envoi
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Vérifie qu’un fichier a été soumis
    if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
        flashMessage('Aucun fichier valide sélectionné.', 'error');
        redirectWithMessage('/upload', 'error');
        exit;
    }

    // Upload sécurisé (type MIME + taille max 50MB)
    $result = uploadFile($_FILES['audio'], 'uploads/audio', ['audio/mpeg', 'audio/wav', 'audio/ogg'], 50 * 1024 * 1024);
    
    if ($result['success']) {
        // Notifier l’utilisateur
        createNotification($db, $_SESSION['user_id'], 'Upload réussi', 'Votre fichier audio a été ajouté.', 'success', '/my-audios', 'upload');
        
        flashMessage('Fichier uploadé avec succès !', 'success');
        redirectWithMessage('/my-audios', 'success');
    } else {
        flashMessage($result['error'], 'error');
        redirectWithMessage('/upload', 'error');
    }
} else {
    // Protection contre accès direct
    redirectWithMessage('/', 'error');
}
?>
