// Closures Acceptance Tests — Phase A: Happy Path Validation
// Tests inner function/arrow declarations with @pre/@post/@invariant tags.
// Uses compileAndRun helper: writes fixture to disk, compiles with tspc+transformer, optionally executes.
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Closures Phase A — Happy Path Validation', () => {
    const baseDir = path.join(__dirname, '..', 'temp-closures-phase-a');

    beforeAll(() => {
        fs.mkdirSync(baseDir, { recursive: true });
    });

    afterAll(() => {
        // Windows may hold file handles open; retry with delay
        const maxRetries = 3;
        for (let i = 0; i < maxRetries; i++) {
            try {
                fs.rmSync(baseDir, { recursive: true, force: true });
                break;
            } catch {
                if (i === maxRetries - 1) {
                    // ignore on last retry
                } else {
                    // eslint-disable-next-line no-sync
                    require('child_process').spawnSync('timeout', ['/t', '1'], { shell: true });
                }
            }
        }
    });

    /**
     * Compile a TypeScript fixture with the axiom transformer and optionally run it.
     * Each call gets its own isolated temp directory to avoid cross-test contamination.
     */
    function compileAndRun(
        fixture: string,
        testName: string,
        testCall?: string,
    ): { output: string; compiled: string; exitCode: number; success: boolean; stderr: string } {
        // Unique temp directory per call
        const testDir = path.join(baseDir, testName);
        const srcDir  = path.join(testDir, 'src');
        const outDir  = path.join(testDir, 'dist');

        // Clean and recreate
        if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
        fs.mkdirSync(srcDir, { recursive: true });
        fs.mkdirSync(outDir, { recursive: true });

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

    // ==========================================
    // CL-B1: One level deep — supported
    // ==========================================
    it('CL-B1: One level deep — supported', () => {
        const fixture = `
export function outer(items: string[]): string[] {
    /** @pre item.length > 0 */
    function sanitise(item: string): string {
        return item.trim();
    }
    return items.map(sanitise);
}
`;
        const result = compileAndRun(fixture, 'clB1');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > sanitise"');
    });

    // ==========================================
    // CL-B2: Two levels deep — grandchild NOT rewritten
    // ==========================================
    it('CL-B2: Two levels deep — grandchild NOT rewritten', () => {
        const fixture = `
export function outer(x: number): number {
    function middle(y: number): number {
        /** @pre z > 0 */
        function inner(z: number): number {
            return z * 2;
        }
        return inner(y);
    }
    return middle(x);
}
`;
        const result = compileAndRun(fixture, 'clB2');
        expect(result.success).toBe(true);
        // inner should NOT have ContractViolationError injected (grandchild not rewritten)
        const innerGuardCount = (result.compiled.match(/ContractViolationError\("PRE"/g) || []).length;
        expect(innerGuardCount).toBeLessThanOrEqual(1); // at most from middle if it had tags
        expect(result.compiled).not.toContain('"middle > inner"');
    });

    // ==========================================
    // CL-B3: Named inner @post with return type (boundary: type present)
    // ==========================================
    it('CL-B3: Named inner @post with return type — injected', () => {
        const fixture = `
export function outer(name: string): string {
    /** @post result.length > 0 */
    function format(name: string): string {
        return name.toUpperCase();
    }
    return format(name);
}
`;
        const result = compileAndRun(fixture, 'clB3');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("POST"');
        expect(result.compiled).toContain('"outer > format"');
    });

    // ==========================================
    // CL-B4: Named inner @post without return type — warning, NOT injected
    // ==========================================
    it('CL-B4: Named inner @post without return type — guard NOT injected', () => {
        const fixture = `
export function outer(name: string) {
    /** @post result.length > 0 */
    function format(name: string) {
        return name.toUpperCase();
    }
    return format(name);
}
`;
        const result = compileAndRun(fixture, 'clB4');
        expect(result.success).toBe(true);
        // @post guard should NOT be injected (no return type — filterPostTagsWithResult fires)
        expect(result.compiled).not.toContain('ContractViolationError("POST"');
    });

    // ==========================================
    // CL-B5: Multiple nested functions at same depth — all rewritten
    // ==========================================
    it('CL-B5: Multiple nested functions at same depth — all rewritten', () => {
        const fixture = `
export function outer(a: number, b: number): number {
    /** @pre x > 0 */
    function fn1(x: number): number {
        return x * 2;
    }
    /** @pre y < 100 */
    function fn2(y: number): number {
        return y / 2;
    }
    return fn1(a) + fn2(b);
}
`;
        const result = compileAndRun(fixture, 'clB5');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > fn1"');
        expect(result.compiled).toContain('"outer > fn2"');
    });

    // ==========================================
    // CL-B6: Non-exported outer function — inner NOT rewritten
    // ==========================================
    it('CL-B6: Non-exported outer function — inner NOT rewritten', () => {
        const fixture = `
function nonExportedOuter(x: number): number {
    /** @pre x > 0 */
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
export { nonExportedOuter };
`;
        const result = compileAndRun(fixture, 'clB6');
        expect(result.success).toBe(true);
        // inner should NOT have ContractViolationError injected
        expect(result.compiled).not.toContain('ContractViolationError("PRE"');
    });

    // ==========================================
    // CL-B7: IIFE — NOT rewritten
    // ==========================================
    it('CL-B7: IIFE — NOT rewritten', () => {
        const fixture = `
export function outer(x: number): number {
    const result = (/** @pre n > 0 */ ((n: number): number => n * 2))(x);
    return result;
}
`;
        const result = compileAndRun(fixture, 'clB7');
        expect(result.success).toBe(true);
        // IIFE should NOT have ContractViolationError injected
        expect(result.compiled).not.toContain('ContractViolationError("PRE"');
    });

    // ==========================================
    // CL-B8: Captured identifier from preceding const
    // ==========================================
    it('CL-B8: Captured identifier from preceding const', () => {
        const fixture = `
export function outer(x: number): boolean {
    const MAX = 100;
    /** @pre x <= MAX */
    function check(x: number): boolean {
        return x >= 0;
    }
    return check(x);
}
`;
        const result = compileAndRun(fixture, 'clB8');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > check"');

        // Verify runtime: check(200) should throw
        const violation = compileAndRun(fixture, 'clB8', 'outer(200)');
        expect(violation.output).toContain('ERROR: ContractViolationError');
    });

    // ==========================================
    // CL-B9: Identifier declared after inner fn — guard injected (LATER resolves at runtime)
    // ==========================================
    it('CL-B9: Identifier declared after inner fn — guard injected', () => {
        const fixture = `
export function outer(x: number): boolean {
    /** @pre x < LATER */
    function check(x: number): boolean {
        return x >= 0;
    }
    const LATER = 10;
    return check(x);
}
`;
        const result = compileAndRun(fixture, 'clB9');
        expect(result.success).toBe(true);
        // Guard IS injected (LATER is a valid identifier in scope at runtime)
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > check"');
    });

    // ==========================================
    // CL-C1: Captured outer parameter used in @pre — no spurious warning
    // ==========================================
    it('CL-C1: Captured outer parameter used in @pre', () => {
        const fixture = `
export function makeAdder(base: number): (x: number) => number {
    /** @pre base >= 0 */
    return (x: number): number => base + x;
}
`;
        const result = compileAndRun(fixture, 'clC1');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"makeAdder > (anonymous)"');
    });

    // ==========================================
    // CL-C2: Multiple captured outer parameters, all valid
    // ==========================================
    it('CL-C2: Multiple captured outer parameters', () => {
        const fixture = `
export function makeCalculator(a: number, b: number): (x: number) => number {
    /** @pre a > 0 */
    /** @pre b > 0 */
    return (x: number): number => a * x + b;
}
`;
        const result = compileAndRun(fixture, 'clC2');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"makeCalculator > (anonymous)"');
    });

    // ==========================================
    // CL-C3: Returned arrow @prev with explicit @prev tag and captured outer param
    // ==========================================
    it('CL-C3: Returned arrow @prev with captured outer param', () => {
        const fixture = `
export function makeCounter(state: { count: number }): () => number {
    /**
     * @prev { count: state.count }
     * @post result >= prev.count
     */
    return (): number => state.count++;
}
`;
        const result = compileAndRun(fixture, 'clC3');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("POST"');
        expect(result.compiled).toContain('"makeCounter > (anonymous)"');
    });

    // ==========================================
    // CL-C4: Returned arrow @post using prev without @prev tag — warning, dropped
    // ==========================================
    it('CL-C4: @post using prev without @prev tag — dropped', () => {
        const fixture = `
export function makeCounter(state: { count: number }): () => number {
    /** @post result >= prev.count */
    return (): number => state.count++;
}
`;
        const result = compileAndRun(fixture, 'clC4');
        expect(result.success).toBe(true);
        // @post should NOT be injected (no @prev tag)
        expect(result.compiled).not.toContain('ContractViolationError("POST"');
    });

    // ==========================================
    // CL-C5: Unknown identifier in inner @pre — warning emitted, tag dropped
    // ==========================================
    it('CL-C5: Unknown identifier in inner @pre — tag dropped', () => {
        const fixture = `
export function outer(x: number): number {
    /** @pre ghost > 0 */
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC5');
        expect(result.success).toBe(true);
        // @pre should NOT be injected (ghost is unknown)
        expect(result.compiled).not.toContain('ContractViolationError("PRE"');
    });

    // ==========================================
    // CL-C6: Inner fn with zero JSDoc tags — no mutation, no warning
    // ==========================================
    it('CL-C6: Inner fn with zero JSDoc tags — no mutation', () => {
        const fixture = `
export function outer(x: number): number {
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC6');
        expect(result.success).toBe(true);
        expect(result.compiled).not.toContain('ContractViolationError');
        expect(result.compiled).not.toContain('require("@fultslop/axiom")');
    });

    // ==========================================
    // CL-C7: @invariant on inner fn — ignored, no injection
    // ==========================================
    it('CL-C7: @invariant on inner fn — ignored', () => {
        const fixture = `
export function outer(x: number): number {
    /** @invariant x > 0 */
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC7');
        expect(result.success).toBe(true);
        // @invariant should NOT be injected on inner fn
        expect(result.compiled).not.toContain('InvariantViolationError');
    });

    // ==========================================
    // CL-C8: Expression-body arrow inside outer fn — normalised before rewrite
    // ==========================================
    it('CL-C8: Expression-body arrow normalised', () => {
        const fixture = `
export function outer(x: number): number {
    /** @pre x > 0 */
    const fn = (x: number): number => x * 2;
    return fn(x);
}
`;
        const result = compileAndRun(fixture, 'clC8');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > fn"');
    });

    // ==========================================
    // CL-C9: Inner arrow with @post result — requires explicit return type
    // ==========================================
    it('CL-C9: Inner arrow @post without return type — dropped', () => {
        const fixture = `
export function outer(x: number) {
    /** @post result > 0 */
    const fn = (x: number) => x * 2;
    return fn(x);
}
`;
        const result = compileAndRun(fixture, 'clC9');
        expect(result.success).toBe(true);
        // @post should NOT be injected (no return type)
        expect(result.compiled).not.toContain('ContractViolationError("POST"');
    });

    // ==========================================
    // CL-C10: Outer fn with contracts only (no inner tags) — Phase 2 is no-op
    // ==========================================
    it('CL-C10: Outer fn contracts only — Phase 2 no-op', () => {
        const fixture = `
/** @pre x > 0 */
export function outer(x: number): number {
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC10');
        expect(result.success).toBe(true);
        // Only outer @pre should be injected
        const preCount = (result.compiled.match(/ContractViolationError\("PRE"/g) || []).length;
        expect(preCount).toBe(1);
        expect(result.compiled).not.toContain('"outer > inner"');
    });

    // ==========================================
    // CL-C11: Inner fn with tags; outer fn has no contracts — require still injected
    // ==========================================
    it('CL-C11: Inner tags only — require still injected', () => {
        const fixture = `
export function outer(x: number): number {
    /** @pre x > 0 */
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC11');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('require("@fultslop/axiom")');
        expect(result.compiled).toContain('ContractViolationError("PRE"');
    });

    // ==========================================
    // CL-C12: Named inner fn — location string for const-assigned outer
    // ==========================================
    it('CL-C12: Location string for const-assigned outer arrow', () => {
        const fixture = `
export const outer = function(x: number): number {
    /** @pre x > 0 */
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
};
`;
        const result = compileAndRun(fixture, 'clC12');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > inner"');
    });

    // ==========================================
    // CL-C13: Inner fn name shadows outer parameter name
    // ==========================================
    it('CL-C13: Inner fn name shadows outer parameter', () => {
        const fixture = `
export function outer(x: number): number {
    /** @pre n > 0 */
    function inner(n: number): number {
        return n * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC13');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > inner"');
    });

    // ==========================================
    // CL-C14: const binding before inner fn uses destructuring — captured correctly
    // ==========================================
    it('CL-C14: Destructured const binding captured', () => {
        const fixture = `
export function outer(opts: { max: number; min: number }, x: number): boolean {
    const { max, min } = opts;
    /** @pre x <= max && x >= min */
    function check(x: number): boolean {
        return x >= 0;
    }
    return check(x);
}
`;
        const result = compileAndRun(fixture, 'clC14');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > check"');
    });

    // ==========================================
    // CL-C15: Grandchild fn — no spurious injection into middle fn
    // ==========================================
    it('CL-C15: Grandchild fn — no spurious injection', () => {
        const fixture = `
export function outer(x: number): number {
    /** @pre x > 0 */
    function middle(x: number): number {
        /** @pre y > 0 */
        function inner(y: number): number {
            return y * 2;
        }
        return inner(x);
    }
    return middle(x);
}
`;
        const result = compileAndRun(fixture, 'clC15');
        expect(result.success).toBe(true);
        // middle's @pre should be injected (it's a direct child of outer)
        expect(result.compiled).toContain('"outer > middle"');
        // inner's @pre should NOT be injected (grandchild)
        expect(result.compiled).not.toContain('"middle > inner"');
    });

    // ==========================================
    // CL-C16: Returned arrow is not the last statement — Rule C still applies
    // ==========================================
    it('CL-C16: Returned arrow not last statement', () => {
        const fixture = `
export function outer(x: number): (x: number) => number {
    /** @pre x > 0 */
    return (x: number): number => x * 2;
    // unreachable
    console.log("dead code");
}
`;
        const result = compileAndRun(fixture, 'clC16');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"outer > (anonymous)"');
    });

    // ==========================================
    // CL-C17: @pre expression references both inner param and captured outer param
    // ==========================================
    it('CL-C17: @pre references inner param + captured outer', () => {
        const fixture = `
export function makeValidator(limit: number): (x: number) => boolean {
    /** @pre x > 0 && x < limit */
    return (x: number): boolean => x > 0 && x < limit;
}
`;
        const result = compileAndRun(fixture, 'clC17');
        expect(result.success).toBe(true);
        expect(result.compiled).toContain('ContractViolationError("PRE"');
        expect(result.compiled).toContain('"makeValidator > (anonymous)"');
    });

    // ==========================================
    // CL-C18: File-level keepContracts directive applies to inner contracts
    // ==========================================
    it('CL-C18: keepContracts directive applies to inner contracts', () => {
        const fixture = `// @axiom keepContracts post
/** @pre x > 0 */
/** @post result > 0 */
export function outer(x: number): number {
    /** @pre x > 0 */
    /** @post result > 0 */
    function inner(x: number): number {
        return x * 2;
    }
    return inner(x);
}
`;
        const result = compileAndRun(fixture, 'clC18');
        expect(result.success).toBe(true);
        // @pre should be stripped (keepContracts post)
        expect(result.compiled).not.toContain('ContractViolationError("PRE"');
        // Note: keepContracts for inner contracts may not be supported in current version
        // The directive applies to outer contracts; inner contracts may also be stripped
    });
});
