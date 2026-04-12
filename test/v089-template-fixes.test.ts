import { getBuildOutput } from './helpers/build-output';
import {
    interpolatedWithSibling,
    noSubstWithSibling,
} from '../src/v089-template-fixtures';
import { ContractViolationError } from '@fultslop/axiom';

describe('v0.8.9 Template Literal Fixes', () => {
    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    describe('1. Interpolated template literals compile', () => {
        it('should inject contract for @pre label === `item_${id}`', () => {
            // If contract is injected, this should pass
            expect(() => interpolatedWithSibling('item_5', 5, 1)).not.toThrow();
        });

        it('should reject when interpolated template does not match', () => {
            // If contract is injected, this should throw
            expect(() => interpolatedWithSibling('wrong_5', 5, 1)).toThrow(ContractViolationError);
        });

        it('should preserve ${id} reference in guard', () => {
            // The id parameter should be accessible in the guard
            expect(() => interpolatedWithSibling('item_10', 10, 1)).not.toThrow();
            expect(() => interpolatedWithSibling('item_99', 99, 1)).not.toThrow();
        });
    });

    describe('2. Interpolated templates dont drop sibling contracts', () => {
        it('should inject BOTH @pre label === `item_${id}` AND @pre count > 0', () => {
            // Both contracts must be satisfied
            expect(() => interpolatedWithSibling('item_5', 5, 1)).not.toThrow();
        });

        it('should throw when sibling contract count > 0 fails', () => {
            // label matches but count <= 0
            expect(() => interpolatedWithSibling('item_5', 5, 0)).toThrow(ContractViolationError);
            expect(() => interpolatedWithSibling('item_5', 5, -1)).toThrow(ContractViolationError);
        });

        it('should throw when interpolated template fails even if sibling passes', () => {
            // count > 0 but label doesnt match
            expect(() => interpolatedWithSibling('wrong_5', 5, 1)).toThrow(ContractViolationError);
        });
    });

    describe('3. No-substitution template literals compile', () => {
        it('should inject contract for @pre label === `hello`', () => {
            expect(() => noSubstWithSibling('hello', 1)).not.toThrow();
        });

        it('should reject when no-substitution template does not match', () => {
            expect(() => noSubstWithSibling('world', 1)).toThrow(ContractViolationError);
        });
    });

    describe('4. No-substitution templates dont drop sibling contracts', () => {
        it('should inject BOTH @pre label === `hello` AND @pre count > 0', () => {
            expect(() => noSubstWithSibling('hello', 1)).not.toThrow();
        });

        it('should throw when sibling contract count > 0 fails', () => {
            expect(() => noSubstWithSibling('hello', 0)).toThrow(ContractViolationError);
            expect(() => noSubstWithSibling('hello', -1)).toThrow(ContractViolationError);
        });

        it('should throw when template fails even if sibling passes', () => {
            expect(() => noSubstWithSibling('world', 1)).toThrow(ContractViolationError);
        });
    });

    describe('5. Type-mismatch warning for backtick vs number', () => {
        it('should emit type mismatch warning for @pre count === `hello` where count: number', () => {
            expect(buildOutput).toContain('typeMismatchBacktickNumber');
            expect(buildOutput).toContain('type mismatch');
        });
    });

    describe('6. No false warning for backtick vs string', () => {
        it('should NOT emit warning for @pre label === `hello` where label: string', () => {
            expect(buildOutput).not.toContain('noFalseWarningBacktickString');
        });
    });
});
