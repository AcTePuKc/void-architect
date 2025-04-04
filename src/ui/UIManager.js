import { TUNING } from '../core/Constants.js';
import { getStructureData } from '../data/structures.js';
import { UPGRADE_DATA } from '../data/upgrades.js';

class UIManager {
    constructor(game) {
        this.game = game;
        this.domElements = game.domElements;

        this.lastUIUpdateTime = 0;

        this.numberFormatter = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 1,
        });

        console.log("UIManager Initialized.");
    }

    /**
     * Updates all UI elements based on the game state.
     * @param {number} timestamp - current time from performance.now()
     */
    update(timestamp) {
        if (timestamp - this.lastUIUpdateTime < TUNING.UI_UPDATE_INTERVAL) return;
        this.lastUIUpdateTime = timestamp;

        const resources = this.game.resourceManager;
        const clicker = this.game.clickerSystem;
        const structures = this.game.structureSystem;
        const upgrades = this.game.upgradeSystem;

        // --- Resource Displays ---
        if (resources) {
            this.updateTextContent(this.domElements.energyDisplay, resources.getVoidEnergy());
            this.updateTextContent(this.domElements.epsDisplay, resources.getEPS());
        } else {
            this.updateTextContent(this.domElements.energyDisplay, '...');
            this.updateTextContent(this.domElements.epsDisplay, '...');
        }

        // --- Core Heat ---
        if (clicker) {
            const heatPercent = (clicker.getCurrentHeat() / TUNING.MAX_CLICK_HEAT) * 100;
            this.updateTextContent(this.domElements.heatDisplay, heatPercent.toFixed(0));
            if (this.domElements.heatBar) {
                this.domElements.heatBar.style.width = `${Math.min(100, heatPercent)}%`;
            }
            if (this.domElements.voidCore) {
                if (clicker.isCurrentlyOverheated()) {
                    this.domElements.voidCore.classList.add('overheated');
                    this.domElements.voidCore.classList.remove('clickable');
                } else {
                    this.domElements.voidCore.classList.remove('overheated');
                    this.domElements.voidCore.classList.add('clickable');
                }
            }
        } else {
            this.updateTextContent(this.domElements.heatDisplay, '...');
            if (this.domElements.heatBar) this.domElements.heatBar.style.width = '0%';
        }

        // --- Structure & Upgrade UI ---
        if (resources && structures && upgrades) {
            // --- Crystal Node ---
            const cnCost = structures.getStructureCost('crystalNode');
            this.updateTextContent(this.domElements.crystalCostSpan, cnCost);
            if (this.domElements.buyCrystalNodeButton) {
                this.domElements.buyCrystalNodeButton.disabled = !resources.canAfford(cnCost);
            }

            // --- Flux Shard ---
            const fsData = getStructureData('fluxShard');
            if (fsData && this.domElements.buyFluxShardButton) {
                const fsCost = structures.getStructureCost('fluxShard');
                const fsCount = structures.getStructureCount('fluxShard');
                this.updateTextContent(this.domElements.fluxShardCostSpan, fsCost);
                this.updateTextContent(this.domElements.fluxShardEffectSpan, (fsData.baseOutput * 100).toFixed(0));
                this.updateTextContent(this.domElements.fluxShardCountSpan, fsCount);
                this.domElements.buyFluxShardButton.disabled = !resources.canAfford(fsCost);
            }

            // --- Gravity Well ---
            const gwData = getStructureData('gravityWell');
            if (gwData && this.domElements.buyGravityWellButton) {
                const gwCost = structures.getStructureCost('gravityWell');
                const gwCount = structures.getStructureCount('gravityWell');
                const totalCPS = structures.getAutoClicksPerSecond();

                this.updateTextContent(this.domElements.gravityWellCostSpan, gwCost);
                this.updateTextContent(this.domElements.gravityWellEffectSpan, gwData.baseOutput);
                this.updateTextContent(this.domElements.gravityWellCountSpan, gwCount);
                this.updateTextContent(this.domElements.totalCpsDisplay, totalCPS.toFixed(1));

                this.domElements.buyGravityWellButton.disabled = !resources.canAfford(gwCost);
            }

            // --- Click Power Upgrade ---
            const cpUpgradeData = UPGRADE_DATA['clickPower_1'];
            if (cpUpgradeData && this.domElements.upgradeClickPowerButton) {
                const cpCost = upgrades.getUpgradeCost('clickPower_1');
                const cpBonus = upgrades.getTotalBonus('clickPowerMultiplier') * 100;
                const isMax = upgrades.isUpgradeMaxLevel('clickPower_1');

                this.updateTextContent(this.domElements.upgradeClickPowerCostSpan, isMax ? 'MAX' : cpCost);
                this.updateTextContent(this.domElements.clickPowerBonusSpan, cpBonus.toFixed(0));

                this.domElements.upgradeClickPowerButton.disabled = isMax || !resources.canAfford(cpCost);

                if (isMax) {
                    this.domElements.upgradeClickPowerButton.textContent = `${cpUpgradeData.name} (Max Level)`;
                } else {
                    this.domElements.upgradeClickPowerButton.innerHTML =
                        `Increase Click Power +${cpUpgradeData.effects[0].value * 100}% (Cost: <span id="upgrade-click-power-cost">${cpCost}</span>)`;
                }
            }
        } else {
            // Disable buttons if systems aren't ready
            if (this.domElements.buyCrystalNodeButton) this.domElements.buyCrystalNodeButton.disabled = true;
            if (this.domElements.buyFluxShardButton) this.domElements.buyFluxShardButton.disabled = true;
            if (this.domElements.upgradeClickPowerButton) this.domElements.upgradeClickPowerButton.disabled = true;
            if (this.domElements.buyGravityWellButton) this.domElements.buyGravityWellButton.disabled = true;

            this.updateTextContent(this.domElements.crystalCostSpan, '...');
            this.updateTextContent(this.domElements.fluxShardCostSpan, '...');
            this.updateTextContent(this.domElements.upgradeClickPowerCostSpan, '...');
            this.updateTextContent(this.domElements.gravityWellCostSpan, '...');
            this.updateTextContent(this.domElements.totalCpsDisplay, '...');
        }
    }

    /**
     * Safely update a DOM element's text content.
     */
    updateTextContent(element, value, formatNumber = true) {
        if (!element) return;

        let displayValue = value;
        if (typeof value === 'number' && formatNumber) {
            displayValue = this.numberFormatter.format(value);
        } else {
            displayValue = String(value);
        }

        if (element.textContent !== displayValue) {
            element.textContent = displayValue;
        }
    }

    /**
     * Shows a floating message near the bottom center of the screen.
     */
    showTemporaryMessage(message, durationMs = 2000) {
        console.log(`UI Message: ${message}`);

        let messageElement = document.getElementById('status-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'status-message';
            messageElement.style.position = 'fixed';
            messageElement.style.bottom = '20px';
            messageElement.style.left = '50%';
            messageElement.style.transform = 'translateX(-50%)';
            messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            messageElement.style.color = 'white';
            messageElement.style.padding = '10px 20px';
            messageElement.style.borderRadius = '5px';
            messageElement.style.zIndex = '1000';
            messageElement.style.opacity = '0';
            messageElement.style.transition = 'opacity 0.5s ease-in-out';
            document.body.appendChild(messageElement);
        }

        messageElement.textContent = message;
        messageElement.style.opacity = '1';

        if (messageElement.timeoutId) {
            clearTimeout(messageElement.timeoutId);
        }

        messageElement.timeoutId = setTimeout(() => {
            messageElement.style.opacity = '0';
        }, durationMs);
    }
}

export default UIManager;
