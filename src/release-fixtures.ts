// Release build verification fixtures
// These should have NO contract code in release output

/**
 * @pre x > 0
 * @post result > 0
 */
export function releaseFn(x: number): number {
    return x;
}

/**
 * @invariant this.val >= 0
 */
export class ReleaseClass {
    public val: number;

    constructor(val: number) {
        this.val = val;
    }

    /**
     * @pre x > 0
     */
    public method(x: number): number {
        return x;
    }
}
