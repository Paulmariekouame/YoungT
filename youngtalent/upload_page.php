<?php
// Inclure les fonctions essentielles
require_once 'functions.php';
session_start();

// Traitement de l'upload si le formulaire est soumis
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
        flashMessage('Aucun fichier valide sélectionné.', 'error');
        redirectWithMessage('/upload_page.php', 'error');
        exit;
    }

    // Upload sécurisé
    $result = uploadFile($_FILES['audio'], 'uploads/audio', ['audio/mpeg', 'audio/wav', 'audio/ogg'], 50 * 1024 * 1024);
    
    if ($result['success']) {
        createNotification($db, $_SESSION['user_id'], 'Upload réussi', 'Votre fichier audio a été ajouté.', 'success', '/my-audios', 'upload');
        flashMessage('Fichier uploadé avec succès !', 'success');
        redirectWithMessage('/my-audios', 'success');
    } else {
        flashMessage($result['error'], 'error');
        redirectWithMessage('/upload_page.php', 'error');
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Uploader un fichier audio</title>
    <link rel="stylesheet" href="footer.css">
    <link rel="stylesheet" href="upload.css">
</head>
<body>
    <main>
        <h1>Uploader ton talent 🎤</h1>
        <?php displayFlashMessage(); ?>
        <form action="upload_page.php" method="POST" enctype="multipart/form-data">
            <label for="audio">Choisis ton fichier audio :</label>
            <input type="file" name="audio" id="audio" accept=".mp3,.wav,.ogg" required>
            <button type="submit">Envoyer</button>
        </form>
    </main>

    <?php include 'footer.php'; ?>

    <script src="assets/js/footer.js"></script>
</body>
</html>
