<?php
// Liste des morceaux (à remplacer par une base de données si besoin)
$musics = [
    ["title" => "Inspiration", "file" => "musics/inspiration.mp3"],
    ["title" => "Rythme Urbain", "file" => "musics/rythme_urbain.mp3"],
    ["title" => "Évasion", "file" => "musics/evasion.mp3"]
];
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Music - Young Talent</title>
</head>
<body>
    <h1>Morceaux disponibles</h1>
    <ul>
        <?php foreach ($musics as $music): ?>
            <li>
                <strong><?= $music['title'] ?></strong><br>
                <audio controls>
                    <source src="<?= $music['file'] ?>" type="audio/mpeg">
                    Votre navigateur ne supporte pas l'audio.
                </audio>
            </li>
        <?php endforeach; ?>
    </ul>
</body>
</html>
