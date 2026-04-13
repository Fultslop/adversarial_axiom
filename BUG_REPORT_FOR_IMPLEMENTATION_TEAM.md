# Bug Report for @fultslop/axiom Implementation Team

## Bug: Invalid Property Chain Contracts Not Dropped in transpileModule Mode

**Package**: `@fultslop/axiom@0.8.11`  
**Severity**: Moderate - Runtime crashes despite compile-time warning  
**Status**: NOT FIXED in v0.8.11 (carried over from v0.8.10)

---

## Issue Summary

When a `@pre` contract contains an invalid property chain (e.g., accessing a property that doesn't exist on the type), the transformer:

✅ **Emits a compile-time warning** (correct)  
❌ **Does NOT drop the contract** in transpileModule mode (bug)

The contract guard is injected without validation, causing runtime `TypeError` crashes.

---

## Reproduction Example

### Source Code

```typescript
/**
 * @pre config.missing.value > 0
 */
export function invalidParamChain(config: { value: number }): boolean {
    return config.value > 0;
}
```

### Expected Behavior (Per v0.8.10/v0.8.11 Spec)

> "When a TypeChecker is available, validate that each step in a property access chain refers to an actually declared member. **Emit a warning and drop the contract** when a property does not exist on the accessed type."

**What should happen:**
1. Compile-time warning: ✅ Working
2. Contract dropped: ❌ **NOT working in transpileModule mode**

### Actual Behavior

#### Full Program Mode (tspc with TypeChecker)
```
[axiom] Contract validation warning in invalidParamChain:
  @pre config.missing.value > 0 — property 'missing' does not exist on type '{ value: number; }'
```
- Warning: ✅ Emitted
- Contract dropped: ⚠️ Should be dropped (validation logic runs)

#### transpileModule Mode (ts-jest, no TypeChecker)
```javascript
// What gets injected:
function invalidParamChain(config) {
    if (!(config.missing.value > 0))  // ← Guard injected WITHOUT validation
        throw new ContractViolationError("PRE", "config.missing.value > 0", "invalidParamChain");
    return config.value > 0;
}

// Runtime result:
invalidParamChain({ value: 5 });
// TypeError: Cannot read properties of undefined (reading 'value')
```

- Warning: ❌ Not emitted (no TypeChecker to detect the issue)
- Contract dropped: ❌ NOT dropped (validation skipped)
- Runtime: 💥 **Crashes**

---

## Root Cause

In `contract-validator.js` (line 215):

```javascript
function validateExpression(node, expression, location, knownIdentifiers, paramTypes, checker, contextNode) {
    const errors = [];
    collectAssignments(node, expression, location, errors);
    if (knownIdentifiers !== undefined) {
        collectUnknownIdentifiers(node, expression, location, knownIdentifiers, errors);
    }
    if (paramTypes !== undefined) {
        collectTypeMismatches(node, expression, location, paramTypes, errors);
    }
    if (checker !== undefined && contextNode !== undefined) {  // ← THIS CONDITION
        collectDeepPropertyErrors(node, expression, location, checker, contextNode, errors);
    }
    return errors;
}
```

**Problem**: `collectDeepPropertyErrors()` is only called when `checker !== undefined`. In transpileModule mode, `checker` is `undefined`, so property chain validation is completely skipped, no errors are returned, and the contract is injected.

---

## Impact

1. **Developers see the warning** in their build output and assume the contract is dropped
2. **Tests pass** if they don't hit the invalid code path
3. **Production crashes** when the invalid property chain is evaluated at runtime
4. **False sense of security** - the warning suggests the issue is handled, but it isn't

---

## Suggested Fixes

### Option 1: Add Fallback Validation for transpileModule Mode

Add basic property chain validation that doesn't require TypeChecker:

```javascript
function validateExpression(node, expression, location, knownIdentifiers, paramTypes, checker, contextNode) {
    const errors = [];
    collectAssignments(node, expression, location, errors);
    if (knownIdentifiers !== undefined) {
        collectUnknownIdentifiers(node, expression, location, knownIdentifiers, errors);
    }
    if (paramTypes !== undefined) {
        collectTypeMismatches(node, expression, location, paramTypes, errors);
    }
    if (checker !== undefined && contextNode !== undefined) {
        collectDeepPropertyErrors(node, expression, location, checker, contextNode, errors);
    } else if (knownIdentifiers !== undefined) {
        // Fallback: validate property chains using known identifiers
        collectDeepPropertyErrorsFallback(node, expression, location, knownIdentifiers, errors);
    }
    return errors;
}

function collectDeepPropertyErrorsFallback(node, expression, location, knownIdentifiers, errors) {
    // Extract property chain and validate root identifier is known
    const chain = extractPropertyChain(node);
    if (chain !== undefined && chain.properties.length > 0) {
        if (!knownIdentifiers.has(chain.root) && chain.root !== ROOT_THIS) {
            errors.push({
                kind: 'unknown-identifier',
                expression,
                location,
                message: `identifier '${chain.root}' is not a known parameter`,
            });
        }
        // Note: Can't validate properties without TypeChecker
    }
    typescript_1.default.forEachChild(node, (child) => 
        collectDeepPropertyErrorsFallback(child, expression, location, knownIdentifiers, errors));
}
```

### Option 2: Emit Warning About Limitation

Warn users when property chains are used in transpileModule mode:

```javascript
function validateExpression(...) {
    // ... existing code ...
    
    if (checker === undefined && hasPropertyChain(node)) {
        warn(`[axiom] Property chain validation skipped (no TypeChecker): ${expression}`);
    }
    
    // ... rest of code ...
}
```

### Option 3: Conservative Approach - Drop Contracts with Property Chains in transpileModule

When TypeChecker is unavailable and a property chain is detected, drop the contract with a warning:

```javascript
if (checker === undefined && hasPropertyChain(node)) {
    errors.push({
        kind: 'property-chain-no-checker',
        expression,
        location,
        message: `property chain validation requires TypeChecker; contract dropped`,
    });
}
```

---

## Test Case

A failing test case is available in the acceptance test suite:

**File**: `test/v0810-property-chain-validation.test.ts`  
**Test**: `'BUG: invalid contract is NOT dropped in transpileModule mode (ts-jest)'`

```typescript
it('BUG: invalid contract is NOT dropped in transpileModule mode (ts-jest)', () => {
    // In transpileModule mode (no TypeChecker), property validation is skipped
    // The contract is injected without validation, causing runtime error
    expect(() => invalidParamChain({ value: -5 })).toThrow(TypeError);
});
```

**Debug test** showing injected guard code: `test/v0811-bugfix-verification.test.ts`

---

## Verification Steps

1. Install `@fultslop/axiom@0.8.11`
2. Create a function with invalid property chain: `@pre config.missing.value > 0`
3. Compile with ts-jest (transpileModule mode)
4. Call the function - it will crash with `TypeError`
5. Check function source: guard is injected without validation

---

## Additional Notes

- The warning appears **once** in v0.8.11 (improvement from v0.8.10 which had it twice)
- The feature works correctly in full program mode (TypeChecker available)
- This affects any tool using transpileModule mode (ts-jest, certain build pipelines)
- README documents this as a limitation but doesn't warn about the runtime impact

---

## Contact

For questions or to discuss the fix approach, refer to the acceptance test repository:
- `c:\Users\lassc\Code\typescript\fsprepost_acceptanceTests`
