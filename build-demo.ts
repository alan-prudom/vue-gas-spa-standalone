import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Build script for Vue + Bootstrap Demo
 */
async function build() {
    const rootDir = path.resolve(__dirname);
    const buildDir = path.join(rootDir, 'dist');
    const mainPackageDist = path.resolve(__dirname, '../../dist/TranslationManager.js');

    console.log('[Build] Preparing demo build...');

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

    // 4. Properly transpile Client.ts to JavaScript
    console.log('[Build] Transpiling Client.ts...');
    const clientSource = fs.readFileSync(path.join(rootDir, 'Client.ts'), 'utf8');

    const transpiled = ts.transpileModule(clientSource, {
        compilerOptions: {
            module: ts.ModuleKind.None,
            target: ts.ScriptTarget.ES5,
            noEmitHelpers: false
        }
    });

    fs.writeFileSync(path.join(buildDir, 'Client.js.html'), `<script>\n${transpiled.outputText}\n</script>`);

    console.log('[Build] Build complete in ./dist');
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
