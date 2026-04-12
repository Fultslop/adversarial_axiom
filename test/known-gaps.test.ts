import { getBuildOutput } from './helpers/build-output';

describe('Known limitation gap tests', () => {

    let buildOutput: string;

    beforeAll(() => {
        buildOutput = getBuildOutput();
    });

    // 1.26: Template literal — type mismatch not detected
    describe('template literal (1.26)', () => {
        it('should not detect type mismatch with template literal', () => {
            expect(buildOutput).not.toContain('templateLiteralPre');
        });
    });

    // 8.5: Multi-level property chain — only root checked
    describe('multi-level property chain (8.5)', () => {
        it('should only check root this, not intermediate properties', () => {
            expect(buildOutput).not.toContain('MultiLevelAccess');
        });
    });
});
