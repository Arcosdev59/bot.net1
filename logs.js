document.addEventListener('DOMContentLoaded', () => {
    const logContainer = document.getElementById('logs');
    const logLevelSelect = document.getElementById('logLevel');
    const clearLogsButton = document.getElementById('clearLogs');
    let logs = [];

    // Fonction pour ajouter un log dans la console
    function addLog(type, message, salon) {
        const newLog = document.createElement('div');
        newLog.textContent = `[${type.toUpperCase()}] [Salon: ${salon}] ${message}`;
        logContainer.appendChild(newLog);
        logs.push({ type, message, salon });
        logContainer.scrollTop = logContainer.scrollHeight; // Scroll vers le bas de la console
        filterLogs();
    }

    // Fonction pour filtrer les logs selon le niveau sélectionné
    function filterLogs() {
        const selectedLevel = logLevelSelect.value;
        logContainer.innerHTML = ''; // Vide l'affichage

        logs.forEach(log => {
            if (selectedLevel === 'all' || log.type === selectedLevel) {
                const logElement = document.createElement('div');
                logElement.textContent = `[${log.type.toUpperCase()}] [Salon: ${log.salon}] ${log.message}`;
                logContainer.appendChild(logElement);
            }
        });
    }

    // Effacer les logs
    clearLogsButton.addEventListener('click', function() {
        logContainer.innerHTML = ''; // Vide l'affichage
        logs = []; // Réinitialise les logs stockés
    });

    // Connexion au WebSocket (remplace 'ws://localhost:8080' par l'URL correcte de ton serveur)
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = function() {
        addLog('info', 'WebSocket connection opened.', 'Système');
    };

    socket.onmessage = function(event) {
        const logData = JSON.parse(event.data);
        // Assurez-vous que le logData contient une propriété salon
        const salon = logData.salon || 'Non spécifié'; // Si pas de salon, mettre 'Non spécifié'
        addLog(logData.type, logData.message, salon);
    };

    socket.onerror = function(error) {
        addLog('error', 'WebSocket error: ' + error.message, 'Système');
    };

    socket.onclose = function() {
        addLog('warning', 'WebSocket connection closed.', 'Système');
    };
});
