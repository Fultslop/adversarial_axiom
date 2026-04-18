// v0.9.0 Regression Guard Fixtures
// Compiled by ts-jest on every npm test run — fast regression check for
// newly-instrumented forms: exported arrow functions, function expressions, async.

/** @pre x > 0 */
export const arrowWithPreFixture = (x: number): number => x;

/** @post result > 0 */
export const arrowWithPostFixture = (x: number): number => x * 2;

/**
 * @pre x > 0
 * @post result > 1
 */
export const arrowWithBothFixture = (x: number): number => x + 1;

/** @pre x > 0 */
export async function asyncFnWithPreFixture(x: number): Promise<number> {
    return x;
}

/** @post result > 0 */
export async function asyncFnWithPostFixture(x: number): Promise<number> {
    return x * 2;
}

/** @pre x > 0 */
export const asyncArrowFixture = async (x: number): Promise<number> => x;

/** @pre x > 0 */
export const funcExprFixture = function(x: number): number {
    return x;
};
