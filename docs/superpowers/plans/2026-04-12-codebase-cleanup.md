# Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename phase-based fixture/test files to feature-domain names, extract a shared build helper, split the mixed-concern `phase2-more-post.ts`, and slim `known-gaps` to only genuine remaining limitations.

**Architecture:** Four sequential passes — each leaves `npm test` green before the next starts. Pass 1 (build helper) is a pure test-infrastructure change with no fixture edits. Passes 2–3 are file renames with import-path updates. Pass 4 deletes stale fixture functions now covered by better-named files.

**Tech Stack:** TypeScript, Jest, ts-jest, `git mv` for history-preserving renames.

---

## File Map

### Created
- `test/helpers/build-output.ts` — shared `getBuildOutput()` helper

### Renamed (src)
| Old | New |
|---|---|
| `src/functionTests.ts` | `src/function-fixtures.ts` |
| `src/classTests.ts` | `src/class-fixtures.ts` |
| `src/phase1-fixtures.ts` | `src/pre-condition-fixtures.ts` |
| `src/phase345-fixtures.ts` | `src/post-condition-fixtures.ts` |
| `src/phase2-special-expr.ts` | `src/pre-special-expr-fixtures.ts` |
| `src/phase2-more-post.ts` (lines 1–180) | `src/post-more-fixtures.ts` |
| `src/phase2-more-post.ts` (lines 182–387) | `src/global-id-fixtures.ts` |
| `src/phase3-missing-features.ts` | `src/alternate-fn-form-fixtures.ts` |
| `src/phase2-known-gaps.ts` | `src/known-gaps-fixtures.ts` (slimmed) |

### Renamed (test)
| Old | New |
|---|---|
| `test/function.test.ts` | `test/function-fixtures.test.ts` |
| `test/class.test.ts` | `test/class-fixtures.test.ts` |
| `test/phase1.test.ts` | `test/pre-conditions.test.ts` |
| `test/phase345.test.ts` | `test/post-conditions.test.ts` |
| `test/phase2-special-expr.test.ts` | `test/pre-special-expr.test.ts` |
| `test/phase2-more-post.test.ts` | `test/post-more.test.ts` |
| `test/phase3-missing.test.ts` | `test/alternate-fn-forms.test.ts` |
| `test/phase2-known-gaps.test.ts` | `test/known-gaps.test.ts` (slimmed) |

---

## Task 1: Create Shared Build Output Helper

**Files:**
- Create: `test/helpers/build-output.ts`
- Modify: `test/build.test.ts`
- Modify: `test/build-warnings.test.ts`
- Modify: `test/global-identifiers.test.ts`
- Modify: `test/phase2-known-gaps.test.ts`
- Modify: `test/v086-features.test.ts`

- [ ] **Step 1: Create the helper file**

Create `test/helpers/build-output.ts` with this exact content:

```typescript
import { execSync } from 'child_process';
import * as path from 'path';

let _output: string | null = null;

export function getBuildOutput(): string {
    if (_output !== null) return _output;
    try {
        const result = execSync('npm run build:dev', {
            encoding: 'utf8',
            cwd: path.resolve(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        _output = result;
    } catch (e: any) {
        // tspc exits non-zero when warnings are emitted — capture both streams
        _output = (e.stdout ?? '') + (e.stderr ?? '');
    }
    return _output;
}
```

- [ ] **Step 2: Update `test/build.test.ts`**

Replace the entire file content with:

```typescript
import { getBuildOutput } from './helpers/build-output';

describe('build:dev', () => {
    it('should run npm run build:dev and produce warnings', () => {
        const output = getBuildOutput();
        const warningMatches = output.match(/\[axiom\] Contract validation warning/g);
        const warningCount = warningMatches ? warningMatches.length : 0;
        expect(warningCount).toBeGreaterThanOrEqual(10);
    });
});
```

- [ ] **Step 3: Update `test/build-warnings.test.ts`**

Replace the `beforeAll` block and remove the `let buildOutput` + imports for `execSync`/`os`/`fs`. The new top of the file:

```typescript
import { getBuildOutput } from './helpers/build-output';

describe('Build warnings (Phase 12)', () => {

    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });
```

Remove these lines from the top of the file:
```typescript
import {execSync} from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
```

And remove the old `beforeAll` block:
```typescript
    beforeAll(() => {
        const logFile = `${os.tmpdir()}/axiom_warnings_${Date.now()}.log`;
        execSync(`cmd.exe /c "scripts\\build-dev.bat ${logFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        buildOutput = fs.readFileSync(logFile, 'utf8');
    });
```

- [ ] **Step 4: Update `test/global-identifiers.test.ts`**

Replace the `import` block and `beforeAll` at the top. Change:
```typescript
import { execSync } from 'child_process';
import * as os from 'os';
import * as fs from 'fs';

describe('GLOBAL_IDENTIFIERS Feature Tests', () => {
    let buildOutput: string;

    beforeAll(() => {
        const logFile = `${os.tmpdir()}/axiom_global_identifiers_${Date.now()}.log`;
        execSync(`cmd.exe /c "scripts\\build-dev.bat ${logFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        buildOutput = fs.readFileSync(logFile, 'utf8');
    });
```
To:
```typescript
import { getBuildOutput } from './helpers/build-output';

describe('GLOBAL_IDENTIFIERS Feature Tests', () => {
    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });
```

- [ ] **Step 5: Update `test/phase2-known-gaps.test.ts`**

Replace the `import` block and `beforeAll`. Change:
```typescript
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
```
To:
```typescript
import { getBuildOutput } from './helpers/build-output';

describe('Phase 2: Known limitation gap tests', () => {

    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });
```

- [ ] **Step 6: Update `test/v086-features.test.ts`**

Replace the `import` block and `beforeAll`. Change:
```typescript
import {execSync} from 'child_process';
import * as os from 'os';
import * as fs from 'fs';
import {
```
To:
```typescript
import { getBuildOutput } from './helpers/build-output';
import {
```

And replace the `beforeAll` block inside the describe:
```typescript
    beforeAll(() => {
        const logFile = `${os.tmpdir()}/axiom_v086_${Date.now()}.log`;
        execSync(`cmd.exe /c "scripts\\build-dev.bat ${logFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        buildOutput = fs.readFileSync(logFile, 'utf8');
    });
```
With:
```typescript
    beforeAll(() => {
        buildOutput = getBuildOutput();
    });
```

- [ ] **Step 7: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (same count as before). Build runs once; subsequent test files reuse cached output.

- [ ] **Step 8: Commit**

```bash
git add test/helpers/build-output.ts test/build.test.ts test/build-warnings.test.ts test/global-identifiers.test.ts test/phase2-known-gaps.test.ts test/v086-features.test.ts
git commit -m "refactor: extract shared build output helper for test files"
```

---

## Task 2: Rename `functionTests.ts` and `function.test.ts`

**Files:**
- Rename: `src/functionTests.ts` → `src/function-fixtures.ts`
- Rename: `test/function.test.ts` → `test/function-fixtures.test.ts`
- Modify: `src/index.ts` (import path)

- [ ] **Step 1: Rename the source fixture file**

```bash
git mv src/functionTests.ts src/function-fixtures.ts
```

- [ ] **Step 2: Rename the test file**

```bash
git mv test/function.test.ts test/function-fixtures.test.ts
```

- [ ] **Step 3: Update import in `test/function-fixtures.test.ts`**

Change line 1:
```typescript
import * as func from '@src/functionTests';
```
To:
```typescript
import * as func from '@src/function-fixtures';
```

- [ ] **Step 4: Update import in `src/index.ts`**

Change line 1:
```typescript
import {stringTestFn, doArrFn, doMapExistFn, doTypeOfFn, doProduceFn, doProducePostFailFn} from './functionTests';
```
To:
```typescript
import {stringTestFn, doArrFn, doMapExistFn, doTypeOfFn, doProduceFn, doProducePostFailFn} from './function-fixtures';
```

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/function-fixtures.ts src/index.ts test/function-fixtures.test.ts
git commit -m "refactor: rename functionTests to function-fixtures"
```

---

## Task 3: Rename `classTests.ts` and `class.test.ts`

**Files:**
- Rename: `src/classTests.ts` → `src/class-fixtures.ts`
- Rename: `test/class.test.ts` → `test/class-fixtures.test.ts`
- Modify: `src/index.ts` (import path)

- [ ] **Step 1: Rename the source fixture file**

```bash
git mv src/classTests.ts src/class-fixtures.ts
```

- [ ] **Step 2: Rename the test file**

```bash
git mv test/class.test.ts test/class-fixtures.test.ts
```

- [ ] **Step 3: Update import in `test/class-fixtures.test.ts`**

Change line 1:
```typescript
import {Foo} from '@src/classTests';
```
To:
```typescript
import {Foo} from '@src/class-fixtures';
```

- [ ] **Step 4: Update import in `src/index.ts`**

Change line 2:
```typescript
import {Foo} from './classTests';
```
To:
```typescript
import {Foo} from './class-fixtures';
```

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/class-fixtures.ts src/index.ts test/class-fixtures.test.ts
git commit -m "refactor: rename classTests to class-fixtures"
```

---

## Task 4: Rename `phase1-fixtures.ts` and `phase1.test.ts`

**Files:**
- Rename: `src/phase1-fixtures.ts` → `src/pre-condition-fixtures.ts`
- Rename: `test/phase1.test.ts` → `test/pre-conditions.test.ts`

- [ ] **Step 1: Rename the source fixture file**

```bash
git mv src/phase1-fixtures.ts src/pre-condition-fixtures.ts
```

- [ ] **Step 2: Rename the test file**

```bash
git mv test/phase1.test.ts test/pre-conditions.test.ts
```

- [ ] **Step 3: Update import in `test/pre-conditions.test.ts`**

Change lines 1–8:
```typescript
import {
    doOrPre,
    doNegationPre,
    doComparisonPre,
    doArithmeticPre,
    nonExportedWithPre,
    ServiceClass,
} from '@src/phase1-fixtures';
```
To:
```typescript
import {
    doOrPre,
    doNegationPre,
    doComparisonPre,
    doArithmeticPre,
    nonExportedWithPre,
    ServiceClass,
} from '@src/pre-condition-fixtures';
```

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pre-condition-fixtures.ts test/pre-conditions.test.ts
git commit -m "refactor: rename phase1-fixtures to pre-condition-fixtures"
```

---

## Task 5: Rename `phase345-fixtures.ts` and `phase345.test.ts`

**Files:**
- Rename: `src/phase345-fixtures.ts` → `src/post-condition-fixtures.ts`
- Rename: `test/phase345.test.ts` → `test/post-conditions.test.ts`

- [ ] **Step 1: Rename the source fixture file**

```bash
git mv src/phase345-fixtures.ts src/post-condition-fixtures.ts
```

- [ ] **Step 2: Rename the test file**

```bash
git mv test/phase345.test.ts test/post-conditions.test.ts
```

- [ ] **Step 3: Update import in `test/post-conditions.test.ts`**

Change the import path (line 18 in the original file):
```typescript
} from '@src/phase345-fixtures';
```
To:
```typescript
} from '@src/post-condition-fixtures';
```

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/post-condition-fixtures.ts test/post-conditions.test.ts
git commit -m "refactor: rename phase345-fixtures to post-condition-fixtures"
```

---

## Task 6: Rename `phase2-special-expr.ts` and `phase2-special-expr.test.ts`

**Files:**
- Rename: `src/phase2-special-expr.ts` → `src/pre-special-expr-fixtures.ts`
- Rename: `test/phase2-special-expr.test.ts` → `test/pre-special-expr.test.ts`

- [ ] **Step 1: Rename the source fixture file**

```bash
git mv src/phase2-special-expr.ts src/pre-special-expr-fixtures.ts
```

- [ ] **Step 2: Rename the test file**

```bash
git mv test/phase2-special-expr.test.ts test/pre-special-expr.test.ts
```

- [ ] **Step 3: Update import in `test/pre-special-expr.test.ts`**

Change lines 1–11:
```typescript
import {
    ternaryPre,
    instanceofPre,
    inOperatorPre,
    voidOperatorPre,
    thisInFunction,
    shortCircuitFalse,
    shortCircuitTrue,
    BaseClass,
    DerivedClass,
} from '@src/phase2-special-expr';
```
To:
```typescript
import {
    ternaryPre,
    instanceofPre,
    inOperatorPre,
    voidOperatorPre,
    thisInFunction,
    shortCircuitFalse,
    shortCircuitTrue,
    BaseClass,
    DerivedClass,
} from '@src/pre-special-expr-fixtures';
```

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/pre-special-expr-fixtures.ts test/pre-special-expr.test.ts
git commit -m "refactor: rename phase2-special-expr to pre-special-expr-fixtures"
```

---

## Task 7: Split `phase2-more-post.ts` and rename its test

**Files:**
- Create: `src/post-more-fixtures.ts` (content from lines 1–180 of `phase2-more-post.ts`)
- Create: `src/global-id-fixtures.ts` (content from lines 182–387 of `phase2-more-post.ts`)
- Delete: `src/phase2-more-post.ts`
- Rename: `test/phase2-more-post.test.ts` → `test/post-more.test.ts`

- [ ] **Step 1: Create `src/post-more-fixtures.ts`**

```typescript
// Additional @post condition fixtures

// 2.13: @post with arithmetic
/**
 * @post result === a + b
 */
export function postArithmetic(a: number, b: number): number {
    return a + b;
}

// 2.8: @post with result on void function — result is undefined
/**
 * @post result === undefined
 */
export function postVoidResult(items: number[]): void {
    items.push(1);
}

// 15.1: Empty @pre tag (edge case — transformer should handle gracefully)
/**
 * @pre
 */
export function emptyPre(x: number): number {
    return x;
}

// 15.1: Empty @post tag
/**
 * @post
 */
export function emptyPost(x: number): number {
    return x;
}

// 15.3: Deeply nested property access
/**
 * @pre config.settings.limit > 0
 */
export function deepNested(config: { settings: { limit: number } }): number {
    return config.settings.limit;
}

// 9.5: result in @pre context — should be undefined or warn
/**
 * @pre result === undefined
 */
export function resultInPre(x: number): number {
    return x + 1;
}

// 10.3: if/else with @post
/**
 * @post result >= 0
 */
export function ifElsePost(x: number): number {
    if (x > 0) {
        return x;
    } else {
        return -x;
    }
}

// 10.4: Multiple return statements with @post
/**
 * @post result > 0
 */
export function multiReturnPost(x: number): number {
    if (x > 10) return x;
    if (x > 5) return x + 1;
    if (x > 0) return x + 2;
    return 1;
}

// 10.5: Function with throw and @post
/**
 * @post result > 0
 */
export function throwAndPost(x: number): number {
    if (x < 0) {
        throw new Error('negative');
    }
    return x + 1;
}

// 10.6: try/catch with @post
/**
 * @post result >= 0
 */
export function tryCatchPost(): number {
    try {
        return JSON.parse('invalid');
    } catch {
        return 0;
    }
}

// 10.7: Early return with @post
/**
 * @post result > 0
 */
export function earlyReturnPost(x: number): number {
    if (x <= 0) return 1;
    const y = x * 2;
    return y;
}

// 10.8: Class method with multiple return paths
/**
 * @invariant this.count >= 0
 */
export class MultiReturnClass {
    public count: number;

    constructor(count: number) {
        this.count = count;
    }

    /**
     * @post result >= 0
     */
    public compute(x: number): number {
        if (x > 10) return x;
        if (x > 0) return this.count + x;
        return this.count;
    }
}

// 10.10: Arrow function inside body — outer function has contract
/**
 * @pre x > 0
 * @post result > 0
 */
export function arrowInsideBody(x: number): number {
    const fn = (n: number) => n * 2; // arrow function — should NOT be instrumented
    return fn(x);
}

// 15.10: Re-entrant contract calls
/**
 * @pre x > 0
 */
export function reentrantA(x: number): number {
    if (x > 1) {
        return reentrantB(x - 1);
    }
    return 1;
}

/**
 * @pre x > 0
 */
export function reentrantB(x: number): number {
    if (x > 1) {
        return reentrantA(x - 1);
    }
    return 1;
}

// 9.6: Whitelisted globals — these should NOT produce warnings
/**
 * @pre x !== undefined
 */
export function globalUndefined(x: number): boolean {
    return x !== undefined;
}

/**
 * @pre x === x
 */
export function globalNaN(x: number): boolean {
    return !Number.isNaN(x); // NaN comparison
}

/**
 * @pre x < globalThis.Infinity
 */
export function globalInfinity(x: number): boolean {
    return x < Infinity;
}
```

- [ ] **Step 2: Create `src/global-id-fixtures.ts`**

```typescript
// Global identifier fixtures — verify no build warnings for known global namespaces

// Built-in constructors — should NOT warn
/**
 * @pre typeof(obj) === 'object' || obj instanceof Object
 */
export function globalObject(obj: any): boolean {
    return typeof(obj) === 'object' || obj instanceof Object;
}

/**
 * @pre arr instanceof Array
 */
export function globalArray(arr: any): boolean {
    return arr instanceof Array;
}

/**
 * @pre typeof(str) === 'string' || str instanceof String
 */
export function globalString(str: any): boolean {
    return typeof(str) === 'string' || str instanceof String;
}

/**
 * @pre typeof(num) === 'number' || num instanceof Number
 */
export function globalNumber(num: any): boolean {
    return typeof(num) === 'number' || num instanceof Number;
}

/**
 * @pre typeof(flag) === 'boolean' || flag instanceof Boolean
 */
export function globalBoolean(flag: any): boolean {
    return typeof(flag) === 'boolean' || flag instanceof Boolean;
}

/**
 * @pre typeof(sym) === 'symbol' || sym instanceof Symbol
 */
export function globalSymbol(sym: any): boolean {
    return typeof(sym) === 'symbol' || sym instanceof Symbol;
}

/**
 * @pre typeof(big) === 'bigint' || big instanceof BigInt
 */
export function globalBigInt(big: any): boolean {
    return typeof(big) === 'bigint' || big instanceof BigInt;
}

// Math namespace — should NOT warn
/**
 * @pre x >= 0 && Math.abs(x) < 1000000
 */
export function globalMathRange(x: number): boolean {
    return x >= 0 && Math.abs(x) < 1000000;
}

/**
 * @pre Math.floor(x) === x
 */
export function globalMathFloor(x: number): boolean {
    return Math.floor(x) === x;
}

/**
 * @pre Math.ceil(x) === x
 */
export function globalMathCeil(x: number): boolean {
    return Math.ceil(x) === x;
}

// JSON namespace — should NOT warn
/**
 * @pre JSON.stringify(obj).length > 0
 */
export function globalJsonStringify(obj: object): boolean {
    return JSON.stringify(obj).length > 0;
}

/**
 * @pre JSON.parse(str) !== null
 */
export function globalJsonParse(str: string): boolean {
    return JSON.parse(str) !== null;
}

// Date constructor — should NOT warn
/**
 * @pre date instanceof Date
 */
export function globalDate(date: any): boolean {
    return date instanceof Date;
}

// RegExp constructor — should NOT warn
/**
 * @pre pattern instanceof RegExp
 */
export function globalRegExp(pattern: any): boolean {
    return pattern instanceof RegExp;
}

// Error constructor — should NOT warn
/**
 * @pre err instanceof Error
 */
export function globalError(err: any): boolean {
    return err instanceof Error;
}

// Promise constructor — should NOT warn
/**
 * @pre promise instanceof Promise
 */
export function globalPromise(promise: any): boolean {
    return promise instanceof Promise;
}

// Utility functions — should NOT warn
/**
 * @pre parseInt(str, 10) === parseInt(str, 10)
 */
export function globalParseInt(str: string): boolean {
    return parseInt(str, 10) === parseInt(str, 10);
}

/**
 * @pre parseFloat(str) === parseFloat(str)
 */
export function globalParseFloat(str: string): boolean {
    return parseFloat(str) === parseFloat(str);
}

/**
 * @pre isNaN(val) === false
 */
export function globalIsNaN(val: number): boolean {
    return isNaN(val) === false;
}

/**
 * @pre isFinite(val) === true
 */
export function globalIsFinite(val: number): boolean {
    return isFinite(val) === true;
}

/**
 * @pre encodeURIComponent(str).length > 0
 */
export function globalEncodeURIComponent(str: string): boolean {
    return encodeURIComponent(str).length > 0;
}

/**
 * @pre decodeURIComponent(str) === decodeURIComponent(str)
 */
export function globalDecodeURIComponent(str: string): boolean {
    return decodeURIComponent(str) === decodeURIComponent(str);
}

// console — should NOT warn (useful in dev contracts)
/**
 * @pre console !== undefined
 */
export function globalConsole(): boolean {
    return console !== undefined;
}

// globalThis — should NOT warn
/**
 * @pre globalThis.Object === Object
 */
export function globalThisObject(): boolean {
    return globalThis.Object === Object;
}

// arguments — should NOT warn (in non-arrow functions)
/**
 * @pre arguments.length > 0
 */
export function globalArguments(): boolean {
    return arguments.length > 0;
}

// Multiple globals in single contract — should NOT warn
/**
 * @pre typeof(x) === 'number' && !isNaN(x) && isFinite(x) && Math.abs(x) < 1000
 */
export function multipleGlobals(x: number): boolean {
    return typeof(x) === 'number' && !isNaN(x) && isFinite(x) && Math.abs(x) < 1000;
}

// Complex expression with globals — should NOT warn
/**
 * @post result instanceof Array && result.length >= 0
 */
export function complexGlobalResult(x: number): number[] {
    return [x, x * 2, x * 3];
}
```

- [ ] **Step 3: Delete the old mixed file**

```bash
git rm src/phase2-more-post.ts
```

- [ ] **Step 4: Rename the test file**

```bash
git mv test/phase2-more-post.test.ts test/post-more.test.ts
```

- [ ] **Step 5: Update import in `test/post-more.test.ts`**

Change line 20:
```typescript
} from '@src/phase2-more-post';
```
To:
```typescript
} from '@src/post-more-fixtures';
```

- [ ] **Step 6: Run the full test suite**

```bash
npm test
```

Expected: all tests pass. `global-identifiers.test.ts` checks build output only (no import to update).

- [ ] **Step 7: Commit**

```bash
git add src/post-more-fixtures.ts src/global-id-fixtures.ts test/post-more.test.ts
git commit -m "refactor: split phase2-more-post into post-more-fixtures and global-id-fixtures"
```

---

## Task 8: Rename `phase3-missing-features.ts` and `phase3-missing.test.ts`

**Files:**
- Rename: `src/phase3-missing-features.ts` → `src/alternate-fn-form-fixtures.ts`
- Rename: `test/phase3-missing.test.ts` → `test/alternate-fn-forms.test.ts`

- [ ] **Step 1: Rename the source fixture file**

```bash
git mv src/phase3-missing-features.ts src/alternate-fn-form-fixtures.ts
```

- [ ] **Step 2: Rename the test file**

```bash
git mv test/phase3-missing.test.ts test/alternate-fn-forms.test.ts
```

- [ ] **Step 3: Update import in `test/alternate-fn-forms.test.ts`**

Change lines 1–9:
```typescript
import {
    arrowFnWithPre,
    funcExprWithPre,
    asyncFnWithPre,
    generatorFnWithPre,
    ConstructorContracts,
    BaseContract,
    DerivedContract,
} from '@src/phase3-missing-features';
```
To:
```typescript
import {
    arrowFnWithPre,
    funcExprWithPre,
    asyncFnWithPre,
    generatorFnWithPre,
    ConstructorContracts,
    BaseContract,
    DerivedContract,
} from '@src/alternate-fn-form-fixtures';
```

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/alternate-fn-form-fixtures.ts test/alternate-fn-forms.test.ts
git commit -m "refactor: rename phase3-missing-features to alternate-fn-form-fixtures"
```

---

## Task 9: Slim `phase2-known-gaps.ts` and rename to `known-gaps-fixtures.ts`

**Files:**
- Create: `src/known-gaps-fixtures.ts` (slimmed content — 4 stale fixtures removed)
- Delete: `src/phase2-known-gaps.ts`
- Create: `test/known-gaps.test.ts` (4 describe blocks removed)
- Delete: `test/phase2-known-gaps.test.ts`

**Removed fixtures** (now fully supported — covered by better-named files):
- `destructuredPre` → covered by `src/destructured-params.ts`
- `enumReferencePre` + `Status` enum → covered by `src/v086-features.ts`
- `moduleConstantPre` + `MAX_LIMIT` constant → covered by `src/v086-features.ts`
- `mathGlobalPre` → covered by `src/global-id-fixtures.ts`

- [ ] **Step 1: Create `src/known-gaps-fixtures.ts`**

```typescript
// Genuine remaining limitations in axiom contract expressions
// NOTE: 1.23 (destructured params), 9.7 (Math global), 9.9 (enum), 9.10 (module const)
// are NOW SUPPORTED and have been removed from this file.

// 1.26: Template literal — type mismatch not detected
/**
 * @pre label === `item_${id}`
 */
export function templateLiteralPre(label: number, id: string): boolean {
    return label === Number(`item_${id}`); // always false, but tests template literal parsing
}

// 2.12 / 8.3: Non-primitive return type — result omitted from type map
/**
 * @post result === "ok"
 */
export function nonPrimitivePost(): Record<string, unknown> {
    return { status: 'ok' };
}

// 8.4: Union-typed param — type mismatch not detected
/**
 * @pre amount === "zero"
 */
export function unionTypePre(amount: number | undefined): number {
    return amount ?? 0;
}

// 8.5: Multi-level property chain — only root checked
/**
 * @pre this.config.limit > 0
 */
export class MultiLevelAccess {
    public config: { limit: number };

    constructor(limit: number) {
        this.config = { limit };
    }

    public check(): number {
        return this.config.limit;
    }
}

// 8.6: Unary operand — type mismatch not detected
/**
 * @pre -amount > 0
 */
export function unaryOperandPre(amount: string): number {
    return Number(amount);
}

// 8.7: Compound conditions — type narrowing not considered
/**
 * @pre amount !== undefined && amount === "zero"
 */
export function compoundNarrowingPre(amount: number | undefined): number {
    return amount ?? 0;
}
```

- [ ] **Step 2: Delete the old file**

```bash
git rm src/phase2-known-gaps.ts
```

- [ ] **Step 3: Create `test/known-gaps.test.ts`**

```typescript
import { getBuildOutput } from './helpers/build-output';

describe('Known limitation gap tests', () => {

    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    // 1.26: Template literal — type mismatch not detected
    describe('template literal (1.26)', () => {
        it('should not detect type mismatch with template literal', () => {
            expect(buildOutput).not.toContain('templateLiteralPre');
        });
    });

    // 2.12: Non-primitive return — result omitted from type map
    describe('non-primitive return (2.12, 8.3)', () => {
        it('should not emit type-mismatch warning for non-primitive return', () => {
            expect(buildOutput).not.toContain('nonPrimitivePost');
        });
    });

    // 8.4: Union-typed param — type mismatch not detected
    describe('union-typed param (8.4)', () => {
        it('should not emit type-mismatch warning for union type', () => {
            expect(buildOutput).not.toContain('unionTypePre');
        });
    });

    // 8.5: Multi-level property chain — only root checked
    describe('multi-level property chain (8.5)', () => {
        it('should only check root this, not intermediate properties', () => {
            expect(buildOutput).not.toContain('MultiLevelAccess');
        });
    });

    // 8.6: Unary operand — type mismatch not detected
    describe('unary operand (8.6)', () => {
        it('should not emit type-mismatch warning for unary expression', () => {
            expect(buildOutput).not.toContain('unaryOperandPre');
        });
    });

    // 8.7: Compound conditions — type narrowing not considered
    describe('compound conditions (8.7)', () => {
        it('should not use type narrowing from sibling clause', () => {
            expect(buildOutput).not.toContain('compoundNarrowingPre');
        });
    });
});
```

- [ ] **Step 4: Delete the old test file**

```bash
git rm test/phase2-known-gaps.test.ts
```

- [ ] **Step 5: Run the full test suite**

```bash
npm test
```

Expected: all tests pass. Test count decreases by 4 (the four removed stale describe blocks had one `it` each).

- [ ] **Step 6: Commit**

```bash
git add src/known-gaps-fixtures.ts test/known-gaps.test.ts
git commit -m "refactor: slim known-gaps fixtures — remove now-supported items, rename file"
```

---

## Final Verification

- [ ] **Check no phase-named files remain in src/**

```bash
ls src/phase*.ts
```

Expected: no output (all renamed).

- [ ] **Check no phase-named files remain in test/**

```bash
ls test/phase*.test.ts
```

Expected: no output.

- [ ] **Check no functionTests or classTests references remain**

```bash
grep -r "functionTests\|classTests" src/ test/
```

Expected: no output.

- [ ] **Run the full test suite one final time**

```bash
npm test
```

Expected: all tests pass.
