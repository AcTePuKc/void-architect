// Import the main Game class
import Game from './core/Game.js';

// Basic check to ensure we're in a browser environment
if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error("Void Architect must be run in a browser environment.");
} else {
    // Create a new game instance
    const voidArchitectGame = new Game();

    // Initialize the game (setup managers, load data, etc.)
    voidArchitectGame.init();

    // Start the game loop and make things interactive
    voidArchitectGame.start();

    // Optional: Make the game instance accessible globally for debugging
    // Be careful with this in production!
    window.VAGame = voidArchitectGame;
    console.log("Void Architect Initialized. Access with VAGame in console.");
}