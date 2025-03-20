const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir les fichiers statiques du client
app.use(express.static('../client'));

// État du jeu
let players = {};
let gameState = {
    status: 'waiting', // 'waiting', 'playing', 'leaderboard'
    timeRemaining: 300, // 5 minutes en secondes
    leaderboardTime: 20, // temps d'affichage du leaderboard en secondes
    roundSeed: Math.floor(Math.random() * 1000) // seed pour générer la même map
};

// Gestion des connexions
io.on('connection', (socket) => {
    console.log(`Nouveau joueur connecté : ${socket.id}`);
    
    // Quand un joueur rejoint avec un pseudo
    socket.on('join_game', (username) => {
        console.log(`${socket.id} a rejoint comme ${username}`);
        
        // Initialiser le joueur
        players[socket.id] = {
            username: username,
            x: 50,
            y: 200,
            alive: true,
            score: 0
        };
        
        // Envoi de l'état actuel au nouveau joueur
        socket.emit('game_state', {
            status: gameState.status,
            timeRemaining: gameState.timeRemaining,
            leaderboardTime: gameState.leaderboardTime,
            seed: gameState.roundSeed
        });
        
        // Notifier les autres joueurs
        socket.broadcast.emit('player_joined', {
            id: socket.id,
            username: username
        });
    });

    // Quand un joueur saute
    socket.on('jump', () => {
        if (players[socket.id] && players[socket.id].alive && gameState.status === 'playing') {
            players[socket.id].y -= 30; // Saut
        }
    });

    // Quand un joueur meurt
    socket.on('dead', () => {
        if (players[socket.id]) {
            players[socket.id].alive = false;
        }
    });

    // Mise à jour du score
    socket.on('update_score', (score) => {
        if (players[socket.id] && gameState.status === 'playing') {
            players[socket.id].score = score;
        }
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log(`Joueur déconnecté : ${socket.id}`);
        delete players[socket.id];
    });
});

// Mise à jour du jeu (60 FPS)
setInterval(() => {
    // Mise à jour des joueurs
    for (let id in players) {
        if (players[id].alive && gameState.status === 'playing') {
            players[id].y += 2; // Gravité
        }
    }
    
    // Envoie l'état à tous les clients
    io.emit('update', { 
        players,
        gameState: {
            status: gameState.status,
            timeRemaining: gameState.timeRemaining
        }
    });
}, 16);

// Gestion du temps de jeu
setInterval(() => {
    if (gameState.status === 'playing') {
        gameState.timeRemaining--;
        
        if (gameState.timeRemaining <= 0) {
            // Fin du round, passage à l'affichage du leaderboard
            gameState.status = 'leaderboard';
            gameState.timeRemaining = gameState.leaderboardTime;
            
            // Trier les joueurs par score pour le leaderboard
            const leaderboard = Object.values(players)
                .sort((a, b) => b.score - a.score)
                .map(p => ({ username: p.username, score: p.score }));
            
            io.emit('show_leaderboard', leaderboard);
        }
    } else if (gameState.status === 'leaderboard') {
        gameState.timeRemaining--;
        
        if (gameState.timeRemaining <= 0) {
            // Nouvelle partie
            gameState.status = 'playing';
            gameState.timeRemaining = 300; // 5 minutes
            gameState.roundSeed = Math.floor(Math.random() * 1000);
            
            // Réinitialiser les joueurs
            for (let id in players) {
                players[id].x = 50;
                players[id].y = 200;
                players[id].alive = true;
                players[id].score = 0;
            }
            
            io.emit('new_round', {
                seed: gameState.roundSeed
            });
        }
    } else if (gameState.status === 'waiting' && Object.keys(players).length > 0) {
        // Démarrer le jeu s'il y a des joueurs et qu'on est en attente
        gameState.status = 'playing';
        gameState.timeRemaining = 300; // 5 minutes
        io.emit('game_start');
    }
}, 1000);

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});