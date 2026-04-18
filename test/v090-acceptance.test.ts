// v0.9.0 Acceptance Tests
// Full-program mode: each fixture is written to disk, compiled with tsc+transformer,
// then the compiled JS is optionally executed to verify runtime behaviour.
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('v0.9.0 Acceptance Tests', () => {
    const testDir = path.join(__dirname, '..', 'temp-v090-acceptance');
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
     *
     * @param fixture  - TypeScript source to compile.
     * @param testName - Used as the filename stem (src/<testName>.ts → dist/<testName>.js)
     *                   and as the export name in the runner.
     * @param testCall - JS expression to evaluate, e.g. "arrowWithPre(-1)".
     *                   When undefined, compilation output is returned but nothing is executed.
     */
    function _compileAndRun(
        fixture: string,
        testName: string,
        testCall?: string,
    ): { output: string; compiled: string; exitCode: number; success: boolean } {
        const srcFile = path.join(srcDir, `${testName}.ts`);
        // Without rootDir, TS computes common root as src/ → output lands in outDir directly.
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

        // tspc (ts-patch) is required so the transformer plugin is actually applied.
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
            };
        }

        const compiled = fs.readFileSync(outFile, 'utf-8');

        if (testCall === undefined) {
            return { output: '', compiled, exitCode: 0, success: true };
        }

        // Runner lives in outDir so require('./<testName>') resolves to dist/<testName>.js
        const testRunner = path.join(outDir, `${testName}_runner.js`);
        fs.writeFileSync(testRunner, `
const { ${testName} } = require('./${testName}');
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
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const compileAndRun: typeof _compileAndRun = _compileAndRun;

    // ==========================================
    // A. Arrow & Function Expressions
    // ==========================================
    describe('Arrow & Function Expressions', () => {

        it('A1: should inject @pre guard on exported arrow (location = variable name)', () => {
            const fixture = `
/** @pre x > 0 */
export const arrowWithPre = (x: number): number => x;
`;
            const result = compileAndRun(fixture, 'arrowWithPre');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');
            expect(result.compiled).toContain('"arrowWithPre"');

            const violation = compileAndRun(fixture, 'arrowWithPre', 'arrowWithPre(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');

            const valid = compileAndRun(fixture, 'arrowWithPre', 'arrowWithPre(1)');
            expect(valid.output).toContain('RESULT: 1');
        });

        it('A2: should inject @post guard on exported arrow', () => {
            const fixture = `
/** @post result > 0 */
export const arrowWithPost = (x: number): number => x * 2;
`;
            const result = compileAndRun(fixture, 'arrowWithPost');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("POST"');

            const valid = compileAndRun(fixture, 'arrowWithPost', 'arrowWithPost(2)');
            expect(valid.output).toContain('RESULT: 4');
        });

        it('A3: should inject both @pre and @post on arrow function', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 1
 */
export const arrowWithPreAndPost = (x: number): number => x + 1;
`;
            const result = compileAndRun(fixture, 'arrowWithPreAndPost');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);

            const violation = compileAndRun(fixture, 'arrowWithPreAndPost', 'arrowWithPreAndPost(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');

            const valid = compileAndRun(fixture, 'arrowWithPreAndPost', 'arrowWithPreAndPost(1)');
            expect(valid.output).toContain('RESULT: 2');
        });

        it('A4: should normalise expression body to block body for @post result capture', () => {
            const fixture = `
/** @post result > 0 */
export const expressionBodyArrow = (x: number): number => x * 2;
`;
            const result = compileAndRun(fixture, 'expressionBodyArrow');
            expect(result.success).toBe(true);
            // Block-body normalisation: compiled must have an explicit return statement
            expect(result.compiled).toContain('return');
            // result variable must be captured (not bare expression body)
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });

        it('A5: should use variable name as location for named function expression', () => {
            const fixture = `
/** @pre x > 0 */
export const namedFuncExpr = function add(x: number): number {
    return x + 1;
};
`;
            const result = compileAndRun(fixture, 'namedFuncExpr');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('"namedFuncExpr"');
            expect(result.compiled).not.toContain('"add"');
        });

        it('A7: should handle arrow with destructured params', () => {
            const fixture = `
/** @pre x > 0 */
export const arrowWithDestruct = ({ x, y }: { x: number; y: number }): number => x + y;
`;
            const result = compileAndRun(fixture, 'arrowWithDestruct');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');

            const violation = compileAndRun(fixture, 'arrowWithDestruct', 'arrowWithDestruct({ x: 0, y: 3 })');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('A8: should warn and skip guard for unknown identifier in contract', () => {
            const fixture = `
/** @pre unknownVar > 0 */
export const arrowWithUnknownId = (x: number): number => x;
`;
            const result = compileAndRun(fixture, 'arrowWithUnknownId');
            expect(result.success).toBe(true);
            expect(result.compiled).not.toContain('unknownVar');
        });

        it('A9: should inject multiple @pre guards', () => {
            const fixture = `
/**
 * @pre a > 0
 * @pre b > 0
 */
export const arrowWithMultiplePre = (a: number, b: number): number => a + b;
`;
            const result = compileAndRun(fixture, 'arrowWithMultiplePre');
            expect(result.success).toBe(true);
            const preCount = (result.compiled.match(/ContractViolationError\("PRE"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(2);
        });

        it('A10: should drop @post with warning for void-return arrow', () => {
            const fixture = `
/** @post result === undefined */
export const arrowVoidWithPost = (msg: string): void => { console.log(msg); };
`;
            const result = compileAndRun(fixture, 'arrowVoidWithPost');
            expect(result.success).toBe(true);
            expect(result.compiled).not.toContain('result === undefined');
        });

        it('A11: should handle ternary expression body', () => {
            const fixture = `
/** @post result >= 0 */
export const arrowWithTernary = (x: number): number => x > 0 ? x * 2 : 0;
`;
            const result = compileAndRun(fixture, 'arrowWithTernary');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });

        it('A12: should handle function expression with @pre and @post', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 0
 */
export const funcExprWithContracts = function(x: number): number {
    return x * 2;
};
`;
            const result = compileAndRun(fixture, 'funcExprWithContracts');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });
    });

    // ==========================================
    // B. Async Functions
    // ==========================================
    describe('Async Functions', () => {

        it('B1: should inject @pre guard synchronously before async body', () => {
            const fixture = `
/** @pre x > 0 */
export async function asyncWithPre(x: number): Promise<number> {
    return x;
}
`;
            const result = compileAndRun(fixture, 'asyncWithPre');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');

            const violation = compileAndRun(fixture, 'asyncWithPre', 'asyncWithPre(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('B2: should check resolved value (not Promise object) for @post', () => {
            const fixture = `
/** @post result > 0 */
export async function asyncWithPost(x: number): Promise<number> {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'asyncWithPost');
            expect(result.success).toBe(true);
            // Async post wraps body in an immediately-invoked async function
            expect(result.compiled).toContain('async ()');
            expect(result.compiled).toContain('ContractViolationError("POST"');

            const valid = compileAndRun(fixture, 'asyncWithPost', 'asyncWithPost(2)');
            expect(valid.output).toContain('RESULT: 4');
        });

        it('B3: should drop @post with warning for Promise<void>', () => {
            const fixture = `
/** @post result === undefined */
export async function asyncVoidWithPost(msg: string): Promise<void> {
    console.log(msg);
}
`;
            const result = compileAndRun(fixture, 'asyncVoidWithPost');
            expect(result.success).toBe(true);
            expect(result.compiled).not.toContain('result === undefined');
        });

        it('B4: should capture @prev synchronously before async body', () => {
            const fixture = `
/**
 * @prev { x }
 * @post result === prev.x + 1
 */
export async function asyncWithPrev(x: number): Promise<number> {
    return x + 1;
}
`;
            const result = compileAndRun(fixture, 'asyncWithPrev');
            expect(result.success).toBe(true);
            // prev capture must appear before the async body wrapper
            expect(result.compiled).toContain('{ x }');
            expect(result.compiled).toContain('prev.x + 1');

            const valid = compileAndRun(fixture, 'asyncWithPrev', 'asyncWithPrev(5)');
            expect(valid.output).toContain('RESULT: 6');
        });

        it('B5: should handle async arrow function with @pre and @post', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 0
 */
export const asyncArrow = async (x: number): Promise<number> => x;
`;
            const result = compileAndRun(fixture, 'asyncArrow');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');
            expect(result.compiled).toContain('ContractViolationError("POST"');

            const violation = compileAndRun(fixture, 'asyncArrow', 'asyncArrow(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('B6: should handle async function expression with @pre', () => {
            const fixture = `
/** @pre x > 0 */
export const asyncFuncExpr = async function(x: number): Promise<number> {
    return x;
};
`;
            const result = compileAndRun(fixture, 'asyncFuncExpr');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError("PRE"');

            const violation = compileAndRun(fixture, 'asyncFuncExpr', 'asyncFuncExpr(-1)');
            expect(violation.output).toContain('ERROR: ContractViolationError');
        });

        it('B7: should handle multiple @post on async function', () => {
            const fixture = `
/**
 * @post result > 0
 * @post result % 2 === 0
 */
export async function asyncWithMultiplePost(x: number): Promise<number> {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'asyncWithMultiplePost');
            expect(result.success).toBe(true);
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(postCount).toBeGreaterThanOrEqual(2);
        });

        it('B8: should not evaluate @post when async body throws', () => {
            const fixture = `
/** @post result > 0 */
export async function asyncWithThrow(x: number): Promise<number> {
    if (x < 0) throw new Error('fail');
    return x;
}
`;
            const result = compileAndRun(fixture, 'asyncWithThrow');
            expect(result.success).toBe(true);
            // Both throw paths present in compiled output
            expect(result.compiled).toContain('throw new Error');
            expect(result.compiled).toContain('ContractViolationError("POST"');
        });

        it('B9: async class method uses default @prev (shallow clone of this)', () => {
            const fixture = `
export class AsyncClass {
    public count: number = 0;
    /** @post this.count === prev.count + 1 */
    async increment(): Promise<number> {
        this.count++;
        return this.count;
    }
}
`;
            const result = compileAndRun(fixture, 'AsyncClass');
            expect(result.success).toBe(true);
            // Default prev capture for methods is a shallow clone of this
            expect(result.compiled).toContain('{ ...this }');
            // Post guard references prev.count
            expect(result.compiled).toContain('prev.count');
        });
    });

    // ==========================================
    // C. keepContracts Logic
    // ==========================================
    describe('keepContracts', () => {

        it('C1: should inject require(@fultslop/axiom) when contracts are present', () => {
            const fixture = `
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsTest(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsTest');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('require("@fultslop/axiom")');
        });

        it('C2: file-level "keepContracts post" on Line 1 keeps @post, strips @pre', () => {
            const fixture = `// @axiom keepContracts post
/**
 * @pre x > 0
 * @post result > 0
 */
export function fileOverridePost(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'fileOverridePost');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBe(0);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C3: file-level override on Line 2+ is ignored — both guards active', () => {
            const fixture = `
// @axiom keepContracts post  (on line 2 — must be ignored)
/**
 * @pre x > 0
 * @post result > 0
 */
export function fileOverrideIgnored(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'fileOverrideIgnored');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C4: "keepContracts true" keeps both @pre and @post', () => {
            const fixture = `// @axiom keepContracts true
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsTrue(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsTrue');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C5: "keepContracts all" keeps both @pre and @post (same as true)', () => {
            const fixture = `// @axiom keepContracts all
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsAll(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsAll');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBeGreaterThanOrEqual(1);
        });

        it('C6: "keepContracts pre" keeps @pre only, strips @post', () => {
            const fixture = `// @axiom keepContracts pre
/**
 * @pre x > 0
 * @post result > 0
 */
export function keepContractsPre(x: number): number {
    return x * 2;
}
`;
            const result = compileAndRun(fixture, 'keepContractsPre');
            expect(result.success).toBe(true);
            const preCount  = (result.compiled.match(/ContractViolationError\("PRE"/g)  ?? []).length;
            const postCount = (result.compiled.match(/ContractViolationError\("POST"/g) ?? []).length;
            expect(preCount).toBeGreaterThanOrEqual(1);
            expect(postCount).toBe(0);
        });

        it('C7: "keepContracts invariant" keeps @invariant only, strips @pre/@post', () => {
            const fixture = `// @axiom keepContracts invariant
/**
 * @invariant this.value > 0
 */
export class KeepInvariantOnly {
    public value: number;
    constructor(value: number) { this.value = value; }
    /** @pre x > 0 */
    public add(x: number): number {
        this.value += x;
        return this.value;
    }
}
`;
            const result = compileAndRun(fixture, 'KeepInvariantOnly');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('InvariantViolationError');
            const preCount = (result.compiled.match(/ContractViolationError\("PRE"/g) ?? []).length;
            expect(preCount).toBe(0);
        });
    });

    // ==========================================
    // D. Regression Tests
    // ==========================================
    describe('Regression Tests', () => {

        it('D1: existing sync @post pattern still works', () => {
            const fixture = `
/**
 * @pre produce().length > 0
 * @post result === produce().length || result < 0
 */
export function regressionProduceFn(produce: () => number[]): number {
    const x = produce();
    return x.length % 2 === 0 ? x.length : -1;
}
`;
            const result = compileAndRun(fixture, 'regressionProduceFn');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError');
        });

        it('D2: existing class invariant pattern still works', () => {
            const fixture = `
/**
 * @invariant this.value > 0
 */
export class RegressionClass {
    public value: number;
    constructor(value: number) { this.value = value; }
    /** @pre x > 0 */
    public add(x: number): number {
        this.value += x;
        return this.value;
    }
}
`;
            const result = compileAndRun(fixture, 'RegressionClass');
            expect(result.success).toBe(true);
            expect(result.compiled).toContain('ContractViolationError');
            expect(result.compiled).toContain('InvariantViolationError');
        });

        it('D3: @prev on synchronous function captures state before body', () => {
            const fixture = `
/**
 * @prev { x }
 * @post result === prev.x + 1
 */
export function syncWithPrev(x: number): number {
    return x + 1;
}
`;
            const result = compileAndRun(fixture, 'syncWithPrev');
            expect(result.success).toBe(true);
            // Prev captured before body
            expect(result.compiled).toContain('{ x }');
            // Post guard uses prev.x
            expect(result.compiled).toContain('prev.x + 1');

            const valid = compileAndRun(fixture, 'syncWithPrev', 'syncWithPrev(5)');
            expect(valid.output).toContain('RESULT: 6');
        });
    });
});
