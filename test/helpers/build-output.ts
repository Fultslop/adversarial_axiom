import { spawnSync } from 'child_process';
import * as path from 'path';

let _output: string | null = null;

export function getBuildOutput(forceRebuild = false): string {
    if (_output !== null && !forceRebuild) return _output;
    const result = spawnSync('npx', ['tspc', '-p', 'tsconfig.dev.json'], {
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
    });
    _output = (result.stdout ?? '') + (result.stderr ?? '');
    return _output;
}
