const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testDir = path.join(__dirname, 'temp-v090-debug');
const srcDir = path.join(testDir, 'src');
const outDir = path.join(testDir, 'dist');
fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const fixture = `
/** @pre x > 0 */
export const arrowWithPre = (x: number): number => x;
`;
fs.writeFileSync(path.join(srcDir, 'arrowWithPre.ts'), fixture);

const transformerPath = path.join(__dirname, 'node_modules', '@fultslop', 'axiom', 'dist', 'src', 'transformer.js');
const tsconfig = {
    compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        outDir: './dist',
        rootDir: '.',
        strict: true,
        plugins: [{ transform: transformerPath }],
    },
    include: ['src/**/*.ts'],
};
fs.writeFileSync(path.join(testDir, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

const projectRoot = __dirname;
const tscResult = spawnSync('npx', ['tsc', '-p', testDir], {
    cwd: projectRoot,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
});

console.log('Status:', tscResult.status);
console.log('Stdout:', tscResult.stdout);
console.log('Stderr:', tscResult.stderr);
console.log('OutDir contents:', JSON.stringify(fs.readdirSync(outDir)));
const outSrcDir = path.join(outDir, 'src');
if (fs.existsSync(outSrcDir)) {
    console.log('out/src contents:', JSON.stringify(fs.readdirSync(outSrcDir)));
}
const outFile = path.join(outDir, 'src', 'arrowWithPre.js');
if (fs.existsSync(outFile)) {
    console.log('Compiled:', fs.readFileSync(outFile, 'utf-8'));
} else {
    console.log('No compiled file found at:', outFile);
}
fs.rmSync(testDir, { recursive: true, force: true });
