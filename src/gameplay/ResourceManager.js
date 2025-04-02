class ResourceManager {
    constructor(initialState) {
        // Initialize resources based on the provided state
        this.voidEnergy = initialState?.voidEnergy ?? 0;
        this.echoes = initialState?.echoes ?? 0;
        this.transcendencePoints = initialState?.transcendencePoints ?? 0;

        // We might track total generated amounts for prestige calculations etc.
        this.totalVoidEnergyGeneratedThisPrestige = initialState?.totalVoidEnergyGeneratedThisPrestige ?? 0;
        // ... other tracked stats

        // Cache calculated values like EPS (Energy Per Second)
        this.currentEPS = 0;

        console.log(`ResourceManager Initialized. Energy: ${this.voidEnergy}, Echoes: ${this.echoes}`);
    }

    // --- Void Energy Management ---

    /**
     * Gets the current amount of Void Energy.
     * @returns {number}
     */
    getVoidEnergy() {
        return this.voidEnergy;
    }

    /**
     * Adds Void Energy to the current total.
     * Also updates the total generated count.
     * @param {number} amount - The amount of energy to add. Must be positive.
     */
    addVoidEnergy(amount) {
        if (amount < 0) {
            console.warn("Attempted to add negative Void Energy:", amount);
            return;
        }
        this.voidEnergy += amount;
        this.totalVoidEnergyGeneratedThisPrestige += amount;
        // Note: We don't directly update the StateManager here.
        // The Game loop or specific systems will read from ResourceManager
        // and update the state before saving.
    }

    /**
     * Checks if there is enough Void Energy for a purchase.
     * @param {number} amount - The amount needed.
     * @returns {boolean} True if affordable, false otherwise.
     */
    canAfford(amount) {
        return this.voidEnergy >= amount;
    }

    /**
     * Spends Void Energy if affordable.
     * @param {number} amount - The amount to spend. Must be positive.
     * @returns {boolean} True if the energy was spent, false otherwise.
     */
    spendVoidEnergy(amount) {
        if (amount < 0) {
            console.warn("Attempted to spend negative Void Energy:", amount);
            return false;
        }
        if (this.canAfford(amount)) {
            this.voidEnergy -= amount;
            return true;
        }
        return false;
    }

    /**
     * Updates the calculated Energy Per Second (EPS).
     * This should be called by the system that calculates passive income (e.g., StructureSystem).
     * @param {number} newEPS - The newly calculated EPS value.
     */
    updateEPS(newEPS) {
        this.currentEPS = Math.max(0, newEPS); // Ensure EPS isn't negative
    }

     /**
     * Gets the current calculated Energy Per Second.
     * @returns {number}
     */
     getEPS() {
        return this.currentEPS;
     }


    // --- Echoes Management (Prestige Currency) ---

    getEchoes() {
        return this.echoes;
    }

    addEchoes(amount) {
        if (amount < 0) return;
        this.echoes += amount;
    }

    spendEchoes(amount) {
        if (amount < 0) return false;
        if (this.echoes >= amount) {
            this.echoes -= amount;
            return true;
        }
        return false;
    }

     // --- Transcendence Points Management (Meta-Prestige Currency) ---
     // Add similar methods for TP later...


    // --- State Synchronization ---

    /**
     * Updates the internal state based on a loaded state object.
     * Called by StateManager after loading or importing.
     * @param {object} state - The loaded game state object.
     */
    syncState(state) {
         console.log("ResourceManager syncing state:", state);
         this.voidEnergy = state?.voidEnergy ?? 0;
         this.echoes = state?.echoes ?? 0;
         this.transcendencePoints = state?.transcendencePoints ?? 0;
         this.totalVoidEnergyGeneratedThisPrestige = state?.totalVoidEnergyGeneratedThisPrestige ?? 0;
         // Reset transient calculated values like EPS
         this.currentEPS = 0; // Will be recalculated by StructureSystem
         console.log(`ResourceManager state synced. Energy: ${this.voidEnergy}`);
    }


    /**
     * Prepares the resource part of the game state for saving.
     * Called by StateManager before saving.
     * @param {object} stateObject - The state object being prepared for saving.
     */
    prepareStateForSave(stateObject) {
        stateObject.voidEnergy = this.voidEnergy;
        stateObject.echoes = this.echoes;
        stateObject.transcendencePoints = this.transcendencePoints;
        stateObject.totalVoidEnergyGeneratedThisPrestige = this.totalVoidEnergyGeneratedThisPrestige;
    }

    /**
     * Resets resources for a new prestige run.
     * Keeps Echoes and TP, resets Void Energy and run-specific stats.
     */
    resetForPrestige() {
        this.voidEnergy = INITIAL_STATE.voidEnergy; // Reset to starting energy
        this.totalVoidEnergyGeneratedThisPrestige = 0;
        this.currentEPS = 0;
        // Echoes and TP are intentionally *not* reset here
        console.log("ResourceManager reset for prestige.");
    }

     /**
      * Resets all resources for a full game reset or Transcendence.
      */
     resetForAll() {
         this.voidEnergy = INITIAL_STATE.voidEnergy;
         this.echoes = INITIAL_STATE.echoes;
         this.transcendencePoints = INITIAL_STATE.transcendencePoints;
         this.totalVoidEnergyGeneratedThisPrestige = 0;
         this.currentEPS = 0;
          console.log("ResourceManager fully reset.");
     }
}

export default ResourceManager;