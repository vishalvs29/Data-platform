import { runIntelligencePipeline } from '../src/services/intelligence';

describe('Intelligence Engine', () => {
    it('should be defined', () => {
        expect(runIntelligencePipeline).toBeDefined();
    });

    it('should export a function', () => {
        expect(typeof runIntelligencePipeline).toBe('function');
    });
});
