// Fonction pour envoyer un message
function sendMessage() {
    const channelId = document.getElementById('sendChannelId').value;
    const messageContent = document.getElementById('messageContent').value;

    if (channelId && messageContent.trim()) {
        fetch('/api/sendMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelId: channelId,
                messageContent: messageContent.trim()
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            alert('Erreur lors de l\'envoi du message');
            console.error('Erreur:', error);
        });
    } else {
        alert("Veuillez remplir tous les champs pour envoyer un message.");
    }
}

// Fonction pour nettoyer les messages d'un canal
function clearMessages() {
    const channelId = document.getElementById('clearChannelId').value;
    const amount = document.getElementById('clearAmount').value;

    if (channelId && amount && !isNaN(amount)) {
        fetch('/api/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelId: channelId,
                amount: parseInt(amount, 10) // Convertit la valeur en entier
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            alert('Erreur lors de la suppression des messages');
            console.error('Erreur:', error);
        });
    } else {
        alert("Veuillez remplir tous les champs pour la commande Clear, avec un nombre valide.");
    }
}

// Fonction pour bannir un utilisateur
function banUser() {
    const userId = document.getElementById('banUserId').value;
    const guildId = 'TON_GUILD_ID'; // Remplace par l'ID de ton serveur Discord

    if (userId.trim()) {
        fetch('/api/ban', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                guildId: guildId,
                userId: userId.trim()
            }),
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            alert('Erreur lors du bannissement de l\'utilisateur');
            console.error('Erreur:', error);
        });
    } else {
        alert("Veuillez entrer l'ID de l'utilisateur pour la commande Ban.");
    }
}

// Fonction pour envoyer un embed
function sendEmbed() {
    const channelId = document.getElementById('embedChannelId').value;
    const embedTitle = document.getElementById('embedTitle').value;
    const embedDescription = document.getElementById('embedDescription').value;
    const embedColor = document.getElementById('embedColor').value.replace("#", "").trim(); // Supprime le # de la couleur

    // Vérification des champs et validation du format de la couleur
    if (channelId && embedTitle && embedDescription && /^[0-9A-Fa-f]{6}$/.test(embedColor)) {
        const embedData = {
            title: embedTitle,
            description: embedDescription,
            color: parseInt(embedColor, 16) // Conversion hexadécimale en entier
        };

        console.log("Données à envoyer:", {
            channelId: channelId,
            embed: embedData
        });

        fetch('/api/sendEmbed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                channelId: channelId,
                embed: embedData
            }),
        })
        .then(response => {
            // Vérification si la réponse est du JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();  // Si JSON, on parse
            } else {
                throw new Error("Réponse du serveur non-JSON. Contenu reçu : " + contentType);
            }
        })
        .then(data => {
            alert(data.message); // Affichage du message de succès renvoyé par le serveur
        })
        .catch(error => {
            // En cas d'erreur, affichage de l'erreur dans une alerte et dans la console
            alert('Erreur lors de l\'envoi de l\'embed : ' + error.message);
            console.error('Erreur:', error);
        });
    } else {
        alert("Veuillez remplir tous les champs, avec une couleur valide au format hexadécimal.");
    }
}
