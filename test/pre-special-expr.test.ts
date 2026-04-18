import { getBuildOutput } from './helpers/build-output';
import {
    ternaryPre,
    instanceofPre,
    inOperatorPre,
    voidOperatorPre,
    thisInFunction,
    shortCircuitFalse,
    shortCircuitTrue,
    BaseClass,
    DerivedClass,
} from '@src/pre-special-expr-fixtures';

describe('Phase 2: Special expressions in @pre', () => {

    // 1.22: Ternary expression
    describe('ternaryPre (1.22)', () => {
        it('should pass when cond is true and a > 0', () => {
            expect(ternaryPre(true, 5, -1)).toBe(5);
        });

        it('should pass when cond is false and b > 0', () => {
            expect(ternaryPre(false, -1, 5)).toBe(5);
        });

        it('should throw when cond is true and a <= 0', () => {
            expect(() => ternaryPre(true, 0, 5)).toThrow();
        });

        it('should throw when cond is false and b <= 0', () => {
            expect(() => ternaryPre(false, 5, 0)).toThrow();
        });
    });

    // 1.28: instanceof check
    // Note: The transformer warns about BaseClass being unknown, so the guard
    // is NOT injected. The function runs normally.
    describe('instanceofPre (1.28)', () => {
        it('should pass with BaseClass instance', () => {
            expect(instanceofPre(new BaseClass())).toBe(true);
        });

        it('should pass with DerivedClass instance (inherits from BaseClass)', () => {
            expect(instanceofPre(new DerivedClass())).toBe(true);
        });

        it('should return false with plain object (no guard injected)', () => {
            // Since the contract expression is skipped due to unknown identifier,
            // the function runs without guards and just returns the result
            expect(instanceofPre({})).toBe(false);
        });
    });

    // 1.29: in operator
    describe('inOperatorPre (1.29)', () => {
        it('should pass when key exists', () => {
            expect(inOperatorPre({ key: 42 })).toBe(true);
        });

        it('should throw when key does not exist', () => {
            expect(() => inOperatorPre({ other: 42 })).toThrow();
        });
    });

    // 1.30: void operator
    describe('voidOperatorPre (1.30)', () => {
        it('emits an internal error for VoidExpression (axiom alpha 16)', () => {
            expect(getBuildOutput()).toContain(
                '[axiom] Internal error in voidOperatorPre: Unsupported expression node kind: VoidExpression'
            );
        });

        it('should pass — void 0 === undefined is always true', () => {
            expect(voidOperatorPre(5)).toBe(5);
            expect(voidOperatorPre(-1)).toBe(-1);
        });
    });

    // 1.16: this in standalone function
    describe('thisInFunction (1.16)', () => {
        it('should handle this in function context', () => {
            expect(thisInFunction()).toBe(true);
        });
    });

    // 1.17: Short-circuit evaluation
    describe('shortCircuitFalse (1.17)', () => {
        it('should NOT throw — false && anything short-circuits', () => {
            // Even though unknownId is not defined, the short-circuit should
            // prevent evaluation. If it does evaluate, the transformer should
            // have emitted a warning at build time, not a runtime error here.
            expect(shortCircuitFalse(5)).toBe(5);
            expect(shortCircuitFalse(-5)).toBe(-5);
        });
    });

    describe('shortCircuitTrue (1.17)', () => {
        it('should pass when x > 0', () => {
            expect(shortCircuitTrue(5)).toBe(5);
        });

        it('should throw when x <= 0', () => {
            expect(() => shortCircuitTrue(0)).toThrow();
        });
    });
});
