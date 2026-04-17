# Task 6: Create `test/v090-acceptance.test.ts` — Infrastructure

**Part of:** [v0.9.0 Acceptance Tests Implementation Plan](2026-04-17-v090-acceptance.md)

**Files:**
- Create: `test/v090-acceptance.test.ts`

This task creates the file with the `compileAndRun` helper and empty describe shells.
Test cases are added in Tasks 7–10.

- [ ] **Step 1: Create `test/v090-acceptance.test.ts`**

```typescript
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
    function compileAndRun(
        fixture: string,
        testName: string,
        testCall?: string,
    ): { output: string; compiled: string; exitCode: number; success: boolean } {
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
                strict: true,
                plugins: [{ transform: transformerPath }],
            },
            include: ['src/**/*.ts'],
        };
        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

        // Run tsc from project root so node_modules/.bin/tsc is resolvable.
        const projectRoot = path.join(__dirname, '..');
        const tscResult = spawnSync('npx', ['tsc', '-p', testDir], {
            cwd: projectRoot,
            encoding: 'utf-8',
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

        // Runner lives in outDir so require('./<testName>') resolves to the compiled file.
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

    // ── Sections added in Tasks 7–10 ────────────────────────────────────────
});
```

- [ ] **Step 2: Verify the file compiles cleanly (no tests yet)**

```bash
npm run typecheck
```

Expected: exits 0, no errors.
