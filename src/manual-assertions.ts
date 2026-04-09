// Test fixtures for manual pre()/post() assertions (Phase 7)
import { pre, post } from 'fsprepost';

// 7.1/7.3: pre() throws ContractViolationError with type: 'PRE'
export function manualPrePass(x: number): number {
    pre(x > 0, 'x must be positive');
    return x;
}

export function manualPreFail(x: number): number {
    pre(x > 0, 'x must be positive');
    return x; // never reached when x <= 0
}

// 7.2/7.4: post() throws ContractViolationError with type: 'POST'
export function manualPostPass(x: number): number {
    const result = x * 2;
    post(result > 0, 'result must be positive');
    return result;
}

export function manualPostFail(x: number): number {
    const result = x * 2;
    post(result > 0, 'result must be positive');
    return result; // returns negative when x < 0
}

// 7.5: Custom message in error
export function manualCustomMessage(x: number): void {
    pre(x > 0, 'CUSTOM: x must be greater than zero');
}

// 7.6: pre()/post() are NOT stripped in release build
// (Verified by build-output test, not runtime test)

// 7.7: pre() with destructured values
export function manualPreDestructured(obj: { x: number; y: number }): void {
    pre(obj.x > 0, 'x must be positive');
    pre(obj.y > 0, 'y must be positive');
}
