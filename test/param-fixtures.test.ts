import {
    withDefault,
    withRest,
    withOptional,
} from '@src/param-fixtures';

describe('Phase 15.7-15.9: Default, rest, and optional parameters', () => {

    // 15.7: Default parameters
    describe('withDefault (15.7)', () => {
        it('should pass when explicit value > 0', () => {
            expect(withDefault(5)).toBe(5);
        });

        it('should throw when explicit value <= 0', () => {
            expect(() => withDefault(0)).toThrow();
            expect(() => withDefault(-1)).toThrow();
        });

        it('should pass with default value (10 > 0)', () => {
            expect(withDefault()).toBe(10);
        });
    });

    // 15.8: Rest parameters
    describe('withRest (15.8)', () => {
        it('should pass when args.length > 0', () => {
            expect(withRest(1, 2, 3)).toBe(6);
            expect(withRest(42)).toBe(42);
        });

        it('should throw when no args provided (length === 0)', () => {
            expect(() => withRest()).toThrow();
        });
    });

    // 15.9: Optional parameters
    describe('withOptional (15.9)', () => {
        it('should pass when x is provided and !== undefined', () => {
            expect(withOptional(5)).toBe(5);
        });

        it('should throw when x is undefined', () => {
            expect(() => withOptional()).toThrow();
        });

        it('should work when x is explicitly undefined', () => {
            expect(() => withOptional(undefined)).toThrow();
        });
    });
});
