import {
    doOrPre,
    doNegationPre,
    doComparisonPre,
    doArithmeticPre,
    nonExportedWithPre,
    ServiceClass,
    unionTypePre,
    unaryOperandPre,
    compoundNarrowingPre,
} from '@src/pre-condition-fixtures';
import { getBuildOutput } from './helpers/build-output';

describe('Phase 1: @pre condition variants', () => {

    // Build-output assertions for axiom 0.88+ warnings
    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    // 8.4: Union-typed param — now warns on type mismatch (0.88+)
    describe('unionTypePre (8.4)', () => {
        it('should emit type-mismatch warning for union type', () => {
            expect(buildOutput).toContain('unionTypePre');
        });
    });

    // 8.6: Unary operand — now warns on type mismatch (0.88+)
    describe('unaryOperandPre (8.6)', () => {
        it('should emit type-mismatch warning for unary expression', () => {
            expect(buildOutput).toContain('unaryOperandPre');
        });
    });

    // 8.7: Compound conditions — now warns on type narrowing (0.88+)
    describe('compoundNarrowingPre (8.7)', () => {
        it('should emit type-mismatch warning for compound narrowing', () => {
            expect(buildOutput).toContain('compoundNarrowingPre');
        });
    });

    // 1.17: Logical OR in @pre
    describe('doOrPre (1.17)', () => {
        it('should pass when a > 0', () => {
            expect(doOrPre(5, -1)).toBe(true);
        });

        it('should pass when b > 0', () => {
            expect(doOrPre(-1, 5)).toBe(true);
        });

        it('should pass when both > 0', () => {
            expect(doOrPre(3, 4)).toBe(true);
        });

        it('should throw when both <= 0', () => {
            expect(() => doOrPre(-1, -1)).toThrow();
            expect(() => doOrPre(0, 0)).toThrow();
        });
    });

    // 1.19: Negation @pre !flag
    describe('doNegationPre (1.19)', () => {
        it('should pass when disabled is false', () => {
            expect(doNegationPre(false)).toBe('enabled');
        });

        it('should throw when disabled is true', () => {
            expect(() => doNegationPre(true)).toThrow();
        });
    });

    // 1.20: Comparison operators
    describe('doComparisonPre (1.20)', () => {
        it('should pass with a >= 0, b <= 100, a !== b, a < 1000', () => {
            expect(doComparisonPre(10, 90)).toBe(100);
            expect(doComparisonPre(0, 100)).toBe(100);
        });

        it('should throw when a < 0', () => {
            expect(() => doComparisonPre(-1, 50)).toThrow();
        });

        it('should throw when b > 100', () => {
            expect(() => doComparisonPre(50, 101)).toThrow();
        });

        it('should throw when a === b', () => {
            expect(() => doComparisonPre(42, 42)).toThrow();
        });

        it('should throw when a >= 1000', () => {
            expect(() => doComparisonPre(1000, 50)).toThrow();
        });
    });

    // 1.21: Arithmetic expressions in @pre
    describe('doArithmeticPre (1.21)', () => {
        it('should pass when a + b > 10', () => {
            expect(doArithmeticPre(6, 5)).toBe(11);
            expect(doArithmeticPre(100, -80)).toBe(20);
        });

        it('should throw when a + b <= 10', () => {
            expect(() => doArithmeticPre(5, 5)).toThrow(); // 10 is not > 10
            expect(() => doArithmeticPre(3, 2)).toThrow();
            expect(() => doArithmeticPre(-1, -1)).toThrow();
        });
    });

    // 1.27: @pre on non-exported function — should NOT have guards injected
    describe('nonExportedWithPre (1.27)', () => {
        it('should NOT throw even with negative x (no guards injected)', () => {
            // The function has @pre x > 0 but since it's not exported,
            // the transformer should skip it
            expect(nonExportedWithPre(-5)).toBe(-10); // should NOT throw
        });

        it('should work normally with positive x', () => {
            expect(nonExportedWithPre(5)).toBe(10);
        });
    });

    // 1.31: Static method @pre pass/fail
    describe('ServiceClass.staticWithPre (1.31)', () => {
        it('should pass with x > 0', () => {
            expect(ServiceClass.staticWithPre(5)).toBe(10);
        });

        it('should throw with x <= 0', () => {
            expect(() => ServiceClass.staticWithPre(0)).toThrow();
            expect(() => ServiceClass.staticWithPre(-1)).toThrow();
        });
    });

    describe('ServiceClass.instanceWithThis (5.2)', () => {
        it('should pass with x <= limit', () => {
            const svc = new ServiceClass(100);
            expect(svc.instanceWithThis(50)).toBe(50);
        });

        it('should throw with x > limit', () => {
            const svc = new ServiceClass(10);
            expect(() => svc.instanceWithThis(50)).toThrow();
        });
    });

    describe('ServiceClass.staticWithPost', () => {
        it('should pass — result is always >= 0', () => {
            expect(ServiceClass.staticWithPost(5)).toBe(5);
            expect(ServiceClass.staticWithPost(-5)).toBe(5);
        });
    });
});
