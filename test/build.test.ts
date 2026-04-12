import { getBuildOutput } from './helpers/build-output';

describe('build:dev', () => {
    it('should run npm run build:dev and produce warnings', () => {
        const output = getBuildOutput();
        const warningMatches = output.match(/\[axiom\] Contract validation warning/g);
        const warningCount = warningMatches ? warningMatches.length : 0;
        expect(warningCount).toBeGreaterThanOrEqual(10);
    });
});
