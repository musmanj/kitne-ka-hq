import rawVectors from './fixtures/pricing-engine-test-vectors.json';
import { registerVectorSuite } from './qa-vector-bridge';
registerVectorSuite(rawVectors, 'v1.1');
