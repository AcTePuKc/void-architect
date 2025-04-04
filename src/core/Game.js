// Import necessary components
import StateManager from './StateManager.js';
import ResourceManager from '../gameplay/ResourceManager.js';
import UIManager from '../ui/UIManager.js';
import Loop from './Loop.js';
import { AUTOSAVE_INTERVAL } from './Constants.js';

// --- Import initialized systems ---
import ClickerSystem from '../gameplay/ClickerSystem.js';
import StructureSystem from '../gameplay/StructureSystem.js';
import UpgradeSystem from '../gameplay/UpgradeSystem.js';

class Game {
    constructor() {
        console.log("Game constructor called.");

        this.loop = null;
        this.stateManager = null;
        this.resourceManager = null;
        this.uiManager = null;
        this.clickerSystem = null;
        this.structureSystem = null;
        this.upgradeSystem = null;

        this.isRunning = false;
        this.lastUpdateTime = 0;
        this.lastAutosaveTime = 0;

        this.domElements = {};
    }

    init() {
        console.log("Initializing Game...");

        this.cacheDomElements();

        // 1. Load game state
        this.stateManager = new StateManager(this);
        this.stateManager.loadGame();
        const loadedState = this.stateManager.getState();

        // 2. Init core systems
        this.resourceManager = new ResourceManager(loadedState);
        this.structureSystem = new StructureSystem(this, loadedState);
        this.upgradeSystem = new UpgradeSystem(this, loadedState);
        this.clickerSystem = new ClickerSystem(this, loadedState);

        // 3. UI system
        this.uiManager = new UIManager(this);
        this.uiManager.update(performance.now());

        // 4. Event listeners
        this.setupEventListeners();

        // 5. Game loop
        this.loop = new Loop(this);

        console.log("Game Initialized.");
    }

    cacheDomElements() {
        this.domElements.voidCore = document.getElementById('void-core');
        this.domElements.energyDisplay = document.getElementById('energy-display');
        this.domElements.epsDisplay = document.getElementById('eps-display');
        this.domElements.heatDisplay = document.getElementById('heat-display');
        this.domElements.heatBar = document.getElementById('heat-bar');
        this.domElements.buyCrystalNodeButton = document.getElementById('buy-crystal-node');
        this.domElements.crystalCostSpan = document.getElementById('crystal-cost');
        this.domElements.gameContainer = document.getElementById('game-container');
        this.domElements.saveButton = document.getElementById('save-button');
        this.domElements.loadButton = document.getElementById('load-button');
        this.domElements.exportButton = document.getElementById('export-button');
        this.domElements.importInput = document.getElementById('import-input');
        this.domElements.importButton = document.getElementById('import-button');
        this.domElements.resetButton = document.getElementById('reset-button');

        // <<< Flux Shard >>>
        this.domElements.buyFluxShardButton = document.getElementById('buy-flux-shard');
        this.domElements.fluxShardCostSpan = document.getElementById('flux-shard-cost');
        this.domElements.fluxShardEffectSpan = document.getElementById('flux-shard-effect');
        this.domElements.fluxShardCountSpan = document.getElementById('flux-shard-count');

        // <<< Click Power Upgrade >>>
        this.domElements.upgradeClickPowerButton = document.getElementById('upgrade-click-power');
        this.domElements.upgradeClickPowerCostSpan = document.getElementById('upgrade-click-power-cost');
        this.domElements.clickPowerBonusSpan = document.getElementById('click-power-bonus');

        // <<< Gravity Well UI Elements >>>
        this.domElements.buyGravityWellButton = document.getElementById('buy-gravity-well');
        this.domElements.gravityWellCostSpan = document.getElementById('gravity-well-cost');
        this.domElements.gravityWellEffectSpan = document.getElementById('gravity-well-effect');
        this.domElements.gravityWellCountSpan = document.getElementById('gravity-well-count');
        this.domElements.totalCpsDisplay = document.getElementById('total-cps-display');

        if (!this.domElements.voidCore) console.error("Essential DOM element #void-core not found!");
        if (!this.domElements.saveButton) console.error("Save/Load buttons not found!");
    }

    setupEventListeners() {
        console.log("Setting up event listeners...");

        if (this.domElements.voidCore) {
            this.domElements.voidCore.addEventListener('click', () => {
                if (this.clickerSystem) {
                    this.clickerSystem.handleCoreClick();
                } else if (this.resourceManager) {
                    this.resourceManager.addVoidEnergy(1); // Fallback
                }
            });
        }

        // --- Structure Purchases ---
        if (this.domElements.buyCrystalNodeButton) {
            this.domElements.buyCrystalNodeButton.addEventListener('click', () => {
                this.structureSystem?.attemptPurchase('crystalNode');
            });
        }

        if (this.domElements.buyFluxShardButton) {
            this.domElements.buyFluxShardButton.addEventListener('click', () => {
                this.structureSystem?.attemptPurchase('fluxShard');
            });
        }

        // <<< Gravity Well Purchase >>>
        if (this.domElements.buyGravityWellButton) {
            this.domElements.buyGravityWellButton.addEventListener('click', () => {
                this.structureSystem?.attemptPurchase('gravityWell');
            });
        }

        // --- Upgrades ---
        if (this.domElements.upgradeClickPowerButton) {
            this.domElements.upgradeClickPowerButton.addEventListener('click', () => {
                this.upgradeSystem?.attemptPurchase('clickPower_1');
            });
        }

        // --- Save / Load / Reset ---
        if (this.domElements.saveButton) {
            this.domElements.saveButton.addEventListener('click', () => this.stateManager.saveGame());
        }

        if (this.domElements.loadButton) {
            this.domElements.loadButton.addEventListener('click', () => {
                if (confirm("Loading will overwrite current unsaved progress. Continue?")) {
                    this.stateManager.loadGame();
                    const newState = this.stateManager.getState();

                    this.resourceManager?.syncState(newState);
                    this.structureSystem?.syncState(newState);
                    this.upgradeSystem?.syncState(newState);
                    this.clickerSystem?.syncState(newState);
                    this.uiManager?.update(performance.now());

                    alert("Game Loaded!");
                }
            });
        }

        if (this.domElements.exportButton) {
            this.domElements.exportButton.addEventListener('click', () => this.stateManager.exportSave());
        }

        if (this.domElements.importButton) {
            this.domElements.importButton.addEventListener('click', () => {
                const importData = this.domElements.importInput.value;
                this.stateManager.importSave(importData);
            });
        }

        if (this.domElements.resetButton) {
            this.domElements.resetButton.addEventListener('click', () => this.stateManager.resetGame());
        }
    }

    start() {
        if (this.isRunning) {
            console.warn("Game loop is already running.");
            return;
        }
        if (!this.loop) {
            console.error("Loop not initialized.");
            return;
        }
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        this.lastAutosaveTime = this.lastUpdateTime;
        this.loop.start();
    }

    update(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = timestamp;

        if (this.clickerSystem) this.clickerSystem.update(deltaTime);
        if (this.structureSystem) this.structureSystem.update(deltaTime);

        if (this.stateManager) {
            const currentState = this.stateManager.getState();
            if (currentState) {
                this.resourceManager?.prepareStateForSave(currentState);
                this.clickerSystem?.prepareStateForSave(currentState);
                this.structureSystem?.prepareStateForSave(currentState);
                this.upgradeSystem?.prepareStateForSave(currentState);
                currentState.lastSaveTime = Date.now();
            }
        }

        if (timestamp - this.lastAutosaveTime > AUTOSAVE_INTERVAL) {
            this.stateManager.saveGame();
            this.lastAutosaveTime = timestamp;
        }

        if (this.uiManager) {
            this.uiManager.update(timestamp);
        }
    }

    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.loop?.stop();
        console.log("Game loop stopped.");
    }

    // --- Helpers ---
    getManager(managerName) {
        switch (managerName) {
            case 'ui': return this.uiManager;
            case 'resources': return this.resourceManager;
            case 'state': return this.stateManager;
            default: console.warn(`Manager "${managerName}" not found.`); return null;
        }
    }

    getSystem(systemName) {
        switch (systemName) {
            case 'clicker': return this.clickerSystem;
            case 'structures': return this.structureSystem;
            case 'upgrades': return this.upgradeSystem;
            default: console.warn(`System "${systemName}" not found.`); return null;
        }
    }

    getElement(elementName) {
        return this.domElements[elementName] || null;
    }
}

export default Game;
