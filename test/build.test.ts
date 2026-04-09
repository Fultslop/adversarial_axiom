import {execSync} from 'child_process';

describe('build:dev', () => {
    it('should run npm run build:dev and produce exactly 5 warnings', () => {
        const output = execSync('npm run build:dev 2>&1', {encoding: 'utf8'});

        const warningMatches = output.match(/\[fsprepost\] Contract validation warning/g);
        const warningCount = warningMatches ? warningMatches.length : 0;

        expect(warningCount).toBe(5);
    });
});
