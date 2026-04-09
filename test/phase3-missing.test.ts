import {
    arrowFnWithPre,
    funcExprWithPre,
    asyncFnWithPre,
    generatorFnWithPre,
    ConstructorContracts,
    BaseContract,
    DerivedContract,
} from '@src/phase3-missing-features';

describe('Phase 3: Missing feature tests (not yet in scope)', () => {

    // 1.12: @pre on exported arrow function — NOT instrumented
    describe('arrow function contracts (1.12)', () => {
        it('should NOT throw on negative value (arrow functions not instrumented)', () => {
            // Arrow functions are not yet supported. The transformer should skip them.
            expect(arrowFnWithPre(-5)).toBe(-5); // should NOT throw
        });

        it('should work normally with positive value', () => {
            expect(arrowFnWithPre(5)).toBe(5);
        });
    });

    // 1.13: @pre on exported function expression — NOT instrumented
    describe('function expression contracts (1.13)', () => {
        it('should NOT throw on negative value (function expressions not instrumented)', () => {
            expect(funcExprWithPre(-5)).toBe(-5); // should NOT throw
        });

        it('should work normally with positive value', () => {
            expect(funcExprWithPre(5)).toBe(5);
        });
    });

    // 1.14: @pre on async function — may or may not be instrumented
    // The README says async functions are "not yet in scope", but the transformer
    // may still inject guards. We test actual behavior.
    describe('async function contracts (1.14)', () => {
        it('should throw on negative value (async functions may be instrumented)', async () => {
            // The transformer DOES inject guards for async functions
            await expect(asyncFnWithPre(-5)).rejects.toThrow();
        });

        it('should work normally with positive value', async () => {
            await expect(asyncFnWithPre(5)).resolves.toBe(5);
        });
    });

    // 1.15: @pre on generator function — may or may not be instrumented
    describe('generator function contracts (1.15)', () => {
        it('should throw on negative value (generators may be instrumented)', () => {
            // The transformer DOES inject guards for generator functions
            const gen = generatorFnWithPre(-5);
            expect(() => gen.next()).toThrow();
        });

        it('should work normally with positive value', () => {
            const gen = generatorFnWithPre(5);
            const result = gen.next();
            expect(result.value).toBe(5);
        });
    });

    // 5.8: Constructor contracts — @pre/@post on constructor not instrumented,
    // but @invariant on the class IS checked after constructor
    describe('constructor contracts (5.8)', () => {
        it('should NOT throw constructor @pre violation but WILL throw on @invariant', () => {
            // Constructor @pre is not instrumented, but @invariant this.value > 0
            // is checked after constructor. So -5 passes @pre but fails @invariant.
            expect(() => new ConstructorContracts(-5)).toThrow();
        });

        it('should work normally with positive value', () => {
            const cc = new ConstructorContracts(5);
            expect(cc.value).toBe(5);
        });

        it('should check invariant after constructor', () => {
            expect(() => new ConstructorContracts(0)).toThrow();
        });
    });

    // 4.8: Inherited contracts — base class invariants ARE inherited via the
    // #checkInvariants method injection on the derived class
    describe('inherited contracts (4.8)', () => {
        it('should check base class invariant on derived constructor', () => {
            // The derived class constructor calls super(), and the base class
            // invariant is checked there. So baseValue = -5 throws.
            expect(() => new DerivedContract(-5, 5)).toThrow();
        });

        it('should check derived class invariant on constructor', () => {
            expect(() => new DerivedContract(5, -1)).toThrow();
        });

        it('should instrument derived class own methods', () => {
            const d = new DerivedContract(5, 5);
            expect(() => d.derivedMethod(-1)).toThrow();
            expect(d.derivedMethod(5)).toBe(5);
        });

        it('should override base method with own contract', () => {
            const d = new DerivedContract(5, 5);
            // Override has @pre x > 10, which replaces the base @pre x > 0
            expect(() => d.baseMethod(5)).toThrow(); // x > 10 fails
            expect(d.baseMethod(15)).toBe(30); // x > 10 passes
        });

        it('should instrument base class methods on base instances', () => {
            const b = new BaseContract(5);
            expect(() => b.baseMethod(-1)).toThrow();
            expect(b.baseMethod(5)).toBe(5);
        });
    });
});
