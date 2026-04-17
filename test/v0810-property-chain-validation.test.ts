// Comprehensive test for v0.8.10 property chain validation
import {
    ValidPropertyChain,
    invalidParamChain,
    deepValidChain,
} from '@src/v0810-property-chain-fixtures';

describe('v0.8.10 property chain validation with TypeChecker', () => {
    let buildOutput: string;

    beforeAll(() => {
        // Force fresh build by resetting module cache
        jest.resetModules();
        const { getBuildOutput: freshBuild } = require('./helpers/build-output');
        buildOutput = freshBuild(true);
    });

    describe('valid property chains should compile without warnings', () => {
        it('should NOT warn about ValidPropertyChain.this.config.limit', () => {
            const warnings = buildOutput.split('\n').filter(line =>
                line.includes('ValidPropertyChain') &&
                line.includes('property') &&
                line.includes('does not exist')
            );

            expect(warnings.length).toBe(0);
        });

        it('should NOT warn about ValidPropertyChain.this.config.name.length', () => {
            const warnings = buildOutput.split('\n').filter(line =>
                line.includes('ValidPropertyChain') &&
                line.includes('property') &&
                line.includes('does not exist')
            );

            expect(warnings.length).toBe(0);
        });

        it('should NOT warn about deepValidChain.root.level1.level2.value', () => {
            const warnings = buildOutput.split('\n').filter(line =>
                line.includes('deepValidChain') &&
                line.includes('property') &&
                line.includes('does not exist')
            );

            expect(warnings.length).toBe(0);
        });
    });

    describe('invalid property chains SHOULD warn and drop contract', () => {
        it('should warn about invalidParamChain.config.missing.value', () => {
            // The warning is multi-line, so we need to check the full output
            expect(buildOutput).toContain('invalidParamChain');
            expect(buildOutput).toContain("property 'missing' does not exist");
            expect(buildOutput).toContain("on type '{ value: number; }'");
        });
    });

    describe('existing fixtures should still work', () => {
        it('should NOT warn about MultiLevelAccess property chains (valid property chain)', () => {
            // MultiLevelAccess has valid property chain, should not warn about property access
            // Note: axiom may warn about @pre/@post on class declarations, but that's different
            const propertyWarnings = buildOutput.split('\n').filter(line =>
                line.includes('MultiLevelAccess') &&
                line.includes("property") &&
                line.includes("does not exist")
            );
            expect(propertyWarnings.length).toBe(0);
            expect(buildOutput).not.toContain("property 'config' does not exist");
            expect(buildOutput).not.toContain("property 'limit' does not exist");
        });

        it('should NOT warn about doOptionalFn optional chaining on union type (alpha.3 fix)', () => {
            // doOptionalFn has @pre obj?.value > 0 where obj: ValueCarrier | null
            // alpha.3 fixes the false-positive: optional chaining on union types should validate correctly
            const optionalChainWarnings = buildOutput.split('\n').filter(line =>
                line.includes('doOptionalFn') &&
                line.includes("property") &&
                line.includes("does not exist")
            );
            expect(optionalChainWarnings.length).toBe(0);
        });
    });

    describe('runtime behavior - valid contracts should be enforced', () => {
        it('should pass when ValidPropertyChain has valid config', () => {
            const instance = new ValidPropertyChain(10, 'test');
            expect(instance.check({ settings: { threshold: 5 } })).toBe(true);
        });

        it('should throw when deepValidChain has threshold <= 0', () => {
            expect(() => deepValidChain({ level1: { level2: { value: 0 } } })).toThrow();
        });

        it('should pass when deepValidChain has threshold > 0', () => {
            expect(deepValidChain({ level1: { level2: { value: 5 } } })).toBe(true);
        });
    });

    describe('runtime behavior - invalid contracts should be dropped', () => {
        // v0.8.12 fixes the bug in full program mode (TypeChecker available)
        // Note: ts-jest uses transpileModule mode which still doesn't validate property chains
        // See v0812-acceptance-full-program-mode.test.ts for the full program mode verification
        it('BUG: invalid contract is NOT dropped in transpileModule mode (ts-jest limitation)', () => {
            // In transpileModule mode (no TypeChecker), property validation is skipped
            // The contract is injected without validation, causing runtime error
            // This is a known limitation of ts-jest, not a bug in v0.8.12
            expect(() => invalidParamChain({ value: -5 })).toThrow(
                TypeError
            );
        });
    });
});
