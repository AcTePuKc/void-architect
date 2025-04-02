import { TUNING } from '../core/Constants.js'; // For UI update interval

class UIManager {
    constructor(game) {
        this.game = game;
        this.domElements = game.domElements; // Use cached elements from Game

        this.lastUIUpdateTime = 0;

        // Formatters for displaying large numbers
        this.numberFormatter = new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 1, // Adjust as needed
            // For large numbers later, we might add notation: 'compact' or custom logic
        });

        console.log("UIManager Initialized.");
    }

    /**
     * Updates all relevant UI elements based on the current game state.
     * Should be called periodically (e.g., within the game loop or on a timer).
     * @param {number} timestamp - Current time from performance.now()
     */
    update(timestamp) {
        // Throttle UI updates to avoid unnecessary DOM manipulation every frame
        if (timestamp - this.lastUIUpdateTime < TUNING.UI_UPDATE_INTERVAL) {
            return;
        }
        this.lastUIUpdateTime = timestamp;

        // --- Get current data ---
        // Note: We need the actual systems implemented to get live data
        const resources = this.game.resourceManager; // Assuming ResourceManager exists
        const clicker = this.game.clickerSystem;     // Assuming ClickerSystem exists
        const structures = this.game.structureSystem; // Assuming StructureSystem exists

        // --- Update Resource Displays ---
        if (resources) {
            this.updateTextContent(this.domElements.energyDisplay, resources.getVoidEnergy());
            this.updateTextContent(this.domElements.epsDisplay, resources.getEPS());
            // Update Echoes, TP displays later...
        } else {
             // Display placeholder if resource manager isn't ready
             this.updateTextContent(this.domElements.energyDisplay, '...');
             this.updateTextContent(this.domElements.epsDisplay, '...');
        }


        // --- Update Core Heat Display ---
        if (clicker) {
            const heatPercent = (clicker.getCurrentHeat() / TUNING.MAX_CLICK_HEAT) * 100;
            this.updateTextContent(this.domElements.heatDisplay, heatPercent.toFixed(0)); // Display as integer percentage
            if (this.domElements.heatBar) {
                this.domElements.heatBar.style.width = `${Math.min(100, heatPercent)}%`;
            }
            // Update core visual state (overheated class)
            if(this.domElements.voidCore) {
                if (clicker.isOverheated()) {
                    this.domElements.voidCore.classList.add('overheated');
                    this.domElements.voidCore.classList.remove('clickable'); // Prevent clicking visual state
                } else {
                    this.domElements.voidCore.classList.remove('overheated');
                    this.domElements.voidCore.classList.add('clickable');
                }
            }
        } else {
             this.updateTextContent(this.domElements.heatDisplay, '...');
             if (this.domElements.heatBar) this.domElements.heatBar.style.width = '0%';
        }


        // --- Update Button States & Costs ---
        if (resources && structures) {
             // Example: Crystal Node Button
            const cost = structures.getStructureCost('crystalNode');
            const canAfford = resources.canAfford(cost);

            this.updateTextContent(this.domElements.crystalCostSpan, cost);
            if(this.domElements.buyCrystalNodeButton) {
                this.domElements.buyCrystalNodeButton.disabled = !canAfford;
            }

            // Update other structure/upgrade buttons similarly...
        } else {
             // Disable buttons if systems aren't ready
             if(this.domElements.buyCrystalNodeButton) this.domElements.buyCrystalNodeButton.disabled = true;
        }


        // --- Update Structure Visuals (if needed) ---
        // This might be handled by a dedicated graphics/world builder class
        // if structures need complex visual updates, or simply here if basic.


        // --- Update Skill Cooldowns (placeholder) ---


        // --- Update Prestige Button State (placeholder) ---

    }

    /**
     * Helper function to update text content efficiently, avoiding unnecessary updates.
     * @param {HTMLElement} element - The DOM element to update.
     * @param {string|number} value - The new value to display.
     * @param {boolean} formatNumber - Whether to format numbers using the numberFormatter.
     */
    updateTextContent(element, value, formatNumber = true) {
        if (!element) return;

        let displayValue = value;
        if (typeof value === 'number' && formatNumber) {
            displayValue = this.numberFormatter.format(value);
        } else {
            displayValue = String(value); // Ensure it's a string
        }


        // Only update DOM if the text is actually different
        if (element.textContent !== displayValue) {
            element.textContent = displayValue;
        }
    }

    /**
     * Displays a temporary message to the user (e.g., "Game Saved!").
     * Needs a dedicated element in the HTML or creates one dynamically.
     * @param {string} message - The message to display.
     * @param {number} durationMs - How long to show the message (in milliseconds).
     */
    showTemporaryMessage(message, durationMs = 2000) {
         // Simple implementation using alert for now
         // A better approach would be a dedicated status div in the HTML
         console.log(`UI Message: ${message}`); // Log it too
         // alert(message); // Avoid alert as it blocks execution

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

         // Clear previous timeout if any
         if (messageElement.timeoutId) {
             clearTimeout(messageElement.timeoutId);
         }

         // Set timeout to fade out
         messageElement.timeoutId = setTimeout(() => {
             messageElement.style.opacity = '0';
             // Optional: remove element after fade out
             // setTimeout(() => { if (messageElement.parentNode) messageElement.parentNode.removeChild(messageElement); }, 500);
         }, durationMs);
     }

}

export default UIManager;