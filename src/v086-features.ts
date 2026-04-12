// v0.8.6: Enum and module-level constant support tests

// Test 1: Enum member reference in @pre
export enum Priority { Low, Medium, High, Critical }

/**
 * @pre priority === Priority.High || priority === Priority.Critical
 */
export function enumMemberPre(priority: Priority): boolean {
    return priority === Priority.High || priority === Priority.Critical;
}

// Test 2: Enum member reference in @post
/**
 * @post result === Priority.High
 */
export function enumMemberPost(): Priority {
    return Priority.High;
}

// Test 3: Multiple enum members in complex expression
/**
 * @pre status === Status.Active || (status === Status.Pending && level > 0)
 */
export enum Status { Active, Inactive, Pending }

export function complexEnumExpression(status: Status, level: number): boolean {
    return status === Status.Active || (status === Status.Pending && level > 0);
}

// Test 4: Module-level constant in @pre
export const MAX_RETRIES = 3;
export const MIN_TIMEOUT = 100;

/**
 * @pre retries <= MAX_RETRIES
 * @pre timeout >= MIN_TIMEOUT
 */
export function moduleConstantsPre(retries: number, timeout: number): boolean {
    return retries <= MAX_RETRIES && timeout >= MIN_TIMEOUT;
}

// Test 5: Module-level constant in @post
export const DEFAULT_RESULT = 42;

/**
 * @post result === DEFAULT_RESULT
 */
export function moduleConstantPost(): number {
    return DEFAULT_RESULT;
}

// Test 6: Mixed enum and module constant
export enum Mode { Strict, Lenient }
export const STRICT_THRESHOLD = 90;

/**
 * @pre (mode === Mode.Strict && score >= STRICT_THRESHOLD) || mode === Mode.Lenient
 */
export function mixedEnumAndConstant(mode: Mode, score: number): boolean {
    return (mode === Mode.Strict && score >= STRICT_THRESHOLD) || mode === Mode.Lenient;
}

// Test 7: Interpolated template literal (still NOT supported - control test)
/**
 * @pre label === `item_${id}`
 */
export function interpolatedTemplateControl(label: string, id: number): boolean {
    return label === `item_${id}`;
}
