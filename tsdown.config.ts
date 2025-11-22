import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['iife', 'cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    globalName: 'DCBOR',
    noExternal: ['byte-data', 'collections/sorted-map'],
})
