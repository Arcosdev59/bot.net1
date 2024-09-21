const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws'); // Ajout du WebSocket
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent]
});

// Initialisation d'Express.js
const app = express();
app.use(bodyParser.json()); // Permet de lire les JSON dans les requêtes POST
app.use(express.static('web')); // Dossier pour servir les fichiers statiques (site web)

// Command prefix
const prefix = '!';

// Création d'une liste pour stocker les clients WebSocket connectés
let wsClients = [];

// Création du serveur WebSocket pour les logs
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
    console.log('Un client WebSocket s\'est connecté.');
    wsClients.push(ws); // Ajoute le client WebSocket à la liste

    // Gestion de la déconnexion des clients WebSocket
    ws.on('close', () => {
        console.log('Client WebSocket déconnecté.');
        wsClients = wsClients.filter(client => client !== ws); // Retirer le client de la liste
    });
});

// Fonction pour envoyer un log à tous les clients WebSocket connectés
function broadcastLog(log) {
    console.log('Tentative d\'envoi du log aux clients WebSocket:', log); // Log pour confirmation

    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            console.log('Envoi du log à un client WebSocket :', log); // Log quand un client est ouvert
            client.send(JSON.stringify(log)); // Envoi du log via WebSocket
        } else {
            console.log('Client WebSocket fermé ou non prêt.'); // Log si le client WebSocket n'est pas prêt
        }
    });
}


// Bot ready event
client.once('ready', () => {
    console.log(`${client.user.tag} est en ligne !`);
    broadcastLog({ type: 'info', message: `${client.user.tag} est en ligne !` });
});

// Lorsqu'un message est envoyé dans une guilde
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const logMessage = {
        type: 'info',
        message: `${message.author.tag}: ${message.content}`
    };

    console.log('Message capté par le bot :', logMessage); // Vérifier dans la console du serveur

    broadcastLog(logMessage); // Envoyer aux clients WebSocket
});


// API pour Clear Messages
app.post('/api/clear', async (req, res) => {
    const { channelId, amount } = req.body;

    try {
        // Récupère le canal
        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.status(404).json({ message: 'Canal non trouvé.' });

        // Vérifier que le canal est un canal de texte
        if (!channel.isTextBased()) {
            return res.status(400).json({ message: 'Le canal spécifié n\'est pas un canal de texte.' });
        }

        // Supprimer les messages (max 100 messages à la fois, Discord impose cette limite)
        const messages = await channel.bulkDelete(parseInt(amount), true);
        if (!messages.size) {
            return res.status(400).json({ message: 'Impossible de supprimer les messages. Vérifiez qu\'ils sont plus récents que 14 jours.' });
        }

        res.json({ message: `${messages.size} messages supprimés dans le canal ${channelId}` });
        broadcastLog({ type: 'info', message: `${messages.size} messages supprimés dans le canal ${channelId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression des messages' });
        broadcastLog({ type: 'error', message: 'Erreur lors de la suppression des messages' });
    }
});

// API pour Ban User
app.post('/api/ban', async (req, res) => {
    const { guildId, userId } = req.body;

    try {
        // Récupérer le serveur (guild)
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ message: 'Serveur non trouvé.' });

        // Récupérer le membre à bannir
        const member = await guild.members.fetch(userId);
        if (!member) return res.status(404).json({ message: 'Utilisateur non trouvé dans ce serveur.' });

        // Bannir l'utilisateur
        await member.ban();
        res.json({ message: `Utilisateur ${member.user.tag} banni.` });
        broadcastLog({ type: 'info', message: `Utilisateur ${member.user.tag} banni.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors du bannissement de l\'utilisateur' });
        broadcastLog({ type: 'error', message: 'Erreur lors du bannissement de l\'utilisateur' });
    }
});

// API pour Envoyer un Message
app.post('/api/sendMessage', async (req, res) => {
    const { channelId, messageContent } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.status(404).json({ message: 'Channel not found' });

        await channel.send(messageContent);
        res.json({ message: `Message envoyé dans le canal ${channelId}` });
        broadcastLog({ type: 'info', message: `Message envoyé dans le canal ${channelId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
        broadcastLog({ type: 'error', message: 'Erreur lors de l\'envoi du message' });
    }
});

// Démarrer le serveur web et intégrer le WebSocket
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Serveur web démarré sur le port ${PORT}`);
});

// Upgrade la connexion pour WebSocket
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// API pour Envoyer un Embed
app.post('/api/sendEmbed', async (req, res) => {
    const { channelId, embed } = req.body;

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) return res.status(404).json({ message: 'Canal non trouvé.' });

        // Vérification que le canal est un canal textuel
        if (!channel.isTextBased()) {
            return res.status(400).json({ message: 'Le canal spécifié n\'est pas un canal de texte.' });
        }

        // Validation de la couleur pour s'assurer qu'elle est dans la plage correcte
        const embedColor = embed.color ? parseInt(embed.color, 16) : 0xFFFFFF; // Blanc par défaut
        if (embedColor < 0 || embedColor > 16777215) {
            return res.status(400).json({ message: 'Couleur de l\'embed invalide. Elle doit être comprise entre 0x000000 et 0xFFFFFF.' });
        }

        // Création de l'embed à partir des données reçues
        const embedMessage = {
            title: embed.title,
            description: embed.description,
            color: embedColor
        };

        // Envoi de l'embed dans le canal
        await channel.send({ embeds: [embedMessage] });

        res.json({ message: `Embed envoyé dans le canal ${channelId}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'embed' });
    }
});




// Connecter le bot Discord
client.login(process.env.TOKEN);
