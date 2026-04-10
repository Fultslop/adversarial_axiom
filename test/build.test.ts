import {execSync} from 'child_process';
import * as os from 'os';
import * as fs from 'fs';

describe('build:dev', () => {
    it('should run npm run build:dev and produce warnings', () => {
        const logFile = `${os.tmpdir()}/axiom_build_${Date.now()}.log`;
        execSync(`cmd.exe /c "scripts\\build-dev.bat ${logFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        const output = fs.readFileSync(logFile, 'utf8');
        const warningMatches = output.match(/\[axiom\] Contract validation warning/g);
        const warningCount = warningMatches ? warningMatches.length : 0;

        expect(warningCount).toBeGreaterThanOrEqual(10);
    });
});
