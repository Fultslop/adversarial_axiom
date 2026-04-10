import {execSync} from 'child_process';
import * as os from 'os';
import * as fs from 'fs';

describe('Phase 2: Known limitation gap tests', () => {

    let buildOutput: string;

    beforeAll(() => {
        const logFile = `${os.tmpdir()}/axiom_gaps_${Date.now()}.log`;
        execSync(`cmd.exe /c "scripts\\build-dev.bat ${logFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        buildOutput = fs.readFileSync(logFile, 'utf8');
    });

    // 1.23: Destructured parameter — binding names not recognised
    describe('destructured parameter (1.23)', () => {
        it('should warn that x is not a known parameter', () => {
            expect(buildOutput).toContain('destructuredPre');
            expect(buildOutput).toContain('x');
            expect(buildOutput).toContain('[axiom]');
        });
    });

    // 1.26: Template literal — type mismatch not detected
    describe('template literal (1.26)', () => {
        it('should not detect type mismatch with template literal', () => {
            // The transformer should NOT emit a type-mismatch warning for template literals
            // (Limitation #6). If it did, this test would catch it.
            expect(buildOutput).not.toContain('templateLiteralPre');
        });
    });

    // 2.12: Non-primitive return — result omitted from type map
    describe('non-primitive return (2.12, 8.3)', () => {
        it('should not emit type-mismatch warning for non-primitive return', () => {
            // The @post result === "ok" on Record<string, unknown> should NOT
            // trigger a type-mismatch warning (result is not typed for non-primitives)
            expect(buildOutput).not.toContain('nonPrimitivePost');
        });
    });

    // 8.4: Union-typed param — type mismatch not detected
    describe('union-typed param (8.4)', () => {
        it('should not emit type-mismatch warning for union type', () => {
            // amount === "zero" on number | undefined should NOT trigger warning
            expect(buildOutput).not.toContain('unionTypePre');
        });
    });

    // 8.6: Unary operand — type mismatch not detected
    describe('unary operand (8.6)', () => {
        it('should not emit type-mismatch warning for unary expression', () => {
            // -amount > 0 on string param should NOT trigger warning
            expect(buildOutput).not.toContain('unaryOperandPre');
        });
    });

    // 8.7: Compound conditions — type narrowing not considered
    describe('compound conditions (8.7)', () => {
        it('should not use type narrowing from sibling clause', () => {
            // amount !== undefined && amount === "zero" — second clause should NOT
            // get type narrowing from first
            expect(buildOutput).not.toContain('compoundNarrowingPre');
        });
    });

    // 9.7: Non-whitelisted global Math — warns
    describe('Math global (9.7)', () => {
        it('should warn that Math is not a known parameter', () => {
            expect(buildOutput).toContain('mathGlobalPre');
            expect(buildOutput).toContain('Math');
        });
    });

    // 9.9: Enum reference — warns as unknown identifier
    describe('enum reference (9.9)', () => {
        it('should warn that Status is not a known parameter', () => {
            expect(buildOutput).toContain('enumReferencePre');
            expect(buildOutput).toContain('Status');
        });
    });

    // 9.10: Module-level constant — warns as unknown identifier
    describe('module constant (9.10)', () => {
        it('should warn that MAX_LIMIT is not a known parameter', () => {
            expect(buildOutput).toContain('moduleConstantPre');
            expect(buildOutput).toContain('MAX_LIMIT');
        });
    });

    // 8.5: Multi-level property chain — only root checked
    describe('multi-level property chain (8.5)', () => {
        it('should only check root this, not intermediate properties', () => {
            // this.config.limit — only 'this' is scope-checked
            // No warning should be emitted for config or limit
            expect(buildOutput).not.toContain('MultiLevelAccess');
        });
    });
});
