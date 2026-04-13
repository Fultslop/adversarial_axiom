# v0.8.11 Bug Verification Report

## Summary
**The bug is NOT fixed in v0.8.11** - but the situation is more nuanced than initially reported.

## Root Cause Analysis

The issue has **two distinct behaviors** depending on compilation mode:

### 1. Full Program Mode (tspc with TypeChecker) ✅
**Warning**: ✅ Emitted correctly
```
[axiom] Contract validation warning in invalidParamChain:
  @pre config.missing.value > 0 — property 'missing' does not exist on type '{ value: number; }'
```

**Contract Dropped**: ⚠️ Cannot verify (build fails due to unrelated TS errors)

The code in `function-rewriter.js` line 271 calls `filterValidTags()` which should filter out invalid tags:
```javascript
const preTags = filterValidTags(allPreInput, KIND_PRE, location, warn, preKnown, paramTypes, checker, node);
```

And `validateExpression()` in `contract-validator.js` line 215 does call `collectDeepPropertyErrors()` when checker is available:
```javascript
if (checker !== undefined && contextNode !== undefined) {
    collectDeepPropertyErrors(node, expression, location, checker, contextNode, errors);
}
```

The filtering logic appears correct, so the contract **should be dropped** in full program mode.

### 2. transpileModule Mode (ts-jest) ❌
**Warning**: ⚠️ Emitted but from a different compilation (the build output check)
**Contract Dropped**: ❌ NO - contract IS injected

When ts-jest transforms files, it uses `transpileModule` mode which has **no TypeChecker**. The code path:

```javascript
// contract-validator.js line 215
if (checker !== undefined && contextNode !== undefined) {
    // This block is SKIPPED because checker is undefined
    collectDeepPropertyErrors(...);
}
```

Since `checker === undefined`, `collectDeepPropertyErrors()` is never called, so no errors are returned, so `filterValidTags()` returns `true`, and the contract is injected.

**Injected guard code**:
```javascript
function invalidParamChain(config) {
    if (!(config.missing.value > 0))  // ← Guard injected without validation
        throw new ContractViolationError("PRE", "config.missing.value > 0", "invalidParamChain");
    return config.value > 0;
}
```

## Evidence

### Build Output (Full Program Mode)
```
[axiom] Contract validation warning in invalidParamChain:
  @pre config.missing.value > 0 — property 'missing' does not exist on type '{ value: number; }'
```
- Warning appears **once** (improvement from v0.8.10 which had it twice)
- Validation is running and detecting the invalid property

### Runtime Output (transpileModule Mode via ts-jest)
```
Function source: function invalidParamChain(config) {
    if (!(config.missing.value > 0))
        throw new ContractViolationError("PRE", "config.missing.value > 0", "invalidParamChain");
    return config.value > 0;
}

Error: TypeError: Cannot read properties of undefined (reading 'value')
```
- Guard is injected without validation
- Runtime crash when evaluating `config.missing.value`

## Conclusion

**v0.8.11 does NOT fix the bug.** The issue is that:

1. ✅ Full program mode correctly validates property chains and emits warnings
2. ❌ transpileModule mode skips property chain validation entirely
3. ❌ Contracts with invalid property chains are still injected in transpileModule mode

### Why This Happens

The property chain validation feature (gap 8.5) was designed to work **only when TypeChecker is available**:

```javascript
// contract-validator.js
if (checker !== undefined && contextNode !== undefined) {
    collectDeepPropertyErrors(...);
}
```

This is documented behavior - the README states that property chain validation requires TypeChecker. However, **ts-jest uses transpileModule mode by default**, which doesn't have a TypeChecker.

### What v0.8.11 Changed

- Warning now appears **once** instead of twice (minor improvement)
- No change to the contract dropping logic
- No change to transpileModule mode behavior

## Recommendation for Implementation Team

### Option 1: Fix transpileModule Mode (Preferred)
Add property chain validation that works without TypeChecker by using basic AST analysis:

```javascript
// In collectDeepPropertyErrors, add fallback for when checker is undefined
if (checker !== undefined && contextNode !== undefined) {
    collectDeepPropertyErrors(node, expression, location, checker, contextNode, errors);
} else {
    // Fallback: at least validate that identifiers are known
    collectUnknownIdentifiers(node, expression, location, knownIdentifiers, errors);
}
```

### Option 2: Warn About transpileModule Limitation
Emit a warning when property chains are used in transpileModule mode:

```javascript
if (checker === undefined && hasPropertyChain(node)) {
    warn(`[axiom] Property chain validation requires TypeChecker (full program mode). ` +
         `Skipping validation for expression: ${expression}`);
}
```

### Option 3: Update Documentation
Clarify that property chain validation only works in full program mode, and that contracts with invalid property chains may still be injected when using ts-jest or other transpileModule-based tools.

## Test Results

**All tests**: 358 passing (1 skipped, 1 todo)
**Bug verification test**: ❌ Fails as expected (contract not dropped)

```
× should NOT enforce invalid contract on invalidParamChain (contract dropped in v0.8.11)

Error name:    "TypeError"
Error message: "Cannot read properties of undefined (reading 'value')"
```

## Files Created

- `test/v0810-property-chain-validation.test.ts` - Main validation test suite
- `test/v0811-bugfix-verification.test.ts` - Debug test showing injected guard
- `src/v0810-property-chain-fixtures.ts` - Test fixtures
- `V0811_BUG_VERIFICATION.md` - This report
