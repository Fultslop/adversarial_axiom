// Comprehensive destructured parameter binding tests for axiom contracts

// 1. Object destructuring - basic
/**
 * @pre x > 0
 * @pre y >= 0
 */
export function objectDestructBasic({ x, y }: { x: number; y: number }): number {
    return x + y;
}

// 2. Object destructuring - with @post result
/**
 * @pre x > 0
 * @post result > 0
 */
export function objectDestructPost({ x, y }: { x: number; y: number }): number {
    return x + y;
}

// 3. Object destructuring - using multiple properties in single condition
/**
 * @pre x > y
 */
export function objectDestructRelation({ x, y }: { x: number; y: number }): boolean {
    return x > y;
}

// 4. Object destructuring - nested destructuring (extract values in param binding)
/**
 * @pre min > 0
 * @pre max > min
 */
export function nestedDestructPre({ config: { min, max } }: { config: { min: number; max: number } }): number {
    return max - min;
}

// 5. Array destructuring - basic
/**
 * @pre first > 0
 * @pre second >= 0
 */
export function arrayDestructBasic([first, second]: [number, number]): number {
    return first + second;
}

// 6. Array destructuring - with post condition
/**
 * @pre first > 0
 * @post result > first
 */
export function arrayDestructPost([first, second]: [number, number]): number {
    return first + second;
}

// 7. Mixed destructuring and regular params
/**
 * @pre x > 0
 * @pre multiplier > 0
 */
export function mixedDestruct({ x, y }: { x: number; y: number }, multiplier: number): number {
    return (x + y) * multiplier;
}

// 8. Object destructuring with default values
/**
 * @pre x > 0
 */
export function destructWithDefaults({ x, y = 10 }: { x: number; y?: number }): number {
    return x + y;
}

// 9. Partial object destructuring - only some properties used in contract
/**
 * @pre x > 0
 */
export function partialDestruct({ x, y, z }: { x: number; y: number; z: number }): number {
    return x + y + z;
}

// 10. Renamed destructuring bindings
/**
 * @pre a > 0
 * @pre b >= 0
 */
export function renamedDestruct({ x: a, y: b }: { x: number; y: number }): number {
    return a + b;
}

// 11. Deep nested array in object
/**
 * @pre coords[0] > 0
 */
export function deepArrayDestruct({ coords }: { coords: [number, number] }): number {
    return coords[0] + coords[1];
}

// 12. Multiple destructured params
/**
 * @pre x1 > x2
 * @pre y1 >= y2
 */
export function multiDestruct(
    { x: x1, y: y1 }: { x: number; y: number },
    { x: x2, y: y2 }: { x: number; y: number }
): boolean {
    return x1 > x2 && y1 >= y2;
}

// 13. Destructured with optional properties (should work if property exists)
/**
 * @pre x > 0
 */
export function optionalDestruct({ x, optional: _optional }: { x: number; optional?: string }): number {
    return x;
}

// 14. Rest elements in array destructuring (should reference rest array)
/**
 * @pre first > 0
 */
export function restArrayDestruct([first, ...rest]: [number, ...number[]]): number {
    return first + rest.reduce((a, b) => a + b, 0);
}

// 15. Class method with destructured params (WITHOUT @invariant)
export class DestructuredMethodClass {
    private multiplier: number;

    constructor(multiplier: number) {
        this.multiplier = multiplier;
    }

    /**
     * @pre value > 0
     */
    public process({ value }: { value: number }): number {
        return value * this.multiplier;
    }
}

// 16. Arrow function with destructuring (if supported)
/**
 * @pre x > 0
 */
export const arrowDestruct = ({ x, y }: { x: number; y: number }): number => {
    return x + y;
};

// 17. Async function with destructuring (if supported)
/**
 * @pre x > 0
 */
export async function asyncDestruct({ x, y }: { x: number; y: number }): Promise<number> {
    return Promise.resolve(x + y);
}

// 18. Complex expression with destructured values
/**
 * @pre x * y > 0
 * @pre x + y < 100
 */
export function complexDestructExpr({ x, y }: { x: number; y: number }): number {
    return x * y;
}

// 19. Conditional with destructured params
/**
 * @pre x > 0 || y > 0
 */
export function conditionalDestruct({ x, y }: { x: number; y: number }): number {
    return Math.max(x, y);
}

// 20. Negation with destructured params
/**
 * @pre !(x <= 0)
 */
export function negationDestruct({ x, y }: { x: number; y: number }): number {
    return x + y;
}
