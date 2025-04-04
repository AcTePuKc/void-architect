import { INITIAL_STATE } from '../core/Constants.js';
import { STRUCTURE_DATA, getStructureData } from '../data/structures.js';

class StructureSystem {
    constructor(game, initialState) {
        this.game = game;
        this.resourceManager = game.resourceManager;
        this.stateManager = game.stateManager; // Need state manager to update counts

        // Store the counts of each structure owned by the player
        // Initialize from loaded state or default
        this.structureCounts = {};
        this.initializeCounts(initialState);

        // Store references to structure DOM elements if visualizing
        this.structureElements = {}; // e.g., { crystalNode: [element1, element2,...] }

        // Cache for multiplier effect (e.g., Flux Shard)
        this.cachedClickMultiplier = 1; // Start at 1 (no bonus)

        // <<< ADD CACHE FOR AUTO-CLICKS PER SECOND (CPS) >>>
        this.cachedAutoCPS = 0; // Used by Gravity Well-type structures

        console.log("StructureSystem Initialized. Counts:", this.structureCounts);
        this.recalculateAllOutputs(); // Initial calculation
    }

    /**
     * Initializes the structure counts based on loaded state or defaults.
     */
    initializeCounts(initialState) {
        const savedCounts = initialState?.structures ?? {};
        for (const id in STRUCTURE_DATA) {
            const defaultCount = INITIAL_STATE.structures[id]?.count ?? 0;
            this.structureCounts[id] = savedCounts[id]?.count ?? defaultCount;
            // TODO: Add logic to create initial visual elements if loading a save
        }
    }

    /**
     * Calculates the current purchase cost for a specific structure type.
     * Formula: baseCost * (scalingFactor ^ currentCount)
     * @param {string} structureId - The ID of the structure.
     * @returns {number} The current cost. Returns Infinity if ID is invalid.
     */
    getStructureCost(structureId) {
        const data = getStructureData(structureId);
        if (!data) {
            console.warn(`getStructureCost: Invalid structureId "${structureId}"`);
            return Infinity;
        }
        const count = this.structureCounts[structureId] ?? 0;
        return Math.floor(data.baseCost * Math.pow(data.costScalingFactor, count));
    }

    /**
     * Attempts to purchase one unit of the specified structure.
     * Checks cost, spends resources, updates count, recalculates EPS, adds visual.
     * @param {string} structureId - The ID of the structure to buy.
     */
    attemptPurchase(structureId) {
        const data = getStructureData(structureId);
        if (!data) {
            console.warn(`attemptPurchase: Invalid structureId "${structureId}"`);
            return;
        }

        const cost = this.getStructureCost(structureId);

        if (this.resourceManager.canAfford(cost)) {
            if (this.resourceManager.spendVoidEnergy(cost)) {
                // Success! Increment count
                this.structureCounts[structureId]++;
                console.log(`Purchased ${data.name}. Total owned: ${this.structureCounts[structureId]}. Cost: ${cost}`);

                // --- Update things affected by the purchase ---
                this.recalculateAllOutputs(); // Recalculate EPS, Click Multiplier, AutoCPS
                this.addStructureVisual(structureId);

                // Update clicker multiplier if applicable
                if (data.outputType === 'clickMultiplier' && this.game.clickerSystem) {
                    this.game.clickerSystem.recalculateMultipliers();
                }

            } else {
                console.error("Purchase failed unexpectedly after affordability check.");
            }
        } else {
            console.log(`Cannot afford ${data.name}. Need ${cost}, have ${this.resourceManager.getVoidEnergy().toFixed(0)}`);
        }
    }

    /**
     * Recalculates all outputs (EPS, click multiplier, auto-CPS) from structures.
     */
    recalculateAllOutputs() {
        let totalEPS = 0;
        let totalClickMultiplierBonus = 0;
        let totalAutoCPS = 0;

        for (const id in this.structureCounts) {
            const data = getStructureData(id);
            const count = this.structureCounts[id];
            if (!data || count <= 0) continue;

            if (data.outputType === 'voidEnergy') {
                totalEPS += (data.baseOutput * count);
            }

            if (data.outputType === 'clickMultiplier') {
                totalClickMultiplierBonus += (data.baseOutput * count);
            }

            // <<< Handle Auto-Clicker structures like Gravity Wells >>>
            if (data.outputType === 'autoClick') {
                totalAutoCPS += (data.baseOutput * count);
            }
        }

        this.resourceManager.updateEPS(totalEPS);
        this.cachedClickMultiplier = 1 + totalClickMultiplierBonus;
        this.cachedAutoCPS = totalAutoCPS;
    }

    /**
     * Applies passive income based on EPS.
     * Called every game tick (deltaTime = seconds since last frame).
     */
    update(deltaTime) {
        const passiveGain = this.resourceManager.getEPS() * deltaTime;
        if (passiveGain > 0) {
            this.resourceManager.addVoidEnergy(passiveGain);
        }

        // <<< Handle Auto-Clickers (Gravity Wells, etc.) >>>
        // Actual click logic should be triggered elsewhere, but here's where it could plug in.
    }

    /**
     * Gets the current count of a specific structure.
     * @param {string} structureId
     * @returns {number}
     */
    getStructureCount(structureId) {
        return this.structureCounts[structureId] ?? 0;
    }

    /**
     * Gets the total click power multiplier derived *only* from structures.
     * @returns {number} Multiplier (e.g., 1.0 = base, 1.1 = +10%)
     */
    getStructureClickMultiplier() {
        return this.cachedClickMultiplier;
    }

    /**
     * Gets the total number of automatic clicks per second from all relevant structures.
     * @returns {number} Clicks per second.
     */
    getAutoClicksPerSecond() {
        return this.cachedAutoCPS;
    }

    // --- Visualization (Basic Example) ---

    /**
     * Adds a simple visual element for a purchased structure.
     * @param {string} structureId
     */
    addStructureVisual(structureId) {
        const data = getStructureData(structureId);
        if (!data) return;

        const container = this.game.getElement('game-container');
        if (!container) return;

        const element = document.createElement('div');
        element.classList.add('structure');
        element.classList.add(structureId);
        element.title = `${data.name} #${this.structureCounts[structureId]}`;

        const count = this.structureCounts[structureId];
        const angle = (count * 30) % 360;
        const radius = 100 + Math.floor(count / 6) * 30;
        const x = Math.cos(angle * Math.PI / 180) * radius + container.offsetWidth / 2 - 15;
        const y = Math.sin(angle * Math.PI / 180) * radius + container.offsetHeight / 2 - 15;

        element.style.left = `${x}px`;
        element.style.top = `${y}px`;

        container.appendChild(element);

        if (!this.structureElements[structureId]) {
            this.structureElements[structureId] = [];
        }
        this.structureElements[structureId].push(element);
    }

    /** Removes all structure visuals (e.g., before loading a save) */
    clearStructureVisuals() {
        for (const id in this.structureElements) {
            this.structureElements[id].forEach(el => el.remove());
        }
        this.structureElements = {};
    }

    /** Recreates visuals based on current counts (e.g., after loading) */
    recreateAllVisuals() {
        this.clearStructureVisuals();
        for (const id in this.structureCounts) {
            const count = this.structureCounts[id];
            for (let i = 0; i < count; i++) {
                this.addStructureVisual(id);
            }
        }
    }

    // --- State Synchronization ---

    syncState(state) {
        console.log("StructureSystem syncing state:", state);
        this.initializeCounts(state);
        this.recalculateAllOutputs(); // <<< Ensures AutoCPS is up to date
        this.recreateAllVisuals();
        console.log(`StructureSystem state synced. Counts:`, this.structureCounts);
    }

    prepareStateForSave(stateObject) {
        if (!stateObject.structures) {
            stateObject.structures = {};
        }
        for (const id in this.structureCounts) {
            if (!stateObject.structures[id]) {
                stateObject.structures[id] = {};
            }
            stateObject.structures[id].count = this.structureCounts[id];
        }
    }

    /** Reset structures for prestige */
    resetForPrestige() {
        this.initializeCounts(INITIAL_STATE);
        this.recalculateAllOutputs(); // <<< Ensures AutoCPS resets
        this.clearStructureVisuals();
        console.log("StructureSystem reset for prestige.");
    }

    /** Reset structures for full reset */
    resetForAll() {
        this.initializeCounts(INITIAL_STATE);
        this.recalculateAllOutputs(); // <<< Ensures AutoCPS resets
        this.clearStructureVisuals();
        console.log("StructureSystem fully reset.");
    }
}

export default StructureSystem;
