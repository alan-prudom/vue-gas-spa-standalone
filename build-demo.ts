import * as fs from 'fs-extra';
import * as path from 'path';
import * as esbuild from 'esbuild';

/**
 * Build script for Vue + Bootstrap Demo
 */
async function build() {
    const rootDir = path.resolve(__dirname);
    const buildDir = path.join(rootDir, 'dist');

    // Path in monorepo
    const monorepoLibDist = path.resolve(__dirname, '../../dist/TranslationManager.js');
    // Path in standalone (vendored)
    const standaloneLibDist = path.resolve(__dirname, 'vendor/TranslationManager.js');

    const mainPackageDist = fs.existsSync(monorepoLibDist) ? monorepoLibDist : standaloneLibDist;

    console.log(`[Build] Preparing demo build (using lib from: ${mainPackageDist})`);

    // 1. Clean and create build dir
    if (fs.existsSync(buildDir)) fs.removeSync(buildDir);
    fs.ensureDirSync(buildDir);

    // 2. Copy Code.gs, Index.html and appsscript.json
    fs.copySync(path.join(rootDir, 'Code.gs'), path.join(buildDir, 'Code.gs'));
    fs.copySync(path.join(rootDir, 'Index.html'), path.join(buildDir, 'Index.html'));
    fs.copySync(path.join(rootDir, 'appsscript.json'), path.join(buildDir, 'appsscript.json'));

    // 3. Copy TranslationManager.js from main dist
    if (!fs.existsSync(mainPackageDist)) {
        console.error('[Build] Main package dist not found! Run npm run build in package root first.');
        process.exit(1);
    }

    // Wrap TM in script tags
    let tmSource = fs.readFileSync(mainPackageDist, 'utf8');
    fs.writeFileSync(path.join(buildDir, 'TranslationManager.js.html'), `<script>\n${tmSource}\n</script>`);

    // 4. Bundle Client.ts with esbuild (handles imports properly)
    console.log('[Build] Bundling Client.ts with esbuild...');

    const clientEntry = path.join(rootDir, 'Client.ts');
    const clientOutput = path.join(buildDir, 'Client.temp.js');

    await esbuild.build({
        entryPoints: [clientEntry],
        bundle: true,
        outfile: clientOutput,
        format: 'iife',
        platform: 'browser',
        target: 'es2015',
        minify: false,
        // External dependencies that are already loaded globally
        external: []
    });

    // Read the bundled output and wrap in script tags
    const clientJs = fs.readFileSync(clientOutput, 'utf8');
    fs.writeFileSync(path.join(buildDir, 'Client.js.html'), `<script>\n${clientJs}\n</script>`);

    // Clean up temp file
    fs.removeSync(clientOutput);

    console.log('[Build] Build complete in ./dist');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
