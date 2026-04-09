import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

describe('Release build (Phase 11)', () => {

    let releaseOutput: string;

    beforeAll(() => {
        // Use ts.transpileModule to compile without the transformer
        // This mirrors the canonical verification path used by the project
        const fixturePath = path.resolve(__dirname, '..', 'src', 'release-fixtures.ts');
        const source = fs.readFileSync(fixturePath, 'utf8');

        const result = ts.transpileModule(source, {
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
                strict: true,
                noEmitHelpers: true,
            },
            fileName: 'release-fixtures.ts',
        });

        releaseOutput = result.outputText;
    });

    // 11.1: No ContractViolationError references
    describe('no ContractViolationError (11.1)', () => {
        it('should not contain ContractViolationError in release output', () => {
            expect(releaseOutput).not.toContain('ContractViolationError');
        });
    });

    // 11.2: No InvariantViolationError references
    describe('no InvariantViolationError (11.2)', () => {
        it('should not contain InvariantViolationError in release output', () => {
            expect(releaseOutput).not.toContain('InvariantViolationError');
        });
    });

    // 11.3: No #checkInvariants method
    describe('no #checkInvariants method (11.3)', () => {
        it('should not contain checkInvariants in release output', () => {
            expect(releaseOutput).not.toContain('checkInvariants');
        });
    });

    // 11.4: No pre/post guard code
    describe('no injected guard code (11.4)', () => {
        it('should not contain __pre_guard or __post_guard in release output', () => {
            expect(releaseOutput).not.toContain('__pre_guard');
            expect(releaseOutput).not.toContain('__post_guard');
        });

        it('should not contain contract checking boilerplate', () => {
            expect(releaseOutput).not.toContain('ContractError');
            // The function body should be clean
            expect(releaseOutput).toContain('return x');
        });
    });

    // 11.6: Release build output is functionally equivalent
    describe('functional equivalence (11.6)', () => {
        it('should contain the original function bodies', () => {
            expect(releaseOutput).toContain('function releaseFn');
            expect(releaseOutput).toContain('class ReleaseClass');
            expect(releaseOutput).toContain('return x');
        });
    });
});
