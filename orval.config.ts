import { defineConfig } from 'orval';

export default defineConfig({
  edcraft: {
    input: {
      target: 'http://localhost:8000/openapi.json',
    },
    output: {
      mode: 'split',
      target: './src/generated/api.ts',
      schemas: './src/generated/models',
      client: 'react-query',
      mock: false,
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      override: {
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
        },
      },
    },
  },
});
