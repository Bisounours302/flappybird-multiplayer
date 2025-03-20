// Game physics and collision detection

// Generate the initial pipes based on the seed random
function generateInitialPipes(canvas, seedRandom) {
    const pipes = [];
    const lastPipeX = canvas.width;
    
    // The first pipes are the same for everyone (based on the seed)
    for (let i = 0; i < 3; i++) {
        const x = canvas.width + i * 300;
        const gapY = 100 + seedRandom() * (canvas.height - 300);
        pipes.push({ x: x, gapY: gapY, passed: false });
    }
    
    return { pipes, lastPipeX };
}

// Update pipes positions
function updatePipes(pipes, canvas, pipeWidth, pipeSpeed, seedRandom) {
    let scoreIncrement = 0;
    
    // Move all pipes to the left
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
        
        // Check if pipe was passed
        if (!pipe.passed && pipe.x + pipeWidth < 50) {
            pipe.passed = true;
            scoreIncrement = 1; // Player passed a pipe
        }
    });
    
    // Remove pipes that are off screen
    if (pipes.length > 0 && pipes[0].x < -pipeWidth) {
        pipes.shift();
    }
    
    // Add new pipe when needed
    if (pipes.length > 0 && pipes[pipes.length - 1].x < canvas.width - 300) {
        const gapY = 100 + seedRandom() * (canvas.height - 300);
        pipes.push({
            x: canvas.width,
            gapY: gapY,
            passed: false
        });
    }
    
    return { pipes, scoreIncrement };
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
        ctx.translate(player.x + 10, player.y + 10);
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

export { 
    generateInitialPipes, 
    updatePipes, 
    checkCollisions,
    drawGame
};
