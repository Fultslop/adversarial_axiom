import * as func from '@src/functionTests';

describe('functionTests', () => {
    it('should pass with a validString', () => {
        func.stringTestFn('foo');
    });

    it('should throw an exception', () => {
        expect(() => func.stringTestFn('')).toThrow();
    });

    it('doAnd should pass with true && true', () => {
        func.doAnd(true, true);
        func.doAnd(true || false, true && true);
        func.doAnd(!false, true);
    });

    it('doAnd should throw with false && true', () => {
        expect(() => func.doAnd(false, true)).toThrow();
        expect(() => func.doAnd(true, false)).toThrow();
        expect(() => func.doAnd(false, false)).toThrow();
    });

    it('doNumberRange should pass with 1, 1', () => {
        func.doNumberRange(1, 2);
        func.doNumberRange(3, 10);
    });

    it('doNumberRange should fail with 0, 0', () => {
        expect(() => func.doNumberRange(0, 1)).toThrow();
        expect(() => func.doNumberRange(1, 0)).toThrow();
        expect(() => func.doNumberRange(0, 0)).toThrow();
        expect(() => func.doNumberRange(1, -1)).toThrow();
        expect(() => func.doNumberRange(-1, 0)).toThrow();
    });

    it('doIncSlashComment should pass with 2', () => {
        func.doIncSlashComment(2);
    });

    it('doIncSlashComment should fail with 0', () => {
        // XXX doesn't work yet
        expect(() => func.doIncSlashComment(0)).toThrow();
    });

    it('doLoopFn should pass with 1,2', () => {
        func.doLoopFn([1,2]);
    });

    it('doLoopFn should pass with -1, -2', () => {
        // XXX doesn't work yet
        expect(() => func.doLoopFn([-1,-2])).toThrow();
    });

    it('doSwitchFn should pass with "foo"', () => {
        func.doSwitchFn("foo");
    });

    it('doSwitchFn should fail with "bar"', () => {
        expect(() => func.doSwitchFn("bar")).toThrow();
    });

    it('doOptionalFn should pass with valid value', () => {
        expect( func.doOptionalFn({value:1})).toBe(2);
    });

    it('doOptionalFn should fail with valid value (0)', () => {
        expect(() => func.doOptionalFn({value:0})).toThrow();
    });
});