class Loop {
    constructor(game) {
        this.game = game; // Reference to the main game instance
        this.rafId = null; // Stores the requestAnimationFrame ID
    }

    /**
     * Starts the game loop.
     */
    start() {
        if (this.rafId) {
            console.warn("Loop.start() called but loop is already running.");
            return; // Already running
        }
        console.log("Loop starting...");
        // Use an arrow function to maintain 'this' context when calling game.update
        // Or bind the tick method: this.tick = this.tick.bind(this); in constructor
        this.rafId = requestAnimationFrame((timestamp) => this.tick(timestamp));
    }

    /**
     * Stops the game loop.
     */
    stop() {
        if (!this.rafId) {
            console.warn("Loop.stop() called but loop is not running.");
            return; // Not running
        }
        console.log("Loop stopping...");
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }

    /**
     * The function that gets called each frame by requestAnimationFrame.
     * @param {number} timestamp - The high-resolution timestamp provided by the browser.
     */
    tick(timestamp) {
        // Call the main game update logic
        this.game.update(timestamp);

        // Request the next frame if the loop is still supposed to be running
        // (Game.stop() would set this.rafId to null)
        if (this.rafId) {
            this.rafId = requestAnimationFrame((newTimestamp) => this.tick(newTimestamp));
        }
    }
}

export default Loop;