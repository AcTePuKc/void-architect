import { INITIAL_STATE, SAVE_KEY } from './Constants.js'; // We'll define Constants.js next!

class StateManager {
    constructor(game) {
        this.game = game; // Reference to the main game instance, if needed
        this.currentState = null;
        this.storage = localStorage; // Use browser's local storage
    }

    /**
     * Loads the game state from storage or initializes a default state.
     * Should be called early in the Game.init() process.
     */
    loadGame() {
        console.log("Attempting to load game state...");
        try {
            const savedStateJSON = this.storage.getItem(SAVE_KEY);
            if (savedStateJSON) {
                const parsedState = JSON.parse(savedStateJSON);
                // Basic validation/migration could happen here if needed
                this.currentState = this.validateAndCleanState(parsedState);
                console.log("Game state loaded successfully.", this.currentState);
            } else {
                console.log("No saved state found, initializing default state.");
                this.initializeDefaultState();
            }
        } catch (error) {
            console.error("Error loading game state:", error);
            console.log("Initializing default state due to error.");
            this.initializeDefaultState();
        }
        // Ensure currentState is never null after load attempt
        if (!this.currentState) {
            this.initializeDefaultState();
        }
    }

    /**
     * Saves the current game state to storage.
     */
    saveGame() {
        if (!this.currentState) {
            console.error("Cannot save, current state is null.");
            return;
        }
        console.log("Saving game state...");
        try {
            const stateJSON = JSON.stringify(this.currentState);
            this.storage.setItem(SAVE_KEY, stateJSON);
            console.log("Game state saved.");
             // Optional: Provide user feedback via UI
            if (this.game.uiManager) {
                 this.game.uiManager.showTemporaryMessage("Game Saved!");
            }
        } catch (error) {
            console.error("Error saving game state:", error);
        }
    }

    /**
     * Resets the game state to its default values and saves.
     * Use with caution!
     */
    resetGame() {
        console.warn("Resetting game state to default...");
        if (confirm("Are you sure you want to completely reset your progress? This cannot be undone!")) {
            this.initializeDefaultState();
            this.saveGame(); // Save the fresh state
            // Potentially trigger a page reload or full game re-initialization
             alert("Game has been reset. Reloading...");
             window.location.reload(); // Simple way to ensure clean slate
            console.log("Game state has been reset.");
        } else {
            console.log("Game reset cancelled.");
        }
    }

    /**
     * Exports the current state as a JSON string for manual backup.
     */
    exportSave() {
        if (!this.currentState) {
            alert("No game state available to export.");
            return;
        }
        try {
            const stateJSON = JSON.stringify(this.currentState);
            // Copy to clipboard
            navigator.clipboard.writeText(stateJSON).then(() => {
                alert("Save data copied to clipboard!");
            }).catch(err => {
                console.error('Failed to copy save data: ', err);
                // Fallback: Prompt user to copy manually
                prompt("Could not copy automatically. Please copy this text manually:", stateJSON);
            });

            // Optional: Trigger download as .txt file
            // this.downloadSaveFile(stateJSON);

        } catch (error) {
            console.error("Error exporting save data:", error);
            alert("Failed to export save data.");
        }
    }

    /** Helper to trigger file download */
    downloadSaveFile(data, filename = 'void_architect_save.txt') {
        const blob = new Blob([data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
         console.log("Save file download initiated.");
    }


    /**
     * Imports a game state from a JSON string provided by the user.
     * @param {string} jsonString - The save data string.
     */
    importSave(jsonString) {
        if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
            alert("Import field is empty or invalid.");
            return;
        }
        console.log("Attempting to import save data...");
        try {
            const parsedState = JSON.parse(jsonString);
            // **Crucial: Validate the imported data structure**
            const validatedState = this.validateAndCleanState(parsedState);

            if (validatedState) {
                 if (confirm("Importing this save will overwrite your current progress. Are you sure?")) {
                    this.currentState = validatedState;
                    this.saveGame(); // Save the imported state immediately
                    alert("Save data imported successfully! Reloading game...");
                    window.location.reload(); // Reload to apply the new state cleanly
                 } else {
                     console.log("Import cancelled by user.");
                 }
            } else {
                alert("Invalid save data format. Import failed.");
                console.error("Import validation failed.");
            }
        } catch (error) {
            console.error("Error importing save data:", error);
            alert(`Failed to import save data. Error: ${error.message}`);
        }
    }

    /**
     * Returns the current state object.
     * Other systems should ideally not modify this directly, but use
     * StateManager methods or specific system methods that update the state.
     */
    getState() {
        // Return a deep copy to prevent accidental direct modification?
        // For performance in a game loop, direct reference might be okay if careful.
        // Let's start with direct reference for simplicity.
        return this.currentState;
    }

    /**
     * Updates a specific part of the state.
     * Example: updateState('energy', 100)
     * Example: updateState('structures.crystalNode.count', 5) // Needs helper for nested paths
     * Consider if more specific update methods are better.
     */
    updateStateValue(key, value) {
        if (this.currentState && typeof key === 'string') {
            // Basic direct update (doesn't handle nested keys easily)
            // A more robust solution might use lodash's _.set or a custom recursive function
            if (key in this.currentState) {
                 this.currentState[key] = value;
                 // Maybe trigger an auto-save or mark state as dirty?
            } else {
                 console.warn(`Attempted to update non-existent state key: ${key}`);
            }

        }
    }


    // --- Private Helper Methods ---

    /**
     * Sets the currentState to the default defined in Constants.js.
     * Creates a deep copy to avoid modifying the original constant.
     */
    initializeDefaultState() {
        // Use structuredClone for a deep copy if available, otherwise JSON parse/stringify
        if (typeof structuredClone === 'function') {
            this.currentState = structuredClone(INITIAL_STATE);
        } else {
            this.currentState = JSON.parse(JSON.stringify(INITIAL_STATE));
        }
         console.log("Initialized state:", this.currentState);
    }

    /**
     * Validates and cleans the loaded state object.
     * Ensures all necessary keys exist and have correct types.
     * Adds missing keys with default values if the save is from an older version.
     * @param {object} loadedState - The parsed state object from storage/import.
     * @returns {object|null} The validated state object, or null if invalid.
     */
    validateAndCleanState(loadedState) {
        if (typeof loadedState !== 'object' || loadedState === null) {
            console.error("Invalid state type:", loadedState);
            return null; // Not a valid object
        }

        let cleanState = {};
        let isValid = true;

        // Iterate over the keys defined in the *default* state structure
        for (const key in INITIAL_STATE) {
            if (loadedState.hasOwnProperty(key)) {
                // Basic type check (can be more thorough)
                if (typeof loadedState[key] === typeof INITIAL_STATE[key]) {
                    // If the property is an object itself, we might need recursive validation
                    if (typeof INITIAL_STATE[key] === 'object' && INITIAL_STATE[key] !== null && !Array.isArray(INITIAL_STATE[key])) {
                       // Example recursive call (simplified): If loading structures, validate each structure object
                       // For now, just copy it over if the type matches
                       cleanState[key] = loadedState[key]; // Needs deeper validation for nested objects
                    } else {
                         cleanState[key] = loadedState[key];
                    }
                } else {
                    console.warn(`State key "${key}" has incorrect type (${typeof loadedState[key]}), expected (${typeof INITIAL_STATE[key]}). Using default.`);
                    cleanState[key] = INITIAL_STATE[key]; // Use default value
                }
            } else {
                // Key missing in loaded state, add it from default (handles new features in updates)
                console.warn(`State key "${key}" missing in loaded data. Adding default value.`);
                cleanState[key] = INITIAL_STATE[key];
            }
        }

         // Add extra checks if needed (e.g., range checks for numbers)

        // Example check: Ensure energy is not negative
        if (typeof cleanState.voidEnergy === 'number' && cleanState.voidEnergy < 0) {
             console.warn("Loaded voidEnergy was negative, resetting to 0.");
             cleanState.voidEnergy = 0;
        }


        // If major validation fails, could return null
        // if (!isValid) return null;

        return cleanState;
    }
}

export default StateManager;