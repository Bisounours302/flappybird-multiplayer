// Game assets and resources

// Bird image
const birdImg = new Image();
birdImg.src = 'images/FlappyBird.png';

// Pipe images
const pipeTopImg = new Image();
pipeTopImg.src = 'images/pipeTop.png';

const pipeBottomImg = new Image();
pipeBottomImg.src = 'images/pipeBottom.png';

// Background and ground images
const bgImg = new Image();
bgImg.src = 'images/backGround.png';

const groundImg = new Image();
groundImg.src = 'images/Ground.png';

// Helper function to generate consistent random numbers based on seed
function seededRandom(seed) {
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
}

// Function to format the timer
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Export elements for use in other files
export { birdImg, pipeTopImg, pipeBottomImg, bgImg, groundImg, seededRandom, formatTime };
