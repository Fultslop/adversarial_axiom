import {execSync} from 'child_process';
import * as os from 'os';
import * as fs from 'fs';

describe('Build warnings (Phase 12)', () => {

    let buildOutput: string;

    beforeAll(() => {
        const logFile = `${os.tmpdir()}/fsprepost_warnings_${Date.now()}.log`;
        execSync(`cmd.exe /c "scripts\\build-dev.bat ${logFile}"`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        buildOutput = fs.readFileSync(logFile, 'utf8');
    });

    // 12.3: Warning for unknown identifier
    describe('unknown identifier warning (12.3)', () => {
        it('should warn when @pre references non-parameter v', () => {
            expect(buildOutput).toContain('v');
            expect(buildOutput).toContain('[fsprepost]');
            expect(buildOutput).toContain('shouldWarnVDoesNotExistsDuringBuild');
        });
    });

    // 12.4: Warning for type mismatch
    describe('type mismatch warning (12.4)', () => {
        it('should warn when @pre v === "foo" on number param', () => {
            expect(buildOutput).toContain('shouldWarnVNotCorrectType');
            expect(buildOutput).toContain('type mismatch');
        });

        it('should warn when @post result === "foo" on number return', () => {
            expect(buildOutput).toContain('shouldWarnResultNotCorrectType');
            expect(buildOutput).toContain('type mismatch');
        });
    });

    // 12.5: Warning for assignment expression
    describe('assignment expression warning (12.5)', () => {
        it('should warn when @pre v = 5 (assignment)', () => {
            expect(buildOutput).toContain('shouldWarnAssignmentDuringBuild');
            expect(buildOutput).toContain('assignment');
        });
    });

    // 12.6: Zero warnings on clean contract code
    describe('clean fixtures (12.6)', () => {
        it('should not produce warnings for valid contracts in phase1-fixtures', () => {
            expect(buildOutput).not.toContain('phase1-fixtures');
        });
    });
});
