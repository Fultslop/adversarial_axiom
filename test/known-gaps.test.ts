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

    // 2.12: Non-primitive return — result omitted from type map
    describe('non-primitive return (2.12, 8.3)', () => {
        it('should not emit type-mismatch warning for non-primitive return', () => {
            expect(buildOutput).not.toContain('nonPrimitivePost');
        });
    });

    // 8.4: Union-typed param — type mismatch not detected
    describe('union-typed param (8.4)', () => {
        it('should not emit type-mismatch warning for union type', () => {
            expect(buildOutput).not.toContain('unionTypePre');
        });
    });

    // 8.5: Multi-level property chain — only root checked
    describe('multi-level property chain (8.5)', () => {
        it('should only check root this, not intermediate properties', () => {
            expect(buildOutput).not.toContain('MultiLevelAccess');
        });
    });

    // 8.6: Unary operand — type mismatch not detected
    describe('unary operand (8.6)', () => {
        it('should not emit type-mismatch warning for unary expression', () => {
            expect(buildOutput).not.toContain('unaryOperandPre');
        });
    });

    // 8.7: Compound conditions — type narrowing not considered
    describe('compound conditions (8.7)', () => {
        it('should not use type narrowing from sibling clause', () => {
            expect(buildOutput).not.toContain('compoundNarrowingPre');
        });
    });
});
