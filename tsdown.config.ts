import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['cjs', 'esm', 'iife'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2020',
    platform: 'neutral',
    external: [
        'byte-data',
        'collections/sorted-map',
    ],
    globalName: 'DCBOR',
    globals: {
        'byte-data': 'byteData',
        'collections/sorted-map': 'SortedMap',
    },
})
