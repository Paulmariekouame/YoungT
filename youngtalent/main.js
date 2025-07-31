// main.js

// Animation du bouton "Devenir Artiste"
document.addEventListener("DOMContentLoaded", function () {
    const artistBtn = document.querySelector("#devenirArtiste");

    if (artistBtn) {
        artistBtn.addEventListener("mouseover", () => {
            artistBtn.style.backgroundColor = "#ff4b2b";
            artistBtn.style.transform = "scale(1.05)";
        });

        artistBtn.addEventListener("mouseout", () => {
            artistBtn.style.backgroundColor = "";
            artistBtn.style.transform = "scale(1)";
        });

        artistBtn.addEventListener("click", () => {
            alert("Bienvenue, futur artiste ! 🌟 Prépare ta meilleure création !");
        });
    }

    // Message aléatoire inspirant
    const messages = [
        "Ton talent mérite d'être entendu 🎶",
        "Chaque artiste commence quelque part 🎤",
        "Le monde attend ton musique 🌍"
    ];
    const messageElement = document.createElement("div");
    messageElement.textContent = messages[Math.floor(Math.random() * messages.length)];
    messageElement.style.marginTop = "20px";
    messageElement.style.fontWeight = "bold";
    messageElement.style.color = "#444";
    document.body.appendChild(messageElement);
});
