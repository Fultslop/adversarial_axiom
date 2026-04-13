// Acceptance test using full program mode (TypeChecker available)
// This test verifies v0.8.12 properly drops contracts with invalid property chains
import { spawnSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('v0.8.12 full program mode acceptance test', () => {
    const testDir = path.join(__dirname, '..', 'temp-acceptance-test');
    const srcFile = path.join(testDir, 'test-fixture.ts');
    const outFile = path.join(testDir, 'dist', 'test-fixture.js');

    beforeAll(() => {
        // Create temp directory
        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
        }
        if (!fs.existsSync(path.join(testDir, 'dist'))) {
            fs.mkdirSync(path.join(testDir, 'dist'), { recursive: true });
        }
    });

    afterAll(() => {
        // Cleanup
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    it('should drop contract with invalid property chain in full program mode', () => {
        // Create a test fixture with invalid property chain
        const fixture = `
/**
 * @pre config.missing.value > 0
 */
export function invalidParamChain(config: { value: number }): boolean {
    return config.value > 0;
}
`;

        fs.writeFileSync(srcFile, fixture);

        // Create tsconfig for full program mode compilation
        const tsconfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                outDir: './dist',
                strict: true,
                plugins: [{
                    transform: '@fultslop/axiom/dist/src/transformer'
                }]
            },
            include: ['*.ts']
        };

        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

        // Compile with tspc (full program mode)
        const result = spawnSync('npx', ['tspc'], {
            encoding: 'utf8',
            cwd: testDir,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const buildOutput = result.stdout + result.stderr;
        console.log('Build output:', buildOutput);

        // Verify warning is emitted
        expect(buildOutput).toContain('property \'missing\' does not exist');

        // Read compiled output
        expect(fs.existsSync(outFile)).toBe(true);
        const compiledCode = fs.readFileSync(outFile, 'utf8');
        console.log('Compiled code:', compiledCode);

        // Verify contract guard is NOT injected (contract was dropped)
        expect(compiledCode).not.toContain('ContractViolationError');
        // Note: JSDoc comment is preserved, but the guard code is NOT injected
        // Check that no guard logic exists (only JSDoc comment contains the expression)
        const lines = compiledCode.split('\n').filter(line => 
            line.includes('config.missing.value') && 
            !line.trim().startsWith('*') &&  // Ignore JSDoc comments
            !line.trim().startsWith('//')    // Ignore regular comments
        );
        expect(lines.length).toBe(0);  // No executable code with invalid chain

        // Verify the function body is preserved
        expect(compiledCode).toContain('config.value > 0');
    });

    it('should preserve contract with valid property chain in full program mode', () => {
        // Create a test fixture with VALID property chain
        const fixture = `
/**
 * @pre config.settings.threshold > 0
 */
export function validParamChain(config: { settings: { threshold: number } }): boolean {
    return config.settings.threshold > 0;
}
`;

        const validSrcFile = path.join(testDir, 'valid-fixture.ts');
        const validOutFile = path.join(testDir, 'dist', 'valid-fixture.js');

        fs.writeFileSync(validSrcFile, fixture);

        // Update tsconfig to include both files
        const tsconfig = {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                outDir: './dist',
                strict: true,
                plugins: [{
                    transform: '@fultslop/axiom/dist/src/transformer'
                }]
            },
            include: ['*.ts']
        };

        fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

        // Compile with tspc (full program mode)
        const result = spawnSync('npx', ['tspc'], {
            encoding: 'utf8',
            cwd: testDir,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const buildOutput = result.stdout + result.stderr;
        console.log('Build output (valid):', buildOutput);

        // Verify NO warning for valid property chain
        expect(buildOutput).not.toContain('property \'settings\' does not exist');
        expect(buildOutput).not.toContain('property \'threshold\' does not exist');

        // Read compiled output
        expect(fs.existsSync(validOutFile)).toBe(true);
        const compiledCode = fs.readFileSync(validOutFile, 'utf8');
        console.log('Compiled code (valid):', compiledCode);

        // Verify contract guard IS injected (contract preserved)
        expect(compiledCode).toContain('ContractViolationError');
        expect(compiledCode).toContain('config.settings.threshold > 0');
    });
});
