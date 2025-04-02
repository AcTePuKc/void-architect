/**
 * Game-wide constants
 */

// Key used for saving/loading data in localStorage
export const SAVE_KEY = 'voidArchitectSaveData';

// Initial game state structure - used for new games and validation
export const INITIAL_STATE = Object.freeze({
    // Resources
    voidEnergy: 0,
    echoes: 0,
    transcendencePoints: 0,

    // Run-specific stats (reset on Prestige)
    totalVoidEnergyGeneratedThisPrestige: 0,
    // currentPrestigeCount: 0, // Add later when prestige is implemented

    // Clicker System State
    clickHeat: 0, // Current heat level (e.g., 0-100)
    isCoreOverheated: false,
    clickEfficiency: 1.0, // Multiplier (1.0 = 100%, down to 0.25 = 25%)

    // Structures State (example structure - will be expanded)
    // We store counts and potentially levels or other properties per structure type
    structures: {
        crystalNode: {
            count: 0,
            // level: 1, // If structures have levels later
        },
        fluxShard: {
            count: 0,
        },
        gravityWell: {
            count: 0,
        }
        // ... other structure types
    },

    // Upgrade State (store which upgrades have been purchased)
    upgrades: {
        // Example: 'clickPower_1': true if purchased
        // We'll define specific upgrade IDs later in data/upgrades.js
    },

    // Skill State (placeholder - e.g., unlocked, level)
    skills: {
        // surgeClick: { unlocked: false, level: 0 },
    },

    // Prestige / Transcendence State (placeholders)
    // unlockedFeatures: [], // e.g., ['skills', 'prestige']
    // activeMutators: [],
    // selectedVoidform: null,

    // Timestamps / Settings (optional)
    lastSaveTime: null,
    // playTimeSeconds: 0,

    // Versioning for save data migration
    saveVersion: 1,
});

// --- Gameplay Tuning Constants ---

// Clicker Mechanics
export const BASE_CLICK_ENERGY = 1; // Energy gained per click before upgrades/efficiency
export const MAX_CLICK_HEAT = 100; // Max heat before cooldown
export const HEAT_PER_CLICK = 5; // Heat added per click
export const HEAT_DECAY_RATE = 15; // Heat points decayed per second when not clicking/overheated
export const OVERHEAT_COOLDOWN_SECONDS = 3.0; // Duration core is disabled when overheated
export const CLICK_EFFICIENCY_DECAY_RATE = 0.05; // How much efficiency drops per rapid click (e.g., 5%)
export const CLICK_EFFICIENCY_RECOVERY_RATE = 0.25; // How much efficiency recovers per second of idle (e.g., 25%)
export const MIN_CLICK_EFFICIENCY = 0.25; // Minimum efficiency multiplier

// Structure Costs & Base Output (Initial values - can be moved to data/structures.js later)
export const CRYSTAL_NODE_BASE_COST = 10;
export const CRYSTAL_NODE_COST_SCALING = 1.15; // Cost multiplier per node owned
export const CRYSTAL_NODE_BASE_EPS = 0.1; // Base Energy Per Second per node

// UI Update Rate (milliseconds) - How often the UI refreshes
export const UI_UPDATE_INTERVAL = 100; // 10 times per second

// Autosave Interval (milliseconds)
export const AUTOSAVE_INTERVAL = 30000; // Every 30 seconds


// Make the tuning constants easily accessible
export const TUNING = Object.freeze({
    BASE_CLICK_ENERGY,
    MAX_CLICK_HEAT,
    HEAT_PER_CLICK,
    HEAT_DECAY_RATE,
    OVERHEAT_COOLDOWN_SECONDS,
    CLICK_EFFICIENCY_DECAY_RATE,
    CLICK_EFFICIENCY_RECOVERY_RATE,
    MIN_CLICK_EFFICIENCY,
    CRYSTAL_NODE_BASE_COST,
    CRYSTAL_NODE_COST_SCALING,
    CRYSTAL_NODE_BASE_EPS,
    UI_UPDATE_INTERVAL,
    AUTOSAVE_INTERVAL,
});