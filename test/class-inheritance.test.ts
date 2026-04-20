// Phase A: Happy Path Validation — Class Inheritance Contracts
// Tests CI-A1 through CI-A6 from the acceptance plan
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Class Inheritance Contracts — Phase A: Happy Path', () => {
    const testDir = path.join(__dirname, '..', 'temp-class-inheritance');
    const srcDir  = path.join(testDir, 'src');
    const outDir  = path.join(testDir, 'dist');

    beforeAll(() => {
        fs.mkdirSync(srcDir, { recursive: true });
        fs.mkdirSync(outDir, { recursive: true });
    });

    afterAll(() => {
        fs.rmSync(testDir, { recursive: true, force: true });
    });

    /**
     * Compile a TypeScript fixture with the axiom transformer and optionally execute it.
     */
    function compileAndRun(
        fixture: string,
        testName: string,
        testCall?: string,
    ): { output: string; compiled: string; exitCode: number; success: boolean } {
        const srcFile = path.join(srcDir, `${testName}.ts`);
        const outFile = path.join(outDir, `${testName}.js`);

        fs.writeFileSync(srcFile, fixture);

        const transformerPath = path.join(
            __dirname, '..', 'node_modules', '@fultslop', 'axiom', 'dist', 'src', 'transformer.js',
        );
        const tsconfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                outDir: './dist',
                rootDir: './src',
                strict: true,
                plugins: [{ transform: transformerPath, diagnostics: true }],
            },
            include: ['src/**/*.ts'],
        };
        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

        const tscResult = spawnSync('npx', ['tspc'], {
            cwd: testDir,
            encoding: 'utf-8',
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (tscResult.status !== 0) {
            return {
                output: tscResult.stderr || tscResult.stdout || '',
                compiled: '',
                exitCode: tscResult.status ?? 1,
                success: false,
            };
        }

        const compiled = fs.readFileSync(outFile, 'utf-8');

        if (testCall === undefined) {
            return { output: '', compiled, exitCode: 0, success: true };
        }

        const testRunner = path.join(outDir, `${testName}_runner.js`);
        fs.writeFileSync(testRunner, `
const { ${testName} } = require('./${testName}');
async function main() {
    try {
        const result = await (${testCall});
        console.log('RESULT:', JSON.stringify(result));
    } catch (e) {
        console.log('ERROR:', e.constructor.name, e.message);
    }
}
main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
`);

        const runResult = spawnSync('node', [testRunner], {
            cwd: outDir,
            encoding: 'utf-8',
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        return {
            output: (runResult.stdout || '') + (runResult.stderr || ''),
            compiled,
            exitCode: runResult.status ?? 1,
            success: runResult.status === 0,
        };
    }

    // ==========================================
    // CI-A1: @pre propagates from base to subclass — violation throws
    // ==========================================
    it('CI-A1: @pre propagates from base to subclass — violation throws', () => {
        const fixture = `
class Animal {
    /**
     * @pre amount > 0
     */
    public feed(amount: number): void {
        console.log('Animal.feed');
    }
}

class Dog extends Animal {
    public feed(amount: number): void {
        console.log('Dog.feed');
    }
}

export const ciA1 = () => new Dog().feed(-1);
`;
        const result = compileAndRun(fixture, 'ciA1', 'ciA1()');
        expect(result.success).toBe(true);
        expect(result.output).toContain('ContractViolationError');
        expect(result.compiled).toContain('ContractViolationError("PRE"');
    });

    // ==========================================
    // CI-A2: @pre propagates — valid call passes
    // ==========================================
    it('CI-A2: @pre propagates — valid call passes', () => {
        const fixture = `
class Animal {
    /**
     * @pre amount > 0
     */
    public feed(amount: number): void {
        console.log('Animal.feed');
    }
}

class Dog extends Animal {
    public feed(amount: number): void {
        console.log('Dog.feed');
    }
}

export const ciA2 = () => { new Dog().feed(5); return 'ok'; };
`;
        const result = compileAndRun(fixture, 'ciA2', 'ciA2()');
        expect(result.success).toBe(true);
        expect(result.output).toContain('RESULT:');
        expect(result.output).not.toContain('ERROR');
    });

    // ==========================================
    // CI-A3: @post propagates from base to subclass
    // ==========================================
    it('CI-A3: @post propagates from base to subclass', () => {
        const fixture = `
class Animal {
    public energy: number = 0;
    /**
     * @post this.energy > 0
     */
    public feed(amount: number): void {
        this.energy = -1; // violates the postcondition
    }
}

class Dog extends Animal {
    public feed(amount: number): void {
        this.energy = -1;
    }
}

export const ciA3 = () => new Dog().feed(1);
`;
        const result = compileAndRun(fixture, 'ciA3', 'ciA3()');
        expect(result.success).toBe(true);
        expect(result.output).toContain('ContractViolationError');
        expect(result.compiled).toContain('ContractViolationError("POST"');
    });

    // ==========================================
    // CI-A4: @invariant propagates from base to subclass
    // ==========================================
    it('CI-A4: @invariant propagates from base to subclass', () => {
        const fixture = `
/**
 * @invariant this.energy >= 0
 */
class Animal {
    public energy: number = 0;
    public feed(amount: number): void {
        this.energy = -5; // violates invariant
    }
}

class Dog extends Animal {
    public feed(amount: number): void {
        this.energy = -5;
    }
}

export const ciA4 = () => new Dog().feed(1);
`;
        const result = compileAndRun(fixture, 'ciA4', 'ciA4()');
        expect(result.success).toBe(true);
        expect(result.output).toContain('InvariantViolationError');
        expect(result.compiled).toContain('InvariantViolationError');
    });

    // ==========================================
    // CI-A5: Additive merge — both guards pass on valid call
    // ==========================================
    it('CI-A5: additive merge — both guards pass on valid call', () => {
        const fixture = `
class Animal {
    /**
     * @pre amount > 0
     */
    public feed(amount: number): void {
        console.log('Animal.feed');
    }
}

class Dog extends Animal {
    /**
     * @pre amount < 1000
     */
    public feed(amount: number): void {
        console.log('Dog.feed');
    }
}

export const ciA5 = () => { new Dog().feed(5); return 'ok'; };
`;
        const result = compileAndRun(fixture, 'ciA5', 'ciA5()');
        expect(result.success).toBe(true);
        expect(result.output).toContain('RESULT:');
        expect(result.output).not.toContain('ERROR');
        // Merge warning may or may not appear; key is call succeeds
    });

    // ==========================================
    // CI-A6: No injection for unrelated Dog method
    // ==========================================
    it('CI-A6: no injection for unrelated Dog method (bark)', () => {
        const fixture = `
class Animal {
    /**
     * @pre amount > 0
     */
    public feed(amount: number): void {
        console.log('Animal.feed');
    }
}

class Dog extends Animal {
    public bark(): void {
        console.log('Dog.bark');
    }
}

export const ciA6_bark = () => { new Dog().bark(); return 'ok'; };
`;
        const compileResult = compileAndRun(fixture, 'ciA6_bark');
        expect(compileResult.success).toBe(true);
        // Extract the Dog.bark() method body — it should NOT contain ContractViolationError
        const dogBarkMethodMatch = compileResult.compiled.match(/class Dog extends Animal[\s\S]*?bark\(\)[\s\S]*?\{[\s\S]*?\}/);
        expect(dogBarkMethodMatch).not.toBeNull();
        const barkBody = dogBarkMethodMatch![0];
        expect(barkBody).not.toContain('ContractViolationError');
    });

    it('CI-A6b: feed(-1) throws from inherited Animal @pre', () => {
        const fixture = `
class Animal {
    /**
     * @pre amount > 0
     */
    public feed(amount: number): void {
        console.log('Animal.feed');
    }
}

class Dog extends Animal {
    public bark(): void {
        console.log('Dog.bark');
    }
}

export const ciA6_violation = () => new Dog().feed(-1);
`;
        const runResult = compileAndRun(fixture, 'ciA6_violation', 'ciA6_violation()');
        expect(runResult.success).toBe(true);
        expect(runResult.output).toContain('ContractViolationError');
    });
});
