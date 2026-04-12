import { execSync } from 'child_process';
import * as path from 'path';

let _output: string | null = null;

export function getBuildOutput(): string {
    if (_output !== null) return _output;
    try {
        const result = execSync('npm run build:dev', {
            encoding: 'utf8',
            cwd: path.resolve(__dirname, '../..'),
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        _output = result;
    } catch (e: any) {
        // tspc exits non-zero when warnings are emitted — capture both streams
        _output = (e.stdout ?? '') + (e.stderr ?? '');
    }
    return _output;
}
