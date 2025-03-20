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
    roundSeed: Math.floor(Math.random() * 1000), // seed pour générer la même map
    worldOffset: 0 // Position horizontale du monde de jeu
};

// Vitesse de défilement du monde
const WORLD_SPEED = 2;

// Gestion des connexions
io.on('connection', (socket) => {
    console.log(`Nouveau joueur connecté : ${socket.id}`);
    
    // Quand un joueur rejoint avec un pseudo
    socket.on('join_game', (username) => {
        console.log(`${socket.id} a rejoint comme ${username}`);
        
        // Initialiser le joueur
        players[socket.id] = {
            username: username,
            x: 100, // Position X initiale - tous les joueurs commencent au même X
            y: 200, // Position Y initiale
            alive: true,
            score: 0,
            distance: 0 // Distance parcourue par le joueur
        };
        
        // Envoi de l'état actuel au nouveau joueur
        socket.emit('game_state', {
            status: gameState.status,
            timeRemaining: gameState.timeRemaining,
            leaderboardTime: gameState.leaderboardTime,
            seed: gameState.roundSeed,
            worldOffset: gameState.worldOffset
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
    
    // Quand un joueur veut rejouer après être mort
    socket.on('restart', () => {
        if (players[socket.id] && !players[socket.id].alive && gameState.status === 'playing') {
            players[socket.id].alive = true;
            players[socket.id].x = 100; // Retour à la position initiale
            players[socket.id].y = 200;
            players[socket.id].distance = 0; // Réinitialiser la distance
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
    if (gameState.status === 'playing') {
        // Avance du monde de jeu
        gameState.worldOffset += WORLD_SPEED;
        
        // Mise à jour des joueurs
        for (let id in players) {
            if (players[id].alive) {
                players[id].y += 2; // Gravité
                
                // Mettre à jour la distance parcourue (uniquement pour les joueurs vivants)
                players[id].distance += WORLD_SPEED;
                // Utiliser la distance comme score
                players[id].score = Math.floor(players[id].distance / 10);
            }
        }
    }
    
    // Envoie l'état à tous les clients
    io.emit('update', { 
        players,
        gameState: {
            status: gameState.status,
            timeRemaining: gameState.timeRemaining,
            worldOffset: gameState.worldOffset
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
            
            // Trier les joueurs par distance (score) pour le leaderboard
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
            gameState.worldOffset = 0; // Réinitialiser la position du monde
            
            // Réinitialiser les joueurs
            for (let id in players) {
                players[id].x = 100;
                players[id].y = 200;
                players[id].alive = true;
                players[id].score = 0;
                players[id].distance = 0;
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

// Add error handling for the server
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Add error handling for socket.io
io.on('error', (err) => {
    console.error('Socket.io error:', err);
});

// Add uncaught exception handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Don't exit the process - this keeps your app running
});

// Add unhandled rejection handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process
});

server.listen(3001, () => {
    console.log('Serveur démarré sur http://localhost:3001');
});