import {
    ContractViolationError,
} from 'axiom';
import {
    manualPrePass,
    manualPreFail,
    manualPostPass,
    manualPostFail,
    manualCustomMessage,
    manualPreDestructured,
} from '@src/manual-assertions';

describe('Phase 7: Manual pre()/post() assertions', () => {

    // 7.1: pre() throws ContractViolationError
    describe('manualPrePass / manualPreFail (7.1)', () => {
        it('should pass when x > 0', () => {
            expect(manualPrePass(5)).toBe(5);
        });

        it('should throw ContractViolationError when x <= 0', () => {
            expect(() => manualPreFail(0)).toThrow(ContractViolationError);
            expect(() => manualPreFail(-1)).toThrow(ContractViolationError);
        });
    });

    // 7.2: post() throws ContractViolationError
    describe('manualPostPass / manualPostFail (7.2)', () => {
        it('should pass when result > 0', () => {
            expect(manualPostPass(5)).toBe(10);
        });

        it('should throw ContractViolationError when result <= 0', () => {
            expect(() => manualPostFail(0)).toThrow(ContractViolationError);
            expect(() => manualPostFail(-1)).toThrow(ContractViolationError);
        });
    });

    // 7.3: pre() error has type: 'PRE'
    describe('pre() type === "PRE" (7.3)', () => {
        it('should have type PRE', () => {
            try {
                manualPreFail(-1);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.type).toBe('PRE');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });
    });

    // 7.4: post() error has type: 'POST'
    describe('post() type === "POST" (7.4)', () => {
        it('should have type POST', () => {
            try {
                manualPostFail(-1);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.type).toBe('POST');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });
    });

    // 7.5: Custom message in error
    describe('custom message (7.5)', () => {
        it('should include custom message in error', () => {
            try {
                manualCustomMessage(-1);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.message).toContain('CUSTOM: x must be greater than zero');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });
    });

    // 7.7: pre() with destructured values
    describe('manualPreDestructured (7.7)', () => {
        it('should pass when both x and y > 0', () => {
            expect(() => manualPreDestructured({ x: 1, y: 2 })).not.toThrow();
        });

        it('should throw when x <= 0', () => {
            expect(() => manualPreDestructured({ x: 0, y: 2 })).toThrow(ContractViolationError);
        });

        it('should throw when y <= 0', () => {
            expect(() => manualPreDestructured({ x: 1, y: -1 })).toThrow(ContractViolationError);
        });
    });
});
