import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // QA harness reads its vectors from QA_VECTORS; point it at the in-repo copy
    // so CI and fresh clones do not depend on any machine-specific absolute path.
    env: {
      QA_VECTORS: fileURLToPath(new URL('./tests/fixtures/qa/pricing-engine-test-vectors.json', import.meta.url)),
    },
  },
});
