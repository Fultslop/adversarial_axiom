import {
    objectDestructBasic,
    objectDestructPost,
    objectDestructRelation,
    nestedDestructPre,
    arrayDestructBasic,
    arrayDestructPost,
    mixedDestruct,
    destructWithDefaults,
    partialDestruct,
    renamedDestruct,
    deepArrayDestruct,
    multiDestruct,
    optionalDestruct,
    restArrayDestruct,
    DestructuredMethodClass,
    arrowDestruct,
    asyncDestruct,
    complexDestructExpr,
    conditionalDestruct,
    negationDestruct,
} from '../src/destructured-params';
import { ContractViolationError } from '@fultslop/axiom';

describe('Destructured Parameter Binding Support', () => {

    describe('Object destructuring - basic', () => {
        it('should accept valid params (x=5, y=3)', () => {
            expect(() => objectDestructBasic({ x: 5, y: 3 })).not.toThrow();
        });

        it('should reject when x <= 0', () => {
            expect(() => objectDestructBasic({ x: 0, y: 3 })).toThrow(ContractViolationError);
        });

        it('should reject when y < 0', () => {
            expect(() => objectDestructBasic({ x: 5, y: -1 })).toThrow(ContractViolationError);
        });
    });

    describe('Object destructuring - with @post result', () => {
        it('should accept and enforce @post result > 0', () => {
            expect(() => objectDestructPost({ x: 5, y: 3 })).not.toThrow();
        });

        it('should reject @pre when x <= 0', () => {
            expect(() => objectDestructPost({ x: -1, y: 3 })).toThrow(ContractViolationError);
        });

        // Note: @post result > 0 would require result to be checked, but with x=5, y=-10
        // the result is -5 which violates @post. However, axiom may not inject @post 
        // if it can't validate types. Testing actual behavior:
        it('should reject @post when result <= 0', () => {
            // This WILL throw because result=-5 violates @post result > 0
            expect(() => objectDestructPost({ x: 5, y: -10 })).toThrow(ContractViolationError);
        });
    });

    describe('Object destructuring - property relations', () => {
        it('should accept when x > y', () => {
            expect(() => objectDestructRelation({ x: 10, y: 5 })).not.toThrow();
        });

        it('should reject when x <= y', () => {
            expect(() => objectDestructRelation({ x: 5, y: 10 })).toThrow(ContractViolationError);
        });
    });

    describe('Nested object destructuring', () => {
        it('should accept valid nested params', () => {
            expect(() => nestedDestructPre({ config: { min: 5, max: 10 } })).not.toThrow();
        });

        it('should reject when config.min <= 0', () => {
            expect(() => nestedDestructPre({ config: { min: 0, max: 10 } })).toThrow(ContractViolationError);
        });

        it('should reject when config.max <= config.min', () => {
            expect(() => nestedDestructPre({ config: { min: 10, max: 5 } })).toThrow(ContractViolationError);
        });
    });

    describe('Array destructuring - basic', () => {
        it('should accept valid array params', () => {
            expect(() => arrayDestructBasic([5, 3])).not.toThrow();
        });

        it('should reject when first <= 0', () => {
            expect(() => arrayDestructBasic([0, 3])).toThrow(ContractViolationError);
        });

        it('should reject when second < 0', () => {
            expect(() => arrayDestructBasic([5, -1])).toThrow(ContractViolationError);
        });
    });

    describe('Array destructuring - with @post', () => {
        it('should accept and enforce @post result > first', () => {
            expect(() => arrayDestructPost([5, 3])).not.toThrow();
        });

        it('should reject @pre when first <= 0', () => {
            expect(() => arrayDestructPost([-1, 3])).toThrow(ContractViolationError);
        });
    });

    describe('Mixed destructured and regular params', () => {
        it('should accept valid params', () => {
            expect(() => mixedDestruct({ x: 5, y: 3 }, 2)).not.toThrow();
        });

        it('should reject when destructured x <= 0', () => {
            expect(() => mixedDestruct({ x: 0, y: 3 }, 2)).toThrow(ContractViolationError);
        });

        it('should reject when regular multiplier <= 0', () => {
            expect(() => mixedDestruct({ x: 5, y: 3 }, 0)).toThrow(ContractViolationError);
        });
    });

    describe('Destructured with default values', () => {
        it('should accept with default y', () => {
            expect(() => destructWithDefaults({ x: 5 })).not.toThrow();
        });

        it('should accept with explicit y', () => {
            expect(() => destructWithDefaults({ x: 5, y: 20 })).not.toThrow();
        });

        it('should reject when x <= 0', () => {
            expect(() => destructWithDefaults({ x: 0 })).toThrow(ContractViolationError);
        });
    });

    describe('Partial object destructuring', () => {
        it('should accept when only some properties used in contract', () => {
            expect(() => partialDestruct({ x: 5, y: 3, z: 1 })).not.toThrow();
        });

        it('should reject when contracted property fails', () => {
            expect(() => partialDestruct({ x: 0, y: 3, z: 1 })).toThrow(ContractViolationError);
        });
    });

    describe('Renamed destructuring bindings', () => {
        it('should accept renamed bindings', () => {
            expect(() => renamedDestruct({ x: 5, y: 3 })).not.toThrow();
        });

        it('should reject when renamed a (from x) <= 0', () => {
            expect(() => renamedDestruct({ x: 0, y: 3 })).toThrow(ContractViolationError);
        });

        it('should reject when renamed b (from y) < 0', () => {
            expect(() => renamedDestruct({ x: 5, y: -1 })).toThrow(ContractViolationError);
        });
    });

    describe('Deep array destructuring', () => {
        it('should accept valid array in object', () => {
            expect(() => deepArrayDestruct({ coords: [5, 3] })).not.toThrow();
        });

        it('should reject when coords[0] <= 0', () => {
            expect(() => deepArrayDestruct({ coords: [0, 3] })).toThrow(ContractViolationError);
        });
    });

    describe('Multiple destructured params', () => {
        it('should accept when both objects satisfy conditions', () => {
            expect(() => multiDestruct({ x: 10, y: 5 }, { x: 5, y: 3 })).not.toThrow();
        });

        it('should reject when x1 <= x2', () => {
            expect(() => multiDestruct({ x: 5, y: 5 }, { x: 10, y: 3 })).toThrow(ContractViolationError);
        });

        it('should reject when y1 < y2', () => {
            expect(() => multiDestruct({ x: 10, y: 2 }, { x: 5, y: 3 })).toThrow(ContractViolationError);
        });
    });

    describe('Optional destructured properties', () => {
        it('should accept with optional property present', () => {
            expect(() => optionalDestruct({ x: 5, optional: 'test' })).not.toThrow();
        });

        it('should accept with optional property absent', () => {
            expect(() => optionalDestruct({ x: 5 })).not.toThrow();
        });

        it('should reject when x <= 0', () => {
            expect(() => optionalDestruct({ x: 0 })).toThrow(ContractViolationError);
        });
    });

    describe('Rest elements in array', () => {
        it('should accept array with rest elements', () => {
            expect(() => restArrayDestruct([5, 1, 2, 3])).not.toThrow();
        });

        it('should reject when first element <= 0', () => {
            expect(() => restArrayDestruct([0, 1, 2, 3])).toThrow(ContractViolationError);
        });
    });

    describe('Class method with destructured params', () => {
        // FIXED in axiom v0.8.4: Class methods now work with destructured params
        // even without @invariant on the class
        it('should have contract injected when class has @invariant', () => {
            const { ClassInvariantDestruct } = require('../src/class-destruct-test');
            const instance = new ClassInvariantDestruct(10);
            expect(() => instance.add({ delta: 0 })).toThrow(ContractViolationError);
        });

        it('should have contract injected even without @invariant (v0.8.4 fix)', () => {
            const instance = new DestructuredMethodClass(2);
            // v0.8.4 now injects contracts for class methods with destructured params
            expect(() => instance.process({ value: 0 })).toThrow(ContractViolationError);
        });
    });

    describe('Arrow function with destructuring', () => {
        // Arrow functions with destructuring are NOW instrumented in v0.9.0
        it('should throw ContractViolationError when x is 0 (now instrumented)', () => {
            expect(() => arrowDestruct({ x: 0, y: 3 })).toThrow(ContractViolationError);
        });
    });

    describe('Async function with destructuring', () => {
        it('should accept valid async params', async () => {
            await expect(asyncDestruct({ x: 5, y: 3 })).resolves.toBe(8);
        });

        it('should reject when x <= 0', async () => {
            await expect(asyncDestruct({ x: 0, y: 3 })).rejects.toThrow(ContractViolationError);
        });
    });

    describe('Complex expressions with destructured values', () => {
        it('should accept when x * y > 0 and x + y < 100', () => {
            expect(() => complexDestructExpr({ x: 5, y: 3 })).not.toThrow();
        });

        it('should reject when x * y <= 0', () => {
            expect(() => complexDestructExpr({ x: -5, y: 3 })).toThrow(ContractViolationError);
        });

        it('should reject when x + y >= 100', () => {
            expect(() => complexDestructExpr({ x: 50, y: 60 })).toThrow(ContractViolationError);
        });
    });

    describe('Conditional expressions with destructured values', () => {
        it('should accept when x > 0 || y > 0', () => {
            expect(() => conditionalDestruct({ x: 5, y: -3 })).not.toThrow();
        });

        it('should accept when y > 0 but x <= 0', () => {
            expect(() => conditionalDestruct({ x: -5, y: 3 })).not.toThrow();
        });

        it('should reject when both x <= 0 and y <= 0', () => {
            expect(() => conditionalDestruct({ x: -5, y: -3 })).toThrow(ContractViolationError);
        });
    });

    describe('Negation with destructured values', () => {
        it('should accept when !(x <= 0)', () => {
            expect(() => negationDestruct({ x: 5, y: 3 })).not.toThrow();
        });

        it('should reject when x <= 0', () => {
            expect(() => negationDestruct({ x: 0, y: 3 })).toThrow(ContractViolationError);
        });
    });
});
