import { getBuildOutput } from './helpers/build-output';

describe('GLOBAL_IDENTIFIERS Feature Tests', () => {
    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    describe('Built-in constructors', () => {
        it('should NOT warn for Object in contract expression', () => {
            expect(buildOutput).not.toContain('globalObject');
        });

        it('should NOT warn for Array in contract expression', () => {
            expect(buildOutput).not.toContain('globalArray');
        });

        it('should NOT warn for String in contract expression', () => {
            expect(buildOutput).not.toContain('globalString');
        });

        it('should NOT warn for Number in contract expression', () => {
            expect(buildOutput).not.toContain('globalNumber');
        });

        it('should NOT warn for Boolean in contract expression', () => {
            expect(buildOutput).not.toContain('globalBoolean');
        });

        it('should NOT warn for Symbol in contract expression', () => {
            expect(buildOutput).not.toContain('globalSymbol');
        });

        it('should NOT warn for BigInt in contract expression', () => {
            expect(buildOutput).not.toContain('globalBigInt');
        });
    });

    describe('Math namespace', () => {
        it('should NOT warn for Math in contract expression', () => {
            expect(buildOutput).not.toContain('globalMathRange');
            expect(buildOutput).not.toContain('globalMathFloor');
            expect(buildOutput).not.toContain('globalMathCeil');
        });
    });

    describe('JSON namespace', () => {
        it('should NOT warn for JSON in contract expression', () => {
            expect(buildOutput).not.toContain('globalJsonStringify');
            expect(buildOutput).not.toContain('globalJsonParse');
        });
    });

    describe('Date constructor', () => {
        it('should NOT warn for Date in contract expression', () => {
            expect(buildOutput).not.toContain('globalDate');
        });
    });

    describe('RegExp constructor', () => {
        it('should NOT warn for RegExp in contract expression', () => {
            expect(buildOutput).not.toContain('globalRegExp');
        });
    });

    describe('Error constructor', () => {
        it('should NOT warn for Error in contract expression', () => {
            expect(buildOutput).not.toContain('globalError');
        });
    });

    describe('Promise constructor', () => {
        it('should NOT warn for Promise in contract expression', () => {
            expect(buildOutput).not.toContain('globalPromise');
        });
    });

    describe('Utility functions', () => {
        it('should NOT warn for parseInt in contract expression', () => {
            expect(buildOutput).not.toContain('globalParseInt');
        });

        it('should NOT warn for parseFloat in contract expression', () => {
            expect(buildOutput).not.toContain('globalParseFloat');
        });

        it('should NOT warn for isNaN in contract expression', () => {
            expect(buildOutput).not.toContain('globalIsNaN');
        });

        it('should NOT warn for isFinite in contract expression', () => {
            expect(buildOutput).not.toContain('globalIsFinite');
        });

        it('should NOT warn for encodeURIComponent in contract expression', () => {
            expect(buildOutput).not.toContain('globalEncodeURIComponent');
        });

        it('should NOT warn for decodeURIComponent in contract expression', () => {
            expect(buildOutput).not.toContain('globalDecodeURIComponent');
        });
    });

    describe('console', () => {
        it('should NOT warn for console in contract expression', () => {
            expect(buildOutput).not.toContain('globalConsole');
        });
    });

    describe('globalThis', () => {
        it('should NOT warn for globalThis in contract expression', () => {
            expect(buildOutput).not.toContain('globalThisObject');
        });
    });

    describe('arguments', () => {
        it('should NOT warn for arguments in contract expression', () => {
            expect(buildOutput).not.toContain('globalArguments');
        });
    });

    describe('Multiple globals in single contract', () => {
        it('should NOT warn when multiple globals are used together', () => {
            expect(buildOutput).not.toContain('multipleGlobals');
        });
    });

    describe('Complex expressions with globals', () => {
        it('should NOT warn for complex global expressions in @post', () => {
            expect(buildOutput).not.toContain('complexGlobalResult');
        });
    });

    describe('Legacy whitelisted globals still work', () => {
        it('should NOT warn for undefined', () => {
            expect(buildOutput).not.toContain('globalUndefined');
        });

        it('should NOT warn for NaN', () => {
            expect(buildOutput).not.toContain('globalNaN');
        });

        it('should NOT warn for Infinity', () => {
            expect(buildOutput).not.toContain('globalInfinity');
        });
    });

    describe('No false positives', () => {
        it('should NOT contain any [axiom] warnings for GLOBAL_IDENTIFIERS functions', () => {
            // Extract all warnings
            const warningLines = buildOutput
                .split('\n')
                .filter(line => line.includes('[axiom]'));

            // Filter for the functions we just added
            const globalIdentifierFunctions = [
                'globalObject', 'globalArray', 'globalString', 'globalNumber',
                'globalBoolean', 'globalSymbol', 'globalBigInt',
                'globalMathRange', 'globalMathFloor', 'globalMathCeil',
                'globalJsonStringify', 'globalJsonParse',
                'globalDate', 'globalRegExp', 'globalError', 'globalPromise',
                'globalParseInt', 'globalParseFloat', 'globalIsNaN', 'globalIsFinite',
                'globalEncodeURIComponent', 'globalDecodeURIComponent',
                'globalConsole', 'globalThisObject', 'globalArguments',
                'multipleGlobals', 'complexGlobalResult',
                'globalUndefined', 'globalNaN', 'globalInfinity'
            ];

            // Check that none of our global identifier functions appear in warnings
            const functionsWithWarnings = warningLines.filter(line =>
                globalIdentifierFunctions.some(func => line.includes(func))
            );

            expect(functionsWithWarnings).toHaveLength(0);
        });
    });
});
