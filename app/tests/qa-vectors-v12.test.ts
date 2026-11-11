/** Additional QA-owned revision discovered during final verification; v1.1 remains intact. */
import rawVectors from './fixtures/pricing-engine-test-vectors-v1.2.json';
import { registerVectorSuite } from './qa-vector-bridge';
registerVectorSuite(rawVectors, 'v1.2');
