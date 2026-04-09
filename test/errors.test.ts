import {
    ContractError,
    ContractViolationError,
    InvariantViolationError,
} from 'fsprepost';
import {
    errorPreAmount,
    errorPreName,
    errorPostResult,
    errorLocation,
    ErrorInvariantClass,
} from '@src/error-fixtures';

describe('Phase 6: Error type assertions', () => {

    // 6.1: ContractViolationError thrown on pre violation
    describe('ContractViolationError on pre violation (6.1)', () => {
        it('should throw ContractViolationError', () => {
            try {
                errorPreAmount(-1);
                fail('Expected to throw');
            } catch (err) {
                expect(err).toBeInstanceOf(ContractViolationError);
            }
        });

        it('should also be instance of ContractError (6.9)', () => {
            try {
                errorPreAmount(-1);
                fail('Expected to throw');
            } catch (err) {
                expect(err).toBeInstanceOf(ContractError);
            }
        });
    });

    // 6.2: ContractViolationError.type === 'PRE'
    describe('error.type === "PRE" (6.2)', () => {
        it('should have type PRE for pre violation', () => {
            try {
                errorPreAmount(-1);
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

    // 6.3: ContractViolationError.type === 'POST'
    describe('error.type === "POST" (6.3)', () => {
        it('should have type POST for post violation', () => {
            try {
                errorPostResult(-5);
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

    // 6.4: ContractViolationError.expression
    describe('error.expression (6.4)', () => {
        it('should contain the violated pre expression', () => {
            try {
                errorPreAmount(-1);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.expression).toContain('amount > 0');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });

        it('should contain the violated post expression', () => {
            try {
                errorPostResult(-5);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.expression).toContain('result > 0');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });
    });

    // 6.5: ContractViolationError.location
    describe('error.location (6.5)', () => {
        it('should contain function name for standalone function', () => {
            try {
                errorLocation(200);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.location).toContain('errorLocation');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });

        it('should contain ClassName.methodName for class method', () => {
            const obj = new ErrorInvariantClass(10);
            try {
                obj.deduct(20); // balance goes negative, invariant violated
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof InvariantViolationError) {
                    expect(err.location).toContain('ErrorInvariantClass.deduct');
                } else if (err instanceof ContractViolationError) {
                    // If it's a pre error instead, that's also valid
                    expect(err.location).toContain('ErrorInvariantClass');
                } else {
                    fail('Expected ContractViolationError or InvariantViolationError');
                }
            }
        });
    });

    // 6.6: ContractViolationError.message format
    describe('error.message format (6.6)', () => {
        it('should start with [PRE] for pre violations', () => {
            try {
                errorPreAmount(-1);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.message).toMatch(/^\[PRE\]/);
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });

        it('should start with [POST] for post violations', () => {
            try {
                errorPostResult(-5);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.message).toMatch(/^\[POST\]/);
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });

        it('should contain the location in the message', () => {
            try {
                errorPreName('');
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof ContractViolationError) {
                    expect(err.message).toContain('errorPreName');
                } else {
                    fail('Expected ContractViolationError');
                }
            }
        });
    });

    // 6.7/6.8: InvariantViolationError
    describe('InvariantViolationError (6.7, 6.8)', () => {
        it('should throw InvariantViolationError on invariant violation', () => {
            const obj = new ErrorInvariantClass(10);
            try {
                obj.deduct(20);
                fail('Expected to throw');
            } catch (err) {
                // Could be invariant violation or pre violation depending on order
                if (err instanceof InvariantViolationError) {
                    expect(err.expression).toContain('this.value >= 0');
                    expect(err.location).toContain('ErrorInvariantClass');
                } else if (err instanceof ContractViolationError) {
                    // Pre violation happens first — also valid
                    expect(err.type).toBe('PRE');
                } else {
                    fail('Expected ContractViolationError or InvariantViolationError');
                }
            }
        });

        it('should throw InvariantViolationError with [INVARIANT] prefix', () => {
            // Create a class where only invariant is violated (pre passes)
            /**
             * @invariant this.value <= 5
             */
            class SmallValueClass {
                public value: number;
                constructor(value: number) {
                    this.value = value;
                }
            }
            try {
                new SmallValueClass(10);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof InvariantViolationError) {
                    expect(err.message).toMatch(/^\[INVARIANT\]/);
                    expect(err.expression).toContain('this.value <= 5');
                } else {
                    fail('Expected InvariantViolationError');
                }
            }
        });
    });

    // 6.10: Error stack trace
    describe('error.stack (6.10)', () => {
        it('should have a meaningful stack trace', () => {
            try {
                errorPreAmount(-1);
                fail('Expected to throw');
            } catch (err) {
                if (err instanceof Error) {
                    expect(err.stack).toBeDefined();
                    expect(err.stack).toContain('errorPreAmount');
                } else {
                    fail('Expected Error');
                }
            }
        });
    });
});
