import { TUNING, INITIAL_STATE } from '../core/Constants.js';

class ClickerSystem {
    constructor(game, initialState) {
        this.game = game;
        this.resourceManager = game.resourceManager;

        // <<< Get references to other systems needed for multipliers >>>
        this.structureSystem = game.structureSystem;
        this.upgradeSystem = game.upgradeSystem;

        // --- Initialize State ---
        this.currentHeat = initialState?.clickHeat ?? INITIAL_STATE.clickHeat;
        this.isOverheated = initialState?.isCoreOverheated ?? INITIAL_STATE.isCoreOverheated;
        this.clickEfficiency = initialState?.clickEfficiency ?? INITIAL_STATE.clickEfficiency;

        this.overheatTimer = this.isOverheated ? TUNING.OVERHEAT_COOLDOWN_SECONDS : 0;
        this.timeSinceLastClick = 0;

        // <<< ADD TRACKER FOR AUTO-CLICK PROGRESS >>>
        this.autoClickProgress = 0; // Accumulates fractional clicks from Gravity Wells

        // <<< ADD CACHE FOR TOTAL CLICK MULTIPLIER >>>
        this.totalClickMultiplier = 1;
        this.recalculateMultipliers();

        console.log(`ClickerSystem Initialized. Heat: ${this.currentHeat}, Overheated: ${this.isOverheated}, Efficiency: ${this.clickEfficiency}, Multiplier: ${this.totalClickMultiplier}`);
    }

    /**
     * Recalculates and caches the total click power multiplier from all sources.
     */
    recalculateMultipliers() {
        let baseMultiplier = 1.0;

        const upgradeBonus = this.upgradeSystem ? this.upgradeSystem.getTotalBonus('clickPowerMultiplier') : 0;
        baseMultiplier += upgradeBonus;

        const structureMultiplier = this.structureSystem ? this.structureSystem.getStructureClickMultiplier() : 1;
        baseMultiplier *= structureMultiplier;

        this.totalClickMultiplier = Math.max(0, baseMultiplier);
    }

    /**
     * Handles a manual click on the Void Core.
     */
    handleCoreClick() {
        if (this.isCurrentlyOverheated()) {
            console.log("Click ignored: Core overheated.");
            return;
        }

        const baseEnergy = TUNING.BASE_CLICK_ENERGY;
        const energyGained = baseEnergy * this.totalClickMultiplier * this.clickEfficiency;

        this.resourceManager.addVoidEnergy(energyGained);
        this.currentHeat += TUNING.HEAT_PER_CLICK;

        this.clickEfficiency -= TUNING.CLICK_EFFICIENCY_DECAY_RATE;
        if (this.clickEfficiency < TUNING.MIN_CLICK_EFFICIENCY) {
            this.clickEfficiency = TUNING.MIN_CLICK_EFFICIENCY;
        }

        this.timeSinceLastClick = 0;

        if (this.currentHeat >= TUNING.MAX_CLICK_HEAT) {
            this.enterOverheatState();
        }
    }

    /**
     * Called every game tick to update heat, efficiency, and auto-click logic.
     * @param {number} deltaTime - Time since last frame in seconds.
     */
    update(deltaTime) {
        // --- Overheat Cooldown ---
        if (this.isCurrentlyOverheated()) {
            this.overheatTimer -= deltaTime;
            if (this.overheatTimer <= 0) {
                this.exitOverheatState();
            }
            return; // Skip other logic while overheated
        }

        // --- Heat Decay ---
        if (this.currentHeat > 0) {
            const decay = TUNING.HEAT_DECAY_RATE * deltaTime;
            this.currentHeat = Math.max(0, this.currentHeat - decay);
        }

        // --- Click Efficiency Recovery ---
        this.timeSinceLastClick += deltaTime;
        const recoveryDelay = 0.1;
        if (this.timeSinceLastClick > recoveryDelay && this.clickEfficiency < 1.0) {
            this.clickEfficiency = Math.min(1.0, this.clickEfficiency + TUNING.CLICK_EFFICIENCY_RECOVERY_RATE * deltaTime);
        }

        // --- <<< AUTO CLICK LOGIC >>> ---
        if (this.structureSystem) {
            const autoCPS = this.structureSystem.getAutoClicksPerSecond();
            if (autoCPS > 0) {
                this.autoClickProgress += autoCPS * deltaTime;

                const clicksToPerform = Math.floor(this.autoClickProgress);
                if (clicksToPerform > 0) {
                    this.performAutoClicks(clicksToPerform);
                    this.autoClickProgress -= clicksToPerform;
                }
            }
        }
    }

    /**
     * Performs a specified number of automatic clicks.
     * @param {number} numberOfClicks - How many auto-clicks to perform.
     */
    performAutoClicks(numberOfClicks) {
        if (numberOfClicks <= 0) return;

        const baseEnergy = TUNING.BASE_CLICK_ENERGY;
        const energyPerClick = baseEnergy * this.totalClickMultiplier;
        const totalEnergy = energyPerClick * numberOfClicks;

        this.resourceManager.addVoidEnergy(totalEnergy);

        // Auto-clicks currently:
        // - DO NOT generate heat
        // - DO NOT affect efficiency
        // - DO benefit from multipliers
    }

    /**
     * Initiates the overheat state.
     */
    enterOverheatState() {
        console.log("Core Overheated!");
        this.isOverheated = true;
        this.overheatTimer = TUNING.OVERHEAT_COOLDOWN_SECONDS;
        this.currentHeat = TUNING.MAX_CLICK_HEAT;
    }

    /**
     * Ends the overheat state.
     */
    exitOverheatState() {
        console.log("Core Cooled Down.");
        this.isOverheated = false;
        this.overheatTimer = 0;
        this.currentHeat = 0;
        this.timeSinceLastClick = 0;
    }

    // --- Getters for external use / UI ---
    getCurrentHeat() {
        return this.currentHeat;
    }

    isCurrentlyOverheated() {
        return this.isOverheated;
    }

    /**
     * Loads and applies state from saved data.
     */
    syncState(state) {
        console.log("ClickerSystem syncing state:", state);
        this.currentHeat = state?.clickHeat ?? INITIAL_STATE.clickHeat;
        this.isOverheated = state?.isCoreOverheated ?? INITIAL_STATE.isCoreOverheated;
        this.clickEfficiency = state?.clickEfficiency ?? INITIAL_STATE.clickEfficiency;

        this.overheatTimer = this.isOverheated ? TUNING.OVERHEAT_COOLDOWN_SECONDS : 0;
        this.timeSinceLastClick = 0;

        this.recalculateMultipliers();
    }

    /**
     * Prepares state for saving.
     */
    prepareStateForSave(stateObject) {
        stateObject.clickHeat = this.currentHeat;
        stateObject.isCoreOverheated = this.isOverheated;
        stateObject.clickEfficiency = this.clickEfficiency;
    }

    /**
     * Partial reset (e.g., prestige).
     */
    resetForPrestige() {
        this.currentHeat = INITIAL_STATE.clickHeat;
        this.isOverheated = INITIAL_STATE.isCoreOverheated;
        this.clickEfficiency = INITIAL_STATE.clickEfficiency;
        this.overheatTimer = 0;
        this.timeSinceLastClick = 0;
        this.recalculateMultipliers();
        console.log("ClickerSystem reset for prestige.");
    }

    /**
     * Full reset (e.g., new game).
     */
    resetForAll() {
        this.currentHeat = INITIAL_STATE.clickHeat;
        this.isOverheated = INITIAL_STATE.isCoreOverheated;
        this.clickEfficiency = INITIAL_STATE.clickEfficiency;
        this.overheatTimer = 0;
        this.timeSinceLastClick = 0;
        this.recalculateMultipliers();
        console.log("ClickerSystem fully reset.");
    }
}

export default ClickerSystem;
