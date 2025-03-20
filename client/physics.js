// Game physics and collision detection

// Generate the initial pipes based on the seed random
function generateInitialPipes(canvas, seedRandom, worldOffset = 0) {
    const pipes = [];
    const pipeSpacing = 300; // Distance between pipes
    
    // Calculate how many pipes we need to fill the screen plus some buffer
    const numPipes = Math.ceil((canvas.width + 800) / pipeSpacing);
    
    // Calculate the starting x position for the first pipe based on world offset
    const firstPipeX = Math.floor(worldOffset / pipeSpacing) * pipeSpacing;
    
    for (let i = 0; i < numPipes; i++) {
        const x = firstPipeX + (i * pipeSpacing) - (worldOffset % pipeSpacing);
        
        // Use a consistent seed for each pipe position to ensure all players see same pipes
        const pipeSeed = firstPipeX + (i * pipeSpacing);
        const seedFunc = seededRandom(gameState.roundSeed + pipeSeed);
        
        const gapY = 100 + seedFunc() * (canvas.height - 300);
        pipes.push({ x: x, gapY: gapY, passed: false });
    }
    
    return { pipes, lastPipeX: pipes[pipes.length - 1].x };
}

// Update pipes positions based on world offset
function updatePipes(pipes, canvas, pipeWidth, worldOffset, lastWorldOffset, seedRandom) {
    const pipeSpacing = 300;
    const pipeMovement = worldOffset - lastWorldOffset;
    
    // Move all pipes to match world movement
    pipes.forEach(pipe => {
        pipe.x -= pipeMovement;
    });
    
    // Remove pipes that are off screen
    while (pipes.length > 0 && pipes[0].x < -pipeWidth) {
        pipes.shift();
    }
    
    // Add new pipes as needed
    const lastPipe = pipes[pipes.length - 1];
    if (lastPipe && lastPipe.x < canvas.width) {
        const newPipeX = lastPipe.x + pipeSpacing;
        const pipeSeed = Math.floor(worldOffset / pipeSpacing) * pipeSpacing + 
                          pipes.length * pipeSpacing;
        const seedFunc = seededRandom(gameState.roundSeed + pipeSeed);
        
        const gapY = 100 + seedFunc() * (canvas.height - 300);
        pipes.push({
            x: newPipeX,
            gapY: gapY,
            passed: false
        });
    }
    
    return { pipes };
}

// Check for collisions with pipes and boundaries
function checkCollisions(player, pipes, canvas, pipeWidth, pipeGap) {
    if (!player || !player.alive) return false;
    
    // Check for collision with ground or ceiling
    if (player.y + 20 > canvas.height || player.y < 0) {
        return true;
    }
    
    // Check for collision with pipes
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        if (
            player.x + 20 > pipe.x && 
            player.x < pipe.x + pipeWidth && 
            (player.y < pipe.gapY || player.y + 20 > pipe.gapY + pipeGap)
        ) {
            return true;
        }
    }
    
    return false;
}

// Draw the game elements
function drawGame(ctx, players, pipes, canvas, birdImg, pipeTopImg, pipeBottomImg, bgImg, groundImg, pipeWidth, pipeGap) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    
    // Draw pipes
    pipes.forEach(pipe => {
        // Top pipe
        ctx.drawImage(pipeTopImg, pipe.x, pipe.gapY - 320, pipeWidth, 320);
        
        // Bottom pipe
        ctx.drawImage(pipeBottomImg, pipe.x, pipe.gapY + pipeGap, pipeWidth, 320);
    });
    
    // Draw ground
    ctx.drawImage(groundImg, 0, canvas.height - 30, canvas.width, 30);
    
    // Draw birds (players)
    for (let id in players) {
        const player = players[id];
        
        // Skip drawing if player is not alive and is out of screen
        if (!player.alive && player.y > canvas.height) continue;
        
        // Draw the bird with a slight rotation based on vertical velocity
        ctx.save();
        ctx.translate(player.x, player.y + 10);
        ctx.rotate(player.alive ? Math.PI / 20 : Math.PI / 2); // Rotate more when dead
        ctx.globalAlpha = player.alive ? 1 : 0.6;
        ctx.drawImage(birdImg, -10, -10, 20, 20);
        ctx.restore();
        
        // Draw player name above the bird
        if (player.username) {
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.font = "10px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.strokeText(player.username, player.x + 10, player.y - 10);
            ctx.fillText(player.username, player.x + 10, player.y - 10);
        }
    }
}

// Helper function for seeded random
function seededRandom(seed) {
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

export { 
    generateInitialPipes, 
    updatePipes, 
    checkCollisions,
    drawGame,
    seededRandom
};
