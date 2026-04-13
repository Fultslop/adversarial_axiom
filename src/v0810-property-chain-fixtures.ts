// Test fixtures for v0.8.10 property chain validation
// These fixtures test both valid and invalid property access chains

// VALID: Multi-level property chain where all properties exist
/**
 * @pre this.config.limit > 0
 * @pre this.config.name.length > 0
 */
export class ValidPropertyChain {
    public config: { limit: number; name: string };

    constructor(limit: number, name: string) {
        this.config = { limit, name };
    }

    // VALID: Deep parameter property chain
    /**
     * @pre data.settings.threshold > 0
     */
    public check(data: { settings: { threshold: number } }): boolean {
        return data.settings.threshold > 0;
    }
}

// INVALID: Parameter-based chain with missing property
// This should trigger a warning and the contract should be DROPPED
/**
 * @pre config.missing.value > 0
 */
export function invalidParamChain(config: { value: number }): boolean {
    // Note: The @pre contract is invalid and should be dropped
    // If the contract is correctly dropped, this function should work normally
    // If the contract is incorrectly injected, it will fail at runtime
    return config.value > 0;
}

// VALID: Multiple levels on parameter
/**
 * @pre root.level1.level2.value > 0
 */
export function deepValidChain(root: { level1: { level2: { value: number } } }): boolean {
    return root.level1.level2.value > 0;
}
