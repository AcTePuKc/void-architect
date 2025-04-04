import { INITIAL_STATE } from '../core/Constants.js';
import { UPGRADE_DATA } from '../data/upgrades.js'; // Assuming UPGRADE_DATA has correct structure

class UpgradeSystem {
    constructor(game, initialState) {
        this.game = game;
        this.resourceManager = game.resourceManager;
        this.stateManager = game.stateManager;

        // Store the level/purchased status of each upgrade
        // Example: { clickPower_1: 1, anotherUpgrade: 0 } (level 0 means not bought)
        this.upgradeLevels = {};
        this.initializeLevels(initialState);

        console.log("UpgradeSystem Initialized. Levels:", this.upgradeLevels);
    }

    /**
     * Initializes upgrade levels from loaded state or defaults (level 0).
     */
    initializeLevels(initialState) {
        const savedUpgrades = initialState?.upgrades ?? {}; // Use 'upgrades' key from state
        for (const id in UPGRADE_DATA) {
            // Get level from saved state (represented by true/false or level number)
            // We'll use level numbers (0 = not bought, 1 = bought once, etc.)
            const savedLevel = savedUpgrades[id] ?? 0; // Default to 0 if not found
            this.upgradeLevels[id] = savedLevel;
        }
         // If state used true/false, convert:
         // e.g. if (savedUpgrades[id] === true) this.upgradeLevels[id] = 1;
    }

    /**
     * Calculates the current cost for a specific upgrade.
     * Handles potential level scaling.
     * @param {string} upgradeId
     * @returns {number} The cost for the *next* level. Returns Infinity if max level reached or invalid ID.
     */
    getUpgradeCost(upgradeId) {
        const data = UPGRADE_DATA[upgradeId];
        if (!data) {
            console.warn(`getUpgradeCost: Invalid upgradeId "${upgradeId}"`);
            return Infinity;
        }

        const currentLevel = this.upgradeLevels[upgradeId] ?? 0;

        if (data.maxLevel && currentLevel >= data.maxLevel) {
            return Infinity; // Max level reached
        }

        // Calculate cost for the *next* level (currentLevel + 1)
        // Simple scaling for now: cost * (scaling ^ currentLevel)
        // Use Math.floor or Math.ceil as desired
        const cost = Math.floor(data.cost * Math.pow(data.costScaling ?? 1, currentLevel)); // Default scaling to 1 if not defined
        return cost;
    }

    /**
     * Checks if an upgrade has been purchased to its maximum level.
     * @param {string} upgradeId
     * @returns {boolean}
     */
    isUpgradeMaxLevel(upgradeId) {
        const data = UPGRADE_DATA[upgradeId];
        if (!data || !data.maxLevel) return false; // No max level defined

        const currentLevel = this.upgradeLevels[upgradeId] ?? 0;
        return currentLevel >= data.maxLevel;
    }


    /**
     * Attempts to purchase the next level of an upgrade.
     * @param {string} upgradeId
     */
    attemptPurchase(upgradeId) {
        const data = UPGRADE_DATA[upgradeId];
        if (!data) {
            console.warn(`attemptPurchase: Invalid upgradeId "${upgradeId}"`);
            return;
        }

        if (this.isUpgradeMaxLevel(upgradeId)) {
            console.log(`Upgrade "${upgradeId}" is already at max level.`);
            return;
        }

        const cost = this.getUpgradeCost(upgradeId);

        if (this.resourceManager.canAfford(cost)) {
            if (this.resourceManager.spendVoidEnergy(cost)) {
                // Success! Increment level
                this.upgradeLevels[upgradeId] = (this.upgradeLevels[upgradeId] ?? 0) + 1;
                console.log(`Purchased Upgrade: ${data.name} (Level ${this.upgradeLevels[upgradeId]}). Cost: ${cost}`);

                // --- Trigger recalculations if needed ---
                // Example: If it affects click power, tell ClickerSystem to update its multiplier cache
                 if (this.game.clickerSystem) {
                    this.game.clickerSystem.recalculateMultipliers();
                 }
                // Example: If it affects structure output, tell StructureSystem
                 if (this.game.structureSystem && data.effects.some(e => e.type.includes('Structure'))) {
                    this.game.structureSystem.recalculateTotalEPS(); // Or a more specific update
                 }


            } else {
                console.error("Upgrade purchase failed unexpectedly after affordability check.");
            }
        } else {
            console.log(`Cannot afford Upgrade: ${data.name}. Need ${cost}, have ${this.resourceManager.getVoidEnergy().toFixed(0)}`);
        }
    }

    /**
     * Calculates the total bonus value from all purchased levels of upgrades
     * that provide a specific effect type.
     * @param {string} effectType - e.g., 'clickPowerMultiplier'
     * @returns {number} The total additive or multiplicative bonus (depends on how effects stack).
     */
    getTotalBonus(effectType) {
        let totalBonus = 0; // Start with 0 for additive bonuses
        // let totalMultiplier = 1; // Start with 1 for multiplicative bonuses

        for (const id in this.upgradeLevels) {
            const level = this.upgradeLevels[id];
            if (level > 0) {
                const data = UPGRADE_DATA[id];
                if (data && data.effects) {
                    data.effects.forEach(effect => {
                        if (effect.type === effectType) {
                            // Assuming simple additive stacking per level for now
                            totalBonus += (effect.value * level);
                            // For multiplicative: totalMultiplier *= Math.pow(1 + effect.value, level); // If effect.value is like 0.1 for +10%
                        }
                    });
                }
            }
        }
        return totalBonus;
        // return totalMultiplier; // if using multiplicative
    }

    /**
     * Gets the current level of an upgrade.
     * @param {string} upgradeId
     * @returns {number} Level (0 if not purchased).
     */
    getUpgradeLevel(upgradeId) {
        return this.upgradeLevels[upgradeId] ?? 0;
    }


    // --- State Synchronization ---

    syncState(state) {
        console.log("UpgradeSystem syncing state:", state);
        this.initializeLevels(state); // Re-initialize levels
        // Potentially trigger recalculations in other systems if needed after load
         if (this.game.clickerSystem) this.game.clickerSystem.recalculateMultipliers();
         if (this.game.structureSystem) this.game.structureSystem.recalculateTotalEPS();
        console.log(`UpgradeSystem state synced. Levels:`, this.upgradeLevels);
    }

    prepareStateForSave(stateObject) {
        // Save the upgrade levels directly into the 'upgrades' property of the state
        stateObject.upgrades = { ...this.upgradeLevels }; // Save a copy
    }

    resetForPrestige() {
        // Decide if upgrades reset on prestige. Based on your design, they might not,
        // or specific "meta" upgrades might persist.
        // If they *do* reset:
        // this.initializeLevels(INITIAL_STATE);
        // console.log("UpgradeSystem reset for prestige.");

        // If they DON'T reset, do nothing here for prestige.
         console.log("UpgradeSystem state preserved during prestige.");
    }

    resetForAll() {
        this.initializeLevels(INITIAL_STATE); // Reset to level 0
         if (this.game.clickerSystem) this.game.clickerSystem.recalculateMultipliers();
         if (this.game.structureSystem) this.game.structureSystem.recalculateTotalEPS();
        console.log("UpgradeSystem fully reset.");
    }
}

export default UpgradeSystem;