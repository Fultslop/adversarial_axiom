// Closures Acceptance Tests — Phase A: Happy Path Validation
// Tests inner function/arrow declarations with @pre/@post/@invariant tags.
// Uses compileAndRun helper: writes fixture to disk, compiles with tspc+transformer, optionally executes.
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Closures Phase A — Happy Path Validation', () => {
    const testDir = path.join(__dirname, '..', 'temp-closures-phase-a');
    const srcDir  = path.join(testDir, 'src');
    const outDir  = path.join(testDir, 'dist');

    beforeAll(() => {
        fs.mkdirSync(srcDir, { recursive: true });
        fs.mkdirSync(outDir, { recursive: true });
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    /**
     * Compile a TypeScript fixture with the axiom transformer and optionally run it.
     */
    function compileAndRun(
        fixture: string,
        testName: string,
        testCall?: string,
    ): { output: string; compiled: string; exitCode: number; success: boolean; stderr: string } {
        const srcFile = path.join(srcDir, `${testName}.ts`);
        const outFile = path.join(outDir, `${testName}.js`);

        fs.writeFileSync(srcFile, fixture);

        const transformerPath = path.join(
            __dirname, '..', 'node_modules', '@fultslop', 'axiom', 'dist', 'src', 'transformer.js',
        );
        const tsconfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                outDir: './dist',
                rootDir: './src',
                strict: true,
                plugins: [{ transform: transformerPath, diagnostics: true }],
            },
            include: ['src/**/*.ts'],
        };
        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

        const tscResult = spawnSync('npx', ['tspc'], {
            cwd: testDir,
            encoding: 'utf-8',
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (tscResult.status !== 0) {
            return {
                output: tscResult.stderr || tscResult.stdout || '',
                compiled: '',
                exitCode: tscResult.status ?? 1,
                success: false,
                stderr: tscResult.stderr || '',
            };
        }

        const compiled = fs.readFileSync(outFile, 'utf-8');

        if (testCall === undefined) {
            return { output: '', compiled, exitCode: 0, success: true, stderr: '' };
        }

        const testRunner = path.join(outDir, `${testName}_runner.js`);
        fs.writeFileSync(testRunner, `
Object.assign(global, require('./${testName}'));
async function main() {
    try {
        const result = await (${testCall});
        console.log('RESULT:', JSON.stringify(result));
    } catch (e) {
        console.log('ERROR:', e.constructor.name, e.message);
    }
}
main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
`);

        const runResult = spawnSync('node', [testRunner], {
            cwd: outDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        return {
            output: runResult.stdout || runResult.stderr || '',
            compiled,
            exitCode: runResult.status ?? 0,
            success: true,
            stderr: '',
        };
    }

    // ==========================================
    // CL-A1: Named inner function — @pre injected
    // ==========================================
    it('CL-A1: Named inner function — @pre injected', () => {
        const fixture = `
export function processItems(items: string[]): string[] {
    /** @pre item.length > 0 */
    function sanitise(item: string): string {
        return item.trim();
    }
    return items.map(sanitise);
}
`;
        const result = compileAndRun(fixture, 'clA1');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"processItems > sanitise"');

        const violation = compileAndRun(fixture, 'clA1', 'processItems(["", "x"])');
        expect(violation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-A2: Named inner function — @post with result injected
    // ==========================================
    it('CL-A2: Named inner function — @post with result injected', () => {
        const fixture = `
export function outer(): (x: number) => number {
    /** @post result.length > 0 */
    function makeAdder(base: number): string {
        return String(base);
    }
    return (x) => x;
}
`;
        const result = compileAndRun(fixture, 'clA2');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("POST"');
        expect(result.compiled).toContain('"outer > makeAdder"');
    });

    // ==========================================
    // CL-A3: const arrow in outer body — @pre injected
    // ==========================================
    it('CL-A3: const arrow in outer body — @pre injected', () => {
        const fixture = `
export function makeAdder(base: number): (x: number) => number {
    /** @pre x > 0 */
    const add = (x: number): number => base + x;
    return add;
}
`;
        const result = compileAndRun(fixture, 'clA3');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"makeAdder > add"');

        const violation = compileAndRun(fixture, 'clA3', 'makeAdder(10)(-1)');
        expect(violation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-A4: const function expression in outer body — @pre injected
    // ==========================================
    it('CL-A4: const function expression in outer body — @pre injected', () => {
        const fixture = `
export function outer(n: number): number {
    /** @pre n > 0 */
    const square = function(n: number): number { return n * n; };
    return square(n);
}
`;
        const result = compileAndRun(fixture, 'clA4');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > square"');

        const violation = compileAndRun(fixture, 'clA4', 'outer(-1)');
        expect(violation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-A5: Returned arrow function — @pre injected
    // ==========================================
    it('CL-A5: Returned arrow function — @pre injected', () => {
        const fixture = `
export function makeAdder(base: number): (x: number) => number {
    /** @pre x > 0 */
    return (x: number): number => base + x;
}
`;
        const result = compileAndRun(fixture, 'clA5');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"makeAdder > (anonymous)"');

        const violation = compileAndRun(fixture, 'clA5', 'makeAdder(10)(-1)');
        expect(violation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-A6: Both outer and inner contracts independently injected
    // ==========================================
    it('CL-A6: Both outer and inner contracts independently injected', () => {
        const fixture = `
/** @pre items.length > 0 */
export function processItems(items: string[]): string[] {
    /** @pre item.length > 0 */
    function sanitise(item: string): string {
        return item.trim();
    }
    return items.map(sanitise);
}
`;
        const result = compileAndRun(fixture, 'clA6');
        expect(result.success).toBe(true);
        const preCount = (result.compiled.match(/ContractViolationError\("PRE"/g) ?? []).length;
        expect(preCount).toBe(2);
        expect(result.compiled).toContain('"processItems"');
        expect(result.compiled).toContain('"processItems > sanitise"');

        const outerViolation = compileAndRun(fixture, 'clA6', 'processItems([])');
        expect(outerViolation.output).toContain('ERROR: ContractViolationError');

        const innerViolation = compileAndRun(fixture, 'clA6', 'processItems([""])');
        expect(innerViolation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-A7: Inner function in class method body — @pre injected
    // ==========================================
    it('CL-A7: Inner function in class method body — @pre injected', () => {
        const fixture = `
export class Processor {
    public process(items: string[]): string[] {
        /** @pre item.length > 0 */
        function sanitise(item: string): string {
            return item.trim();
        }
        return items.map(sanitise);
    }
}
`;
        const result = compileAndRun(fixture, 'clA7');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"Processor.process > sanitise"');

        const violation = compileAndRun(fixture, 'clA7', 'new Processor().process([""])');
        expect(violation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-A8: require('@fultslop/axiom') injected when inner has contracts
    // ==========================================
    it('CL-A8: require(\'@fultslop/axiom\') injected when inner has contracts', () => {
        const fixture = `
export function outer(): void {
    /** @pre x > 0 */
    function inner(x: number): number { return x; }
    inner(1);
}
`;
        const result = compileAndRun(fixture, 'clA8');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('require("@fultslop/axiom")');
        // Should appear exactly once (deduplication)
        const requireCount = (result.compiled.match(/require\s*\(\s*["']@fultslop\/axiom["']\s*\)/g) ?? []).length;
        expect(requireCount).toBe(1);
    });

    // ==========================================
    // CL-A9: No injection for untagged inner function
    // ==========================================
    it('CL-A9: No injection for untagged inner function', () => {
        const fixture = `
export function outer(): number {
    function inner(n: number): number { return n * 2; }
    return inner(2);
}
`;
        const result = compileAndRun(fixture, 'clA9');
        expect(result.success).toBe(true);
        expect(result.compiled).not.toContain('ContractViolationError');
        expect(result.compiled).not.toContain('require("@fultslop/axiom")');
    });
});
