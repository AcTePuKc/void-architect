/**
 * Definitions for all purchasable upgrades in the game.
 */
export const UPGRADE_DATA = Object.freeze({

    // --- Click Upgrades ---
    clickPower_1: {
        id: 'clickPower_1',
        name: 'Reinforce Core Matrix',
        description: 'Increases base energy gained per click by 25%.',
        cost: 25, // Initial cost
        costScaling: 2.5, // Multiplies cost for next level (if tiered) - Placeholder for now
        maxLevel: 5, // Example: Limit how many times this specific upgrade ID can be bought
        effects: [
            {
                type: 'clickPowerMultiplier', // What does it affect?
                value: 0.25
            }
        ]
    }

});
