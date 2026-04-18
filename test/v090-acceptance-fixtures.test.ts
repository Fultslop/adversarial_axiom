import {
    arrowWithPreFixture,
    arrowWithPostFixture,
    arrowWithBothFixture,
    asyncFnWithPreFixture,
    asyncFnWithPostFixture,
    asyncArrowFixture,
    funcExprFixture,
} from '@src/v090-acceptance-fixtures';
import { ContractViolationError } from '@fultslop/axiom';

describe('v0.9.0 Regression Guard (ts-jest)', () => {

    describe('Exported arrow with @pre', () => {
        it('throws ContractViolationError on negative input', () => {
            expect(() => arrowWithPreFixture(-1)).toThrow(ContractViolationError);
        });
        it('returns value on valid input', () => {
            expect(arrowWithPreFixture(1)).toBe(1);
        });
    });

    describe('Exported arrow with @post', () => {
        it('returns result and post-guard passes on valid input', () => {
            expect(arrowWithPostFixture(2)).toBe(4);
        });
    });

    describe('Exported arrow with @pre and @post', () => {
        it('throws on pre violation', () => {
            expect(() => arrowWithBothFixture(-1)).toThrow(ContractViolationError);
        });
        it('returns value when both guards pass', () => {
            expect(arrowWithBothFixture(2)).toBe(3);
        });
    });

    describe('Async function with @pre', () => {
        it('rejects with ContractViolationError on negative input', async () => {
            await expect(asyncFnWithPreFixture(-1)).rejects.toThrow(ContractViolationError);
        });
        it('resolves on valid input', async () => {
            await expect(asyncFnWithPreFixture(1)).resolves.toBe(1);
        });
    });

    describe('Async function with @post', () => {
        it('resolves and post-guard passes on valid input', async () => {
            await expect(asyncFnWithPostFixture(2)).resolves.toBe(4);
        });
    });

    describe('Async arrow with @pre', () => {
        it('rejects with ContractViolationError on negative input', async () => {
            await expect(asyncArrowFixture(-1)).rejects.toThrow(ContractViolationError);
        });
        it('resolves on valid input', async () => {
            await expect(asyncArrowFixture(1)).resolves.toBe(1);
        });
    });

    describe('Exported function expression with @pre', () => {
        it('throws ContractViolationError on negative input', () => {
            expect(() => funcExprFixture(-1)).toThrow(ContractViolationError);
        });
        it('returns value on valid input', () => {
            expect(funcExprFixture(1)).toBe(1);
        });
    });
});
