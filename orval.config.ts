import { defineConfig } from 'orval';

export default defineConfig({
  edcraft: {
    input: { target: 'http://localhost:8000/openapi.json' },
    output: {
      target: 'src/api/edcraftClient.ts',
      schemas: 'src/api/models',
      client: 'axios',
      override: {
        mutator: {
          path: './src/api/axiosInstance.ts',
          name: 'axiosInstance',
        },
      },
    },
  },
});
