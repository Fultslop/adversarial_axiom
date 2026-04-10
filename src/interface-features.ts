// Interface feature tests — tests for the 6 key interface features in axiom v1.1.0

// Feature 1: @pre/@post on interface methods applied to all implementing classes
export interface IValidated {
    /**
     * @pre value > 0
     * @post result > 0
     */
    process(value: number): number;
}

export class PositiveProcessor implements IValidated {
    process(value: number): number {
        return value * 2;
    }
}

export class DoubleProcessor implements IValidated {
    process(value: number): number {
        return value + value;
    }
}

// Feature 2: @invariant on interfaces merged with class invariants
/**
 * @invariant this.total >= 0
 */
export interface IAccumulator {
    total: number;
    /**
     * @pre amount > 0
     */
    add(amount: number): void;
}

/**
 * @invariant this.total <= 1000
 */
export class BoundedAccumulator implements IAccumulator {
    public total: number = 0;

    add(amount: number): void {
        this.total += amount;
    }
}

// Feature 3: Cross-file interface resolution (simulated with separate declarations)
export interface ICrossFileService {
    /**
     * @pre input.length > 0
     */
    execute(input: string): string;
}

export class CrossFileServiceImpl implements ICrossFileService {
    execute(input: string): string {
        return input.toUpperCase();
    }
}

// Feature 4: Parameter name mismatch handling (rename mode - default)
export interface IRenamedParams {
    /**
     * @pre val > 0
     */
    compute(val: number): number;
}

export class RenamedParamsImpl implements IRenamedParams {
    compute(inputVal: number): number {
        return inputVal * 3;
    }
}

// Feature 4b: Parameter name mismatch handling (ignore mode)
export interface IIgnoredParams {
    /**
     * @pre val > 0
     */
    calculate(val: number): number;
}

export class IgnoredParamsImpl implements IIgnoredParams {
    calculate(differentName: number): number {
        return differentName + 10;
    }
}

// Feature 5: Additive merge when both interface and class define tags
export interface IAdditivePre {
    /**
     * @pre value >= 0
     */
    transform(value: number): number;
}

/**
 * @pre value < 100
 */
export class AdditivePreClass implements IAdditivePre {
    transform(value: number): number {
        return value / 2;
    }
}

export interface IAdditivePost {
    /**
     * @post result >= 0
     */
    convert(value: number): number;
}

/**
 * @post result !== null
 */
export class AdditivePostClass implements IAdditivePost {
    convert(value: number): number {
        return Math.abs(value);
    }
}

// Feature 6: Graceful degradation when TypeChecker is unavailable
// This is tested via transpileModule in the test file
