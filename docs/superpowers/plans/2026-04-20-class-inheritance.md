# Class Inheritance Contracts Acceptance Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a full acceptance test suite for class inheritance contract propagation in `@fultslop/axiom`, covering all 12 spec scenarios across happy path, boundary, and edge case categories.

**Architecture:** A single new test file `test/class-inheritance.test.ts` uses the same full-program compile-and-run infrastructure as `v090-acceptance.test.ts` — each fixture is written to disk as TypeScript, compiled via `tspc` + transformer, and executed via `node`. The helper is extended to return `compilationOutput` (stdout + stderr from compilation) so warning assertions can be made. A `compileAndRunMulti` helper supports the cross-file scenario.

**Tech Stack:** TypeScript, Jest, ts-patch (`tspc`), `@fultslop/axiom` transformer, `child_process.spawnSync`, Node.js `fs`.

**Phase analysis docs:**
- [Phase A — Happy Path](2026-04-20-class-inheritance-phase-a.md)
- [Phase B — Boundary Tests](2026-04-20-class-inheritance-phase-b.md)
- [Phase C — Edge Cases](2026-04-20-class-inheritance-phase-c.md)
- [Phase D — Scope Guard](2026-04-20-class-inheritance-phase-d.md)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `test/class-inheritance.test.ts` | All 21 acceptance tests + compileAndRun/compileAndRunMulti helpers |

---

## Task 1: Scaffold test file with helpers

**Files:**
- Create: `test/class-inheritance.test.ts`

- [ ] **Step 1: Confirm the transformer path is correct**

```bash
ls node_modules/@fultslop/axiom/dist/src/transformer.js
```

Expected: file exists. If not, check `node_modules/@fultslop/axiom/dist/` for the correct path.

- [ ] **Step 2: Create `test/class-inheritance.test.ts` with helper infrastructure**

```typescript
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';

describe('Class Inheritance Contracts', () => {
    const testDir = path.join(__dirname, '..', 'temp-class-inheritance');
    const srcDir  = path.join(testDir, 'src');
    const outDir  = path.join(testDir, 'dist');

    const transformerPath = path.join(
        __dirname, '..', 'node_modules', '@fultslop', 'axiom', 'dist', 'src', 'transformer.js',
    );

    beforeAll(() => {
        fs.mkdirSync(srcDir, { recursive: true });
        fs.mkdirSync(outDir, { recursive: true });
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    type CompileResult = {
        success: boolean;
        compiled: string;
        compilationOutput: string;
        exitCode: number;
        output: string;
    };

    function _compile(diagnostics = true): { stdout: string; stderr: string; status: number | null } {
        const tsconfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                outDir: './dist',
                rootDir: './src',
                strict: true,
                plugins: [{ transform: transformerPath, diagnostics }],
            },
            include: ['src/**/*.ts'],
        };
        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
        const r = spawnSync('npx', ['tspc'], {
            cwd: testDir,
            encoding: 'utf-8',
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status };
    }

    function _run(testName: string, testCall: string): string {
        const runner = path.join(outDir, `${testName}_runner.js`);
        fs.writeFileSync(runner, `
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
        const r = spawnSync('node', [runner], { cwd: outDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return r.stdout || r.stderr || '';
    }

    function compileAndRun(fixture: string, testName: string, testCall?: string): CompileResult {
        fs.writeFileSync(path.join(srcDir, `${testName}.ts`), fixture);
        const { stdout, stderr, status } = _compile();
        const compilationOutput = stdout + stderr;
        if (status !== 0) {
            return { success: false, compiled: '', compilationOutput, exitCode: status ?? 1, output: '' };
        }
        const compiled = fs.readFileSync(path.join(outDir, `${testName}.js`), 'utf-8');
        const output = testCall !== undefined ? _run(testName, testCall) : '';
        return { success: true, compiled, compilationOutput, exitCode: 0, output };
    }

    function compileAndRunMulti(
        files: Array<{ name: string; content: string }>,
        mainExport: string,
        testCall?: string,
    ): CompileResult {
        for (const { name, content } of files) {
            fs.writeFileSync(path.join(srcDir, `${name}.ts`), content);
        }
        const { stdout, stderr, status } = _compile();
        const compilationOutput = stdout + stderr;
        if (status !== 0) {
            return { success: false, compiled: '', compilationOutput, exitCode: status ?? 1, output: '' };
        }
        const compiled = fs.readFileSync(path.join(outDir, `${mainExport}.js`), 'utf-8');
        const output = testCall !== undefined ? _run(mainExport, testCall) : '';
        return { success: true, compiled, compilationOutput, exitCode: 0, output };
    }

    // ── Phase A: Happy Path ──────────────────────────────────────────────────
    // ── Phase B: Boundary Tests ──────────────────────────────────────────────
    // ── Phase C: Edge Cases ──────────────────────────────────────────────────
});
```

- [ ] **Step 3: Verify it typechecks**

```bash
npm run typecheck
```

Expected: exits 0, no errors.

---

## Task 2: Add Phase A — Happy Path Tests

**Files:**
- Modify: `test/class-inheritance.test.ts` (replace `// ── Phase A` comment with section below)

- [ ] **Step 1: Add Phase A tests**

Replace the `// ── Phase A: Happy Path` comment with:

```typescript
    // ── Phase A: Happy Path ──────────────────────────────────────────────────
    describe('Phase A: Happy Path', () => {

        it('CI-A1: @pre propagates from base to subclass — violation throws', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class DogInheritsPre extends Animal {
    feed(amount: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogInheritsPre', 'new DogInheritsPre().feed(-1)');
            expect(r.success).toBe(true);
            expect(r.compiled).toContain('ContractViolationError("PRE"');
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-A2: @pre propagates — valid call passes', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class DogValidPre extends Animal {
    feed(amount: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogValidPre', 'new DogValidPre().feed(5)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('RESULT:');
            expect(r.output).not.toContain('ERROR:');
        });

        it('CI-A3: @post propagates from base to subclass', () => {
            const fixture = `
class Animal {
    energy: number = 10;
    /** @post this.energy > 0 */
    feed(amount: number): void { this.energy = -1; }
}
export class DogInheritsPost extends Animal {
    feed(amount: number): void { this.energy = -1; }
}
`;
            const r = compileAndRun(fixture, 'DogInheritsPost', 'new DogInheritsPost().feed(1)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-A4: @invariant propagates from base to subclass', () => {
            const fixture = `
/** @invariant this.energy >= 0 */
class Animal {
    energy: number;
    constructor() { this.energy = 10; }
}
export class DogInheritsInvariant extends Animal {
    feed(): void { this.energy = -5; }
}
`;
            const r = compileAndRun(fixture, 'DogInheritsInvariant', 'new DogInheritsInvariant().feed()');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: InvariantViolationError');
        });

        it('CI-A5: additive merge — valid call passes both guards', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class DogAdditiveMergeValid extends Animal {
    /** @pre amount < 1000 */
    feed(amount: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogAdditiveMergeValid', 'new DogAdditiveMergeValid().feed(5)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('RESULT:');
            expect(r.output).not.toContain('ERROR:');
        });

        it('CI-A6: no contract injection on subclass-only method', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
    bark(): void {}
}
export class DogBarkNoContract extends Animal {
    bark(): void {}
}
`;
            const barkResult = compileAndRun(fixture, 'DogBarkNoContract', 'new DogBarkNoContract().bark()');
            expect(barkResult.success).toBe(true);
            expect(barkResult.output).not.toContain('ERROR:');

            const feedResult = compileAndRun(fixture, 'DogBarkNoContract', 'new DogBarkNoContract().feed(-1)');
            expect(feedResult.output).toContain('ERROR: ContractViolationError');
        });

    });
```

- [ ] **Step 2: Run Phase A tests**

```bash
npm test -- class-inheritance
```

Expected: all 6 Phase A tests pass. If CI-A3 or CI-A4 fail, note the actual error and report to the implementation team — do not modify the test assertions.

---

## Task 3: Add Phase B — Boundary Tests

**Files:**
- Modify: `test/class-inheritance.test.ts` (replace `// ── Phase B` comment)

- [ ] **Step 1: Add Phase B tests**

Replace the `// ── Phase B: Boundary Tests` comment with:

```typescript
    // ── Phase B: Boundary Tests ──────────────────────────────────────────────
    describe('Phase B: Boundary Tests', () => {

        const additiveMergeFixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class DogAdditive extends Animal {
    /** @pre amount < 1000 */
    feed(amount: number): void {}
}
`;

        it('CI-B1: additive merge — amount = -1 throws (violates Animal @pre)', () => {
            const r = compileAndRun(additiveMergeFixture, 'DogAdditive', 'new DogAdditive().feed(-1)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-B2: additive merge — amount = 0 throws (exact lower boundary)', () => {
            const r = compileAndRun(additiveMergeFixture, 'DogAdditive', 'new DogAdditive().feed(0)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-B3: additive merge — amount = 1 passes (minimum valid)', () => {
            const r = compileAndRun(additiveMergeFixture, 'DogAdditive', 'new DogAdditive().feed(1)');
            expect(r.success).toBe(true);
            expect(r.output).not.toContain('ERROR:');
        });

        it('CI-B4: additive merge — amount = 2000 throws (violates Dog @pre)', () => {
            const r = compileAndRun(additiveMergeFixture, 'DogAdditive', 'new DogAdditive().feed(2000)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-B5: additive merge — amount = 999 passes (maximum valid)', () => {
            const r = compileAndRun(additiveMergeFixture, 'DogAdditive', 'new DogAdditive().feed(999)');
            expect(r.success).toBe(true);
            expect(r.output).not.toContain('ERROR:');
        });

        it('CI-B6: additive merge — compile-time warning emitted', () => {
            const r = compileAndRun(additiveMergeFixture, 'DogAdditive');
            expect(r.success).toBe(true);
            expect(r.compilationOutput.toLowerCase()).toMatch(/merge|multiple.*pre|pre.*multiple/i);
        });

        it('CI-B7: three-way merge — amount = 42 throws (violates Dog @pre !== 42)', () => {
            const fixture = `
interface IAnimal {
    /** @pre amount > 0 */
    feed(amount: number): void;
}
class Animal implements IAnimal {
    /** @pre amount < 500 */
    feed(amount: number): void {}
}
export class DogThreeWay extends Animal implements IAnimal {
    /** @pre amount !== 42 */
    feed(amount: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogThreeWay', 'new DogThreeWay().feed(42)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-B8: three-way merge — amount = 501 throws (violates Animal @pre < 500)', () => {
            const fixture = `
interface IAnimal {
    /** @pre amount > 0 */
    feed(amount: number): void;
}
class Animal implements IAnimal {
    /** @pre amount < 500 */
    feed(amount: number): void {}
}
export class DogThreeWay501 extends Animal implements IAnimal {
    /** @pre amount !== 42 */
    feed(amount: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogThreeWay501', 'new DogThreeWay501().feed(501)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });

        it('CI-B9: parameter count mismatch — base contracts skipped, warning emitted', () => {
            const fixture = `
class Animal {
    /** @pre a > 0 */
    feed(a: number, b: number): void {}
}
export class DogParamCount extends Animal {
    feed(a: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogParamCount', 'new DogParamCount().feed(-1)');
            expect(r.success).toBe(true);
            expect(r.output).not.toContain('ERROR: ContractViolationError');
            expect(r.compilationOutput.toLowerCase()).toMatch(/skipped|param.*count|count.*param/i);
        });

    });
```

- [ ] **Step 2: Run Phase A + B tests**

```bash
npm test -- class-inheritance
```

Expected: all 15 tests pass. If any Phase B tests fail unexpectedly (e.g., CI-B6 or CI-B9 warning format mismatch), note the actual `compilationOutput` and report to the implementation team.

---

## Task 4: Add Phase C — Edge Case Tests (scenarios 7, 8, 12)

**Files:**
- Modify: `test/class-inheritance.test.ts` (replace `// ── Phase C` comment with the section below)

This task covers CI-C1, CI-C2, CI-C5, CI-C6. The cross-file test (CI-C3) and transpileModule test (CI-C4) are in Task 5.

- [ ] **Step 1: Add Phase C partial tests**

Replace the `// ── Phase C: Edge Cases` comment with:

```typescript
    // ── Phase C: Edge Cases ──────────────────────────────────────────────────
    describe('Phase C: Edge Cases', () => {

        it('CI-C1: param name mismatch rename mode — contract fires with new name', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class DogRenameParam extends Animal {
    feed(qty: number): void {}
}
`;
            const r = compileAndRun(fixture, 'DogRenameParam', 'new DogRenameParam().feed(-1)');
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
            expect(r.compilationOutput.toLowerCase()).toMatch(/rename|amount.*qty|qty.*amount/i);
        });

        it('CI-C2: param name mismatch ignore mode — contract skipped', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class DogIgnoreParam extends Animal {
    feed(qty: number): void {}
}
`;
            // Compile with interfaceParamMismatch: 'ignore' in the plugin options.
            // Write a custom tsconfig for this test.
            const tsconfig = {
                compilerOptions: {
                    target: 'ES2020',
                    module: 'commonjs',
                    outDir: './dist',
                    rootDir: './src',
                    strict: true,
                    plugins: [{
                        transform: transformerPath,
                        diagnostics: true,
                        interfaceParamMismatch: 'ignore',
                    }],
                },
                include: ['src/**/*.ts'],
            };
            fs.writeFileSync(path.join(srcDir, 'DogIgnoreParam.ts'), fixture);
            fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
            const tscResult = spawnSync('npx', ['tspc'], {
                cwd: testDir,
                encoding: 'utf-8',
                shell: true,
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            const compilationOutput = (tscResult.stdout || '') + (tscResult.stderr || '');
            expect(tscResult.status).toBe(0);
            const compiled = fs.readFileSync(path.join(outDir, 'DogIgnoreParam.js'), 'utf-8');
            // Contract skipped: compiled output must NOT contain the guard
            expect(compiled).not.toContain('ContractViolationError');
            expect(compilationOutput.toLowerCase()).toMatch(/skip|ignore/i);
        });

        it('CI-C5: non-goal — constructor @pre NOT inherited by subclass', () => {
            const fixture = `
class Animal {
    id: number;
    /** @pre id > 0 */
    constructor(id: number) { this.id = id; }
}
export class DogConstructorNonGoal extends Animal {
    constructor(id: number) { super(id); }
}
`;
            const r = compileAndRun(fixture, 'DogConstructorNonGoal', 'new DogConstructorNonGoal(-1)');
            expect(r.success).toBe(true);
            expect(r.output).not.toContain('ERROR: ContractViolationError');
        });

        it('CI-C6: non-goal — grandparent contracts NOT applied to grandchild', () => {
            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
class Dog extends Animal {
    feed(amount: number): void {}
}
export class Cat extends Dog {
    feed(amount: number): void {}
}
`;
            const r = compileAndRun(fixture, 'Cat', 'new Cat().feed(-1)');
            expect(r.success).toBe(true);
            expect(r.output).not.toContain('ERROR: ContractViolationError');
        });

    });
```

- [ ] **Step 2: Run Phase A + B + C tests**

```bash
npm test -- class-inheritance
```

Expected: all 19 tests pass.

---

## Task 5: Add CI-C3 (cross-file) and CI-C4 (transpileModule)

**Files:**
- Modify: `test/class-inheritance.test.ts` (add inside the Phase C describe, after CI-C6)

- [ ] **Step 1: Add CI-C3 (cross-file base class)**

Inside the `describe('Phase C: Edge Cases', () => {` block, after the CI-C6 test, add:

```typescript
        it('CI-C3: cross-file base class — contracts propagate', () => {
            const animalFixture = `
export class CrossFileAnimal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
`;
            const dogFixture = `
import { CrossFileAnimal } from './CrossFileAnimal';
export class CrossFileDog extends CrossFileAnimal {
    feed(amount: number): void {}
}
`;
            const r = compileAndRunMulti(
                [
                    { name: 'CrossFileAnimal', content: animalFixture },
                    { name: 'CrossFileDog', content: dogFixture },
                ],
                'CrossFileDog',
                'new CrossFileDog().feed(-1)',
            );
            expect(r.success).toBe(true);
            expect(r.output).toContain('ERROR: ContractViolationError');
        });
```

- [ ] **Step 2: Add CI-C4 (transpileModule mode)**

After CI-C3, add:

```typescript
        it('CI-C4: transpileModule mode — no crash, Dog own contracts fire', () => {
            // ts.transpileModule has no Program/TypeChecker. The transformer must not throw
            // and must still inject Dog's own inline contracts.
            // NOTE: transformer factory API: require(transformerPath) returns a factory
            // that accepts (program: ts.Program | undefined, opts: object).
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const transformerFactory = require(transformerPath) as (
                program: ts.Program | undefined,
                opts: { diagnostics?: boolean }
            ) => ts.TransformerFactory<ts.SourceFile>;

            const fixture = `
class Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
export class TranspileModuleDog extends Animal {
    /** @pre amount > 0 */
    feed(amount: number): void {}
}
`;
            let result: ts.TranspileOutput | undefined;
            expect(() => {
                result = ts.transpileModule(fixture, {
                    compilerOptions: {
                        target: ts.ScriptTarget.ES2020,
                        module: ts.ModuleKind.CommonJS,
                        strict: true,
                    },
                    transformers: {
                        before: [transformerFactory(undefined, { diagnostics: true })],
                    },
                });
            }).not.toThrow();

            // Dog's own @pre must be present even without TypeChecker
            expect(result!.outputText).toContain('ContractViolationError("PRE"');
        });
```

> **Note:** If CI-C4 fails because the transformer factory API does not accept `undefined` as the first argument, investigate `node_modules/@fultslop/axiom/dist/src/transformer.js` to find the correct invocation. Report findings to the implementation team rather than altering the expected outcomes.

- [ ] **Step 3: Run the full suite**

```bash
npm test -- class-inheritance
```

Expected: all 21 tests pass. If CI-C4 fails due to transformer API uncertainty, skip it with `it.skip` and note the investigation needed.

- [ ] **Step 4: Run the complete test suite to verify no regressions**

```bash
npm test
```

Expected: 0 failures across all suites.

- [ ] **Step 5: Commit**

```bash
git add test/class-inheritance.test.ts
git commit -m "feat: add class inheritance contracts acceptance tests (CI-A1–C6)"
```
