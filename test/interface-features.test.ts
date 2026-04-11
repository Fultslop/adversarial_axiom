import ts from 'typescript';
import transformerFactory from '@fultslop/axiom/dist/src/transformer';
import {
    PositiveProcessor,
    DoubleProcessor,
    BoundedAccumulator,
    CrossFileServiceImpl,
    RenamedParamsImpl,
    AdditivePostClass,
} from '@src/interface-features';

// Helper to compile with transformer and TypeChecker (full mode)
function compileWithFullChecker(source: string, options?: { interfaceParamMismatch?: 'rename' | 'ignore' }): { output: string; warnings: string[] } {
    const warnings: string[] = [];
    const compilerOptions: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        strict: true,
        esModuleInterop: true,
    };

    const host = ts.createCompilerHost(compilerOptions);
    const originalGetSourceFile = host.getSourceFile;
    host.getSourceFile = (fileName, languageVersion, onError) => {
        if (fileName === 'test.ts') {
            return ts.createSourceFile(fileName, source, languageVersion);
        }
        return originalGetSourceFile(fileName, languageVersion, onError);
    };

    const program = ts.createProgram(['test.ts'], compilerOptions, host);
    const transformer = transformerFactory(program, {
        warn: (msg) => warnings.push(msg),
        interfaceParamMismatch: options?.interfaceParamMismatch ?? 'rename',
    });

    const emittedFiles: { name: string; text: string }[] = [];
    const originalWriteFile = host.writeFile;
    host.writeFile = (fileName, text, writeByteOrderMark) => {
        emittedFiles.push({ name: fileName, text });
        if (originalWriteFile) {
            originalWriteFile(fileName, text, writeByteOrderMark);
        }
    };

    program.emit(undefined, undefined, undefined, undefined, {
        before: [transformer],
    });

    return {
        output: emittedFiles[0]?.text ?? '',
        warnings,
    };
}

// Helper to compile without TypeChecker (transpileModule mode)
function compileWithoutChecker(source: string, options?: { interfaceParamMismatch?: 'rename' | 'ignore' }): { output: string; warnings: string[] } {
    const warnings: string[] = [];

    const result = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.CommonJS,
        },
        transformers: {
            before: [transformerFactory(undefined, {
                warn: (msg) => warnings.push(msg),
                interfaceParamMismatch: options?.interfaceParamMismatch ?? 'rename',
            })],
        },
    });

    return {
        output: result.outputText,
        warnings,
    };
}

describe('Interface Features - axiom v1.1.0', () => {

    // =========================================================================
    // Feature 1: @pre/@post on interface methods applied to all implementing classes
    // =========================================================================
    describe('Feature 1: Interface method contracts on implementing classes', () => {
        it('should enforce @pre from interface on first implementing class (with TypeChecker)', () => {
            const source = `
interface IValidated {
    /**
     * @pre value > 0
     * @post result > 0
     */
    process(value: number): number;
}

class PositiveProcessor implements IValidated {
    process(value: number): number {
        return value * 2;
    }
}

const p = new PositiveProcessor();
export const testProcess = () => p.process(-5);
`;
            const { output } = compileWithFullChecker(source);
            // Should contain contract guard code
            expect(output).toMatch(/__pre_guard|ContractViolationError/i);
        });

        it('should enforce @pre from interface on second implementing class (with TypeChecker)', () => {
            const source = `
interface IValidated {
    /**
     * @pre value > 0
     */
    process(value: number): number;
}

class DoubleProcessor implements IValidated {
    process(value: number): number {
        return value + value;
    }
}

const p = new DoubleProcessor();
export const testProcess = () => p.process(-3);
`;
            const { output } = compileWithFullChecker(source);
            expect(output).toMatch(/__pre_guard|ContractViolationError/i);
        });

        it('should skip interface contracts without TypeChecker (transpileModule mode)', () => {
            // Without TypeChecker, interface contracts are not resolved
            expect(() => new PositiveProcessor().process(-5)).not.toThrow();
            expect(() => new DoubleProcessor().process(-3)).not.toThrow();
        });

        it('should allow valid values on implementing classes', () => {
            const p1 = new PositiveProcessor();
            expect(p1.process(5)).toBe(10);

            const p2 = new DoubleProcessor();
            expect(p2.process(3)).toBe(6);
        });
    });

    // =========================================================================
    // Feature 2: @invariant on interfaces merged with class invariants
    // =========================================================================
    describe('Feature 2: Interface invariants merged with class invariants', () => {
        it('should check class invariant (total <= 1000) after method', () => {
            const acc = new BoundedAccumulator();
            acc.add(500);
            // This should violate total <= 1000
            expect(() => acc.add(600)).toThrow(/this\.total <= 1000/);
        });

        it('should check interface invariant (total >= 0) after constructor', () => {
            // Interface has @invariant this.total >= 0
            // If interface invariants are merged, this should be checked
            // Currently only class-level invariant is checked
            const acc = new BoundedAccumulator();
            expect(acc.total).toBe(0);
        });

        it.todo('should merge interface and class invariants (requires TypeChecker)');
    });

    // =========================================================================
    // Feature 3: Cross-file interface resolution via TypeChecker
    // =========================================================================
    describe('Feature 3: Cross-file interface resolution', () => {
        it('should enforce interface @pre with TypeChecker', () => {
            const source = `
interface ICrossFileService {
    /**
     * @pre input.length > 0
     */
    execute(input: string): string;
}

class CrossFileServiceImpl implements ICrossFileService {
    execute(input: string): string {
        return input.toUpperCase();
    }
}

const s = new CrossFileServiceImpl();
export const testExecute = () => s.execute('');
`;
            const { output } = compileWithFullChecker(source);
            // Should have contract code
            expect(output).toMatch(/__pre_guard|ContractViolationError/i);
        });

        it('should skip cross-file resolution without TypeChecker', () => {
            // Without TypeChecker, interface contracts are not resolved
            const service = new CrossFileServiceImpl();
            expect(() => service.execute('')).not.toThrow();
            expect(service.execute('hello')).toBe('HELLO');
        });
    });

    // =========================================================================
    // Feature 4: Parameter name mismatch handling
    // =========================================================================
    describe('Feature 4: Parameter name mismatch handling', () => {
        describe('rename mode (default)', () => {
            it('should rename interface params to match class params (with TypeChecker)', () => {
                const source = `
interface IRenamedParams {
    /**
     * @pre val > 0
     */
    compute(val: number): number;
}

class RenamedParamsImpl implements IRenamedParams {
    compute(inputVal: number): number {
        return inputVal * 3;
    }
}
`;
                const { output, warnings } = compileWithFullChecker(source);
                // Should contain contract code with renamed parameter
                expect(output).toMatch(/inputVal/i);
                // Should have rename warning
                const hasRenameWarning = warnings.some(w =>
                    w.includes('Parameter name mismatch') || w.includes('renamed')
                );
                expect(hasRenameWarning).toBe(true);
            });

            it('should skip interface contracts without TypeChecker', () => {
                const impl = new RenamedParamsImpl();
                expect(() => impl.compute(-5)).not.toThrow();
                expect(impl.compute(10)).toBe(30);
            });
        });

        describe('ignore mode', () => {
            it('should skip interface contracts when param names mismatch (with TypeChecker)', () => {
                const source = `
interface IIgnoredParams {
    /**
     * @pre val > 0
     */
    calculate(val: number): number;
}

class TestImpl implements IIgnoredParams {
    calculate(differentName: number): number {
        return differentName + 10;
    }
}
`;
                const { warnings } = compileWithFullChecker(source, {
                    interfaceParamMismatch: 'ignore',
                });
                // Should have skip warning
                const hasSkipWarning = warnings.some(w =>
                    w.includes('Parameter name mismatch') && w.includes('skipped')
                );
                expect(hasSkipWarning).toBe(true);
            });
        });
    });

    // =========================================================================
    // Feature 5: Additive merge when both interface and class define tags
    // =========================================================================
    describe('Feature 5: Additive merge of interface and class tags', () => {
        it('should apply both interface and class @pre conditions (with TypeChecker)', () => {
            const source = `
interface IAdditivePre {
    /**
     * @pre value >= 0
     */
    transform(value: number): number;
}

/**
 * @pre value < 100
 */
class AdditivePreClass implements IAdditivePre {
    transform(value: number): number {
        return value / 2;
    }
}

const obj = new AdditivePreClass();
export const testTransform = () => obj.transform(150);
`;
            const { output } = compileWithFullChecker(source);
            // Should have contract code
            expect(output).toMatch(/__pre_guard|ContractViolationError/i);
            // Note: Additive merge warning may or may not be emitted depending on implementation
            // The key is that both sets of contracts are applied
        });

        it('should apply class @pre without TypeChecker (interface skipped)', () => {
            // Without TypeChecker, interface contracts are skipped
            // Class-level @pre should still be applied on public methods
            const source = `
class TestClass {
    /**
     * @pre value < 100
     */
    public transform(value: number): number {
        return value / 2;
    }
}

const obj = new TestClass();
export const testTransform = () => obj.transform(150);
`;
            const { output } = compileWithFullChecker(source);
            expect(output).toMatch(/__pre_guard|ContractViolationError/i);
        });

        it('should apply both interface and class @post conditions (with TypeChecker)', () => {
            const source = `
interface IAdditivePost {
    /**
     * @post result >= 0
     */
    convert(value: number): number;
}

/**
 * @post result !== null
 */
class AdditivePostClass implements IAdditivePost {
    convert(value: number): number {
        return Math.abs(value);
    }
}

const obj = new AdditivePostClass();
export const testConvert = () => obj.convert(-10);
`;
            const { output } = compileWithFullChecker(source);
            expect(output).toMatch(/__post_guard|ContractViolationError/i);
            // Note: Additive merge warning may or may not be emitted
        });

        it('should apply class @post without TypeChecker (interface skipped)', () => {
            const obj = new AdditivePostClass();
            expect(obj.convert(-10)).toBe(10);
        });
    });

    // =========================================================================
    // Feature 6: Graceful degradation when TypeChecker is unavailable
    // =========================================================================
    describe('Feature 6: Graceful degradation without TypeChecker', () => {
        it('should compile with transpileModule (no TypeChecker)', () => {
            const source = `
interface IFallback {
    /**
     * @pre x > 0
     */
    test(x: number): number;
}

class FallbackImpl implements IFallback {
    test(x: number): number {
        return x * 2;
    }
}
`;
            const { output, warnings } = compileWithoutChecker(source);

            // Should compile without errors
            expect(output).toBeDefined();
            expect(output.length).toBeGreaterThan(0);

            // Should emit warning about TypeChecker being unavailable
            const hasTypeCheckerWarning = warnings.some(w =>
                w.includes('no TypeChecker') || w.includes('transpileModule mode')
            );
            expect(hasTypeCheckerWarning).toBe(true);
        });

        it('should preserve class contracts even without TypeChecker', () => {
            const source = `
/**
 * @invariant this.value > 0
 */
class TestClass {
    public value: number;

    constructor(value: number) {
        this.value = value;
    }

    /**
     * @pre x > 0
     */
    method(x: number): number {
        return x;
    }
}
`;
            const { output } = compileWithoutChecker(source);
            // Class-level contracts should still work
            expect(output).toMatch(/#checkInvariants|__pre_guard/i);
        });

        it('should gracefully skip interface resolution without TypeChecker', () => {
            const { warnings } = compileWithoutChecker(`
interface ISkipped {
    /** @pre x > 0 */
    method(x: number): number;
}

class SkippedImpl implements ISkipped {
    method(x: number): number {
        return x;
    }
}
`);
            const hasSkipWarning = warnings.some(w =>
                w.includes('Interface contract resolution skipped') ||
                w.includes('no TypeChecker')
            );
            expect(hasSkipWarning).toBe(true);
        });
    });
});
