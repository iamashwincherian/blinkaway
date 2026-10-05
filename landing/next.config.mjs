// Static export: `npm run build` writes a plain site to out/ that any static host can serve.
// BASE_PATH is set by the GitHub Pages workflow (project site lives under /blinkaway).
export default { output: 'export', basePath: process.env.BASE_PATH || '', images: { unoptimized: true } }
