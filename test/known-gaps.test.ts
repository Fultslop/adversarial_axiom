import { getBuildOutput } from './helpers/build-output';

describe('Known limitation gap tests', () => {

    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    // 1.26: Template literal — type mismatch not detected
    describe('template literal (1.26)', () => {
        it('should not detect type mismatch with template literal', () => {
            expect(buildOutput).not.toContain('templateLiteralPre');
        });
    });

    // 8.5: Multi-level property chain — CLOSED in v0.8.10 for functions/methods
    // Property chain validation now works for function/method parameters using TypeChecker
    // Constructor @pre remains unsupported (separate limitation)
    describe('multi-level property chain (8.5) - v0.8.10', () => {
        it('should warn when property does not exist on parameter type', () => {
            // invalidParamChain has @pre config.missing.value > 0
            // where config: { value: number }, so 'missing' doesn't exist
            expect(buildOutput).toContain("property 'missing' does not exist");
        });

        it('should NOT warn when property does not exist on union type with optional chaining (alpha.3 fix)', () => {
            // doOptionalFn has @pre obj?.value > 0 where obj: ValueCarrier | null
            // alpha.3 fixes the false-positive: optional chaining on union types should validate correctly
            const optionalChainWarnings = buildOutput.split('\n').filter(line =>
                line.includes('doOptionalFn') &&
                line.includes("property") &&
                line.includes("does not exist")
            );
            expect(optionalChainWarnings.length).toBe(0);
        });

        it('should NOT warn when all properties in chain exist', () => {
            // MultiLevelAccess has @pre this.config.limit > 0 (valid chain)
            // Should NOT produce property warnings
            const multiLevelWarnings = buildOutput.split('\n').filter(line =>
                line.includes('MultiLevelAccess') &&
                line.includes('property') &&
                line.includes('does not exist')
            );
            expect(multiLevelWarnings.length).toBe(0);
        });
    });
});
