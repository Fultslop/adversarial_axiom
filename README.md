# adversarial_axiom

Acceptance test suite for [`@fultslop/axiom`](http://localhost:4873), a TypeScript transformer that injects runtime contract guards from JSDoc annotations (`@pre`, `@post`, `@invariant`, `@prev`).

The transformer rewrites TypeScript source at compile time so that annotated functions throw `ContractViolationError` or `InvariantViolationError` when a contract is violated — without any runtime dependency on a decorator framework.

---

## Quick start

```bash
npm test              # run all tests
npm run test:coverage # run with coverage (80% threshold enforced)
npm run typecheck     # type-check without emitting
npm run lint          # ESLint check
npm run build         # compile to dist/
```

---

## How the transformer works

The transformer is a TypeScript compiler plugin (`@fultslop/axiom/dist/src/transformer`). It reads JSDoc tags on functions, classes, and variable declarations and rewrites the function body to check the contract at runtime.

### Supported contract tags

| Tag | Applies to | Meaning |
|---|---|---|
| `@pre <expr>` | any function | Checked synchronously before the body runs |
| `@post <expr>` | any function | Checked after the body returns; use `result` to refer to the return value |
| `@invariant <expr>` | class | Checked after every public method call; use `this` |
| `@prev <destructure>` | function with `@post` | Captures a snapshot of named values before the body runs; refer to them as `prev.<name>` in `@post` |

### Errors thrown

- `ContractViolationError("PRE", location, expr)` — a `@pre` guard failed
- `ContractViolationError("POST", location, expr)` — a `@post` guard failed
- `InvariantViolationError(location, expr)` — a class `@invariant` guard failed

### File-level `keepContracts` directive

Place this comment on **line 1** of a file to filter which contract types are injected:

```typescript
// @axiom keepContracts post      // keep @post only, strip @pre
// @axiom keepContracts pre       // keep @pre only, strip @post
// @axiom keepContracts invariant // keep @invariant only, strip @pre/@post
// @axiom keepContracts true      // keep all (default behaviour)
// @axiom keepContracts all       // same as true
```

A directive on line 2 or later is silently ignored.

### `allowIdentifiers`

Identifiers listed in `jest.config.ts → globals['ts-jest'].astTransformers[0].options.allowIdentifiers` are treated as globally known names inside contract expressions (e.g., enum values, module-level constants). Without this list, the transformer warns and skips contracts that reference unknown identifiers.

---

## Project layout

```
src/          Fixture source files — compiled by the transformer
test/         Test files (*.test.ts)
test/helpers/ Shared test utilities (e.g., build-output reader)
dist/         Compiled output — do not edit
docs/         Plans and specs
```

---

## Writing tests — two modes

### Mode 1: ts-jest (fast, recommended for most tests)

Fixture code lives in `src/`. The transformer runs automatically via ts-jest on every `npm test`. Import fixtures using the `@src/` path alias.

**Fixture** (`src/my-fixtures.ts`):
```typescript
/** @pre x > 0 */
export function addOne(x: number): number {
    return x + 1;
}
```

**Test** (`test/my-fixtures.test.ts`):
```typescript
import { addOne } from '@src/my-fixtures';
import { ContractViolationError } from '@fultslop/axiom';

describe('addOne', () => {
    it('throws on pre violation', () => {
        expect(() => addOne(-1)).toThrow(ContractViolationError);
    });
    it('returns value on valid input', () => {
        expect(addOne(1)).toBe(2);
    });
});
```

**Async contracts** resolve/reject — use `await expect(...).rejects.toThrow(...)`:
```typescript
await expect(asyncFn(-1)).rejects.toThrow(ContractViolationError);
await expect(asyncFn(1)).resolves.toBe(1);
```

### Mode 2: Full-program acceptance tests

Use this mode when you need the TypeScript type-checker to be available during transformation (e.g., property-chain validation, `keepContracts` directive tests).

The pattern: write a fixture string → compile with `tsc` + transformer via `spawnSync` → inspect the compiled JS output → optionally run it with `node` and inspect stdout.

See `test/v0812-acceptance-full-program-mode.test.ts` for a self-contained example, or the `compileAndRun` helper in `test/v090-acceptance.test.ts` for a reusable version.

**Skeleton** (`test/my-acceptance.test.ts`):
```typescript
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('My acceptance tests', () => {
    const testDir = path.join(__dirname, '..', 'temp-my-acceptance');
    const srcDir  = path.join(testDir, 'src');
    const outDir  = path.join(testDir, 'dist');

    beforeAll(() => {
        fs.mkdirSync(srcDir, { recursive: true });
        fs.mkdirSync(outDir, { recursive: true });
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    it('injects @pre guard on arrow function', () => {
        const fixture = `
/** @pre x > 0 */
export const arrowWithPre = (x: number): number => x;
`;
        const srcFile = path.join(srcDir, 'arrowWithPre.ts');
        const outFile = path.join(outDir, 'arrowWithPre.js');
        fs.writeFileSync(srcFile, fixture);

        const transformerPath = path.join(
            __dirname, '..', 'node_modules', '@fultslop', 'axiom', 'dist', 'src', 'transformer.js',
        );
        const tsconfig = {
            compilerOptions: { target: 'ES2020', module: 'commonjs', outDir: './dist', strict: true,
                               plugins: [{ transform: transformerPath }] },
            include: ['src/**/*.ts'],
        };
        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

        const tsc = spawnSync('npx', ['tsc', '-p', testDir], {
            cwd: path.join(__dirname, '..'), encoding: 'utf-8', stdio: 'pipe',
        });
        expect(tsc.status).toBe(0);

        const compiled = fs.readFileSync(outFile, 'utf-8');
        expect(compiled).toContain('ContractViolationError("PRE"');
        expect(compiled).toContain('"arrowWithPre"');
    });
});
```

**Temp directories** must use a unique prefix (e.g., `temp-my-acceptance`) and be cleaned up in `afterAll`.

**Running compiled output** — write a small JS runner to `outDir`, then call `spawnSync('node', [runner])` and inspect `stdout`:
```typescript
const runner = path.join(outDir, 'runner.js');
fs.writeFileSync(runner, `
const { arrowWithPre } = require('./arrowWithPre');
try {
    const result = arrowWithPre(-1);
    console.log('RESULT:', JSON.stringify(result));
} catch (e) {
    console.log('ERROR:', e.constructor.name, e.message);
}
`);
const run = spawnSync('node', [runner], { cwd: outDir, encoding: 'utf-8' });
expect(run.stdout).toContain('ERROR: ContractViolationError');
```

---

## Test naming conventions

| Pattern | Used for |
|---|---|
| `describe('Phase N: ...')` | Top-level grouping by phase |
| `describe('featureName (X.Y)')` | Feature under test with version-fixture ID |
| `it('should throw ContractViolationError ...')` | Violation path |
| `it('should pass / return value ...')` | Happy path |
| `A1:`, `B2:`, `C3:` prefixes | Acceptance test sections (A=Arrow, B=Async, C=keepContracts, D=Regression) |

---

## Key invariants to test against

1. **Pre-condition guards are synchronous** — even on `async` functions, the `@pre` check runs before the body and throws (not rejects) on violation.
2. **Post-condition on async wraps the body** — compiled output contains `async ()` wrapper; the resolved value is checked, not the Promise.
3. **Expression-body arrows are normalised** — an arrow with `@post` gets a block body with an explicit `return` in the compiled output.
4. **Location string** — the transformer uses the variable name (not the internal function name) for named function expressions: `const foo = function bar() {}` → location is `"foo"`, not `"bar"`.
5. **Unknown identifiers in contracts are skipped** — the guard is not injected and the transformer emits a warning; the identifier must not appear in the compiled output.
6. **`@post` on void/Promise\<void\> is dropped** — no `result` variable, no post-check injected.

---

## Dependencies

| Package | Role |
|---|---|
| `@fultslop/axiom` | The transformer under test |
| `ts-jest` | Runs transformer during Jest compilation |
| `ts-patch` (`tspc`) | Full-program mode compilation with plugins |
| `typescript` | Compiler |

The local Verdaccio registry at `http://localhost:4873` must be running to publish or update `@fultslop/axiom`.
