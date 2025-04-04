/**
 * Definitions for all purchasable structures in the game.
 * Each key is a unique ID for the structure type.
 */
export const STRUCTURE_DATA = Object.freeze({
    // TIER 1 Structures
    crystalNode: {
        id: 'crystalNode',
        name: 'Crystal Node',
        description: 'Generates a small amount of Void Energy passively.',
        tier: 1,
        // Cost calculation: baseCost * (scalingFactor ^ count)
        baseCost: 10,
        costScalingFactor: 1.15, // Each node makes the next 15% more expensive
        // Output calculation: baseOutput * count * (potential multipliers)
        baseOutput: 0.1, // Base Energy Per Second (EPS) per node
        outputType: 'voidEnergy', // What resource does it produce?
        // visual: { // Placeholder for visual info later (sprite, position rules?)
        //     className: 'structure crystal-node'
        // }
    },

    fluxShard: {
        id: 'fluxShard',
        name: 'Flux Shard',
        description: 'Passively increases energy gained from clicks.',
        tier: 1,
        baseCost: 50, // Or adjust as desired
        costScalingFactor: 1.25, // Or adjust
        baseOutput: 0.02, // Represents +2% click multiplier increase *per shard*
        outputType: 'clickMultiplier', // Special type identifier
    },

    // TIER 2 Structures (Example placeholders)
    gravityWell: {
        id: 'gravityWell',
        name: 'Gravity Well',
        description: 'Automatically clicks the Void Core once per second.',
        tier: 2,
        baseCost: 250,
        costScalingFactor: 1.20,
        // This provides "auto-clicks", handled differently than direct EPS
        baseOutput: 1, // 1 auto-click per second per well
        outputType: 'autoClick', // Special type
    },

    // --- Add other structures from your design doc here ---
    // pulseRelay: { ... }
    // entropySink: { ... }
    // voidConverter: { ... }
    // orbitRing: { ... }
    // focusBeacon: { ... }

});

/**
 * Helper function to get data for a specific structure.
 * @param {string} structureId - The ID of the structure (e.g., 'crystalNode').
 * @returns {object|null} The structure data object or null if not found.
 */
export function getStructureData(structureId) {
    return STRUCTURE_DATA[structureId] || null;
}