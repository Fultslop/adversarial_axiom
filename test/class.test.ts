import {Foo} from '@src/classTests';

describe('classTests', () => {
    
    it('should pass with a static >= 1', () => {
        expect(Foo.doStaticFn(1)).toBe(2);
    });

    it('should fail with a static < 1', () => {
        expect(() => Foo.doStaticFn(0)).toThrow();
    });

    it('should pass with a min = -1, max = 0', () => {
        const f = new Foo(1);
        f.updateMinMax(-1, 0);
    });

    it('should fail with a min = 0, max = 0', () => {
        const f = new Foo(1);
        expect(() => f.updateMinMax(0, 0)).toThrow();
    });
});