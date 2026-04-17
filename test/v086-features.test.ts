import { getBuildOutput } from './helpers/build-output';
import {
    Priority,
    enumMemberPre,
    enumMemberPost,
    Status,
    complexEnumExpression,
    moduleConstantsPre,
    moduleConstantPost,
    Mode,
    mixedEnumAndConstant,
    interpolatedTemplateControl,
} from '../src/v086-features';
import { ContractViolationError } from '@fultslop/axiom';

describe('v0.8.6 Features: Enum & Module Constants', () => {
    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    describe('Build warnings - enum and constant resolution', () => {
        it('should NOT warn about enumMemberPre - enum resolved via TypeChecker', () => {
            expect(buildOutput).not.toContain('enumMemberPre');
        });

        it('should NOT warn about enumMemberPost - enum resolved via TypeChecker', () => {
            expect(buildOutput).not.toContain('enumMemberPost');
        });

        it('should NOT warn about complexEnumExpression - complex enum expression works', () => {
            expect(buildOutput).not.toContain('complexEnumExpression');
        });

        it('should NOT warn about moduleConstantsPre - constants resolved via TypeChecker', () => {
            expect(buildOutput).not.toContain('moduleConstantsPre');
        });

        it('should NOT warn about moduleConstantPost - constant in @post works', () => {
            expect(buildOutput).not.toContain('moduleConstantPost');
        });

        it('should NOT warn about mixedEnumAndConstant - mixed enum and constant works', () => {
            expect(buildOutput).not.toContain('mixedEnumAndConstant');
        });

        it('should NOT warn about interpolatedTemplateControl (silently skipped)', () => {
            // Interpolated templates still not supported, but should not error
            expect(buildOutput).not.toContain('interpolatedTemplateControl');
        });
    });

    describe('Enum member references in @pre', () => {
        it('should accept matching enum member (Priority.High)', () => {
            expect(() => enumMemberPre(Priority.High)).not.toThrow();
        });

        it('should accept matching enum member (Priority.Critical)', () => {
            expect(() => enumMemberPre(Priority.Critical)).not.toThrow();
        });

        it('should reject non-matching enum member (Priority.Low)', () => {
            expect(() => enumMemberPre(Priority.Low)).toThrow(ContractViolationError);
        });

        it('should reject non-matching enum member (Priority.Medium)', () => {
            expect(() => enumMemberPre(Priority.Medium)).toThrow(ContractViolationError);
        });
    });

    describe('Enum member references in @post', () => {
        it('should accept when @post result matches enum member', () => {
            expect(() => enumMemberPost()).not.toThrow();
        });
    });

    describe('Complex enum expressions', () => {
        it('should accept Status.Active (first part of OR)', () => {
            // Note: Complex expressions may not have contracts injected in v0.8.6
            // This test documents current behavior
            expect(() => complexEnumExpression(Status.Active, 0)).not.toThrow();
        });

        it('should accept Status.Pending with level > 0', () => {
            expect(() => complexEnumExpression(Status.Pending, 5)).not.toThrow();
        });
    });

    describe('Module-level constants in @pre', () => {
        it('should accept when retries <= MAX_RETRIES and timeout >= MIN_TIMEOUT', () => {
            expect(() => moduleConstantsPre(3, 100)).not.toThrow();
        });

        it('should accept when within bounds', () => {
            expect(() => moduleConstantsPre(1, 200)).not.toThrow();
        });

        it('should reject when retries > MAX_RETRIES', () => {
            expect(() => moduleConstantsPre(4, 100)).toThrow(ContractViolationError);
        });

        it('should reject when timeout < MIN_TIMEOUT', () => {
            expect(() => moduleConstantsPre(3, 50)).toThrow(ContractViolationError);
        });
    });

    describe('Module-level constant in @post', () => {
        it('should accept when result === DEFAULT_RESULT', () => {
            expect(() => moduleConstantPost()).not.toThrow();
        });
    });

    describe('Mixed enum and constant', () => {
        it('should accept Mode.Strict with score >= STRICT_THRESHOLD', () => {
            expect(() => mixedEnumAndConstant(Mode.Strict, 95)).not.toThrow();
        });

        it('should accept Mode.Lenient (any score)', () => {
            expect(() => mixedEnumAndConstant(Mode.Lenient, 50)).not.toThrow();
        });

        it('should reject Mode.Strict with score < STRICT_THRESHOLD', () => {
            expect(() => mixedEnumAndConstant(Mode.Strict, 80)).toThrow(ContractViolationError);
        });
    });

    describe('Interpolated template literals (now supported)', () => {
        it('should throw ContractViolationError when pre is violated (now supported)', () => {
            expect(() => interpolatedTemplateControl('wrong_value', 5)).toThrow(ContractViolationError);
        });
    });
});
