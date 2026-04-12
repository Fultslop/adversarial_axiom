import { getBuildOutput } from './helpers/build-output';
import {
    noSubstTemplateLiteralPre,
    noSubstTemplateReject,
    interpolatedTemplateLiteralPre,
    noSubstTemplateLiteralPost,
    multipleNoSubstTemplates,
    templateOnLeft,
    multipleTemplatesInOneContract,
    templateNegation,
} from '../src/template-literals';
import { ContractViolationError } from '@fultslop/axiom';

describe('Template Literal Support (v0.8.5)', () => {
    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    describe('Build warnings - no-substitution template literals', () => {
        it('should NOT warn about noSubstTemplateLiteralPre - v0.8.5 fix', () => {
            // v0.8.5 should handle no-substitution templates without error
            expect(buildOutput).not.toContain('noSubstTemplateLiteralPre');
        });

        it('should NOT warn about multipleNoSubstTemplates - v0.8.5 fix', () => {
            expect(buildOutput).not.toContain('multipleNoSubstTemplates');
        });

        it('should NOT warn about templateNegation - v0.8.5 fix', () => {
            expect(buildOutput).not.toContain('templateNegation');
        });
    });

    describe('No-substitution template literals - @pre', () => {
        it('should accept matching no-substitution template', () => {
            expect(() => noSubstTemplateLiteralPre('hello')).not.toThrow();
        });

        it('should reject non-matching no-substitution template', () => {
            expect(() => noSubstTemplateLiteralPre('world')).toThrow(ContractViolationError);
        });

        it('should accept matching status', () => {
            expect(() => noSubstTemplateReject('active')).not.toThrow();
        });

        it('should reject non-matching status', () => {
            expect(() => noSubstTemplateReject('inactive')).toThrow(ContractViolationError);
        });
    });

    describe('Interpolated template literals', () => {
        // NOTE: Interpolated template literals (${var}) are NOT supported yet
        // v0.8.5 only fixed no-substitution template literals
        it('should NOT have contract injected (known limitation)', () => {
            // No contract injected, so this won't throw
            expect(() => interpolatedTemplateLiteralPre('item_5', 3)).not.toThrow();
        });
    });

    describe('No-substitution template literals - @post', () => {
        it('should accept matching post condition', () => {
            expect(() => noSubstTemplateLiteralPost('ok')).not.toThrow();
        });

        it('should reject non-matching post condition', () => {
            expect(() => noSubstTemplateLiteralPost('fail')).toThrow(ContractViolationError);
        });
    });

    describe('Multiple no-substitution templates', () => {
        it('should accept when both match', () => {
            expect(() => multipleNoSubstTemplates('admin')).not.toThrow();
        });

        it('should accept when second matches (OR condition)', () => {
            expect(() => multipleNoSubstTemplates('user')).not.toThrow();
        });

        it('should reject when neither matches', () => {
            expect(() => multipleNoSubstTemplates('guest')).toThrow(ContractViolationError);
        });
    });

    describe('Template literal on left side', () => {
        // NOTE: Interpolated templates on left side also not supported
        it('should NOT have contract injected (known limitation)', () => {
            expect(() => templateOnLeft(42, 'wrong')).not.toThrow();
        });
    });

    describe('Multiple templates in single contract', () => {
        it('should accept when both match', () => {
            expect(() => multipleTemplatesInOneContract('one', 'two')).not.toThrow();
        });

        it('should reject when first does not match', () => {
            expect(() => multipleTemplatesInOneContract('uno', 'two')).toThrow(ContractViolationError);
        });

        it('should reject when second does not match', () => {
            expect(() => multipleTemplatesInOneContract('one', 'dos')).toThrow(ContractViolationError);
        });
    });

    describe('Template literal with negation', () => {
        it('should accept when not equal to template', () => {
            expect(() => templateNegation('active')).not.toThrow();
        });

        it('should reject when equal to template', () => {
            expect(() => templateNegation('inactive')).toThrow(ContractViolationError);
        });
    });
});
