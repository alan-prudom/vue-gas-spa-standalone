import * as fs from 'fs-extra';
import * as path from 'path';
import * as esbuild from 'esbuild';

// Root of the monorepo
const ROOT = path.join(__dirname, '../../../../../');
const BUILD_ROOT = path.join(ROOT, 'build');
const APP_BUILD_DIR = path.join(BUILD_ROOT, 'VueDemo');
const SOURCE_DIR = path.join(__dirname, '../');

// Package-specific paths
const TM_DIST_PATH = path.join(ROOT, 'Shared/TranslationManager/dist/TranslationManager.js');
const CLIENT_JS_PATH = path.join(APP_BUILD_DIR, 'Client.js');
const SOURCE_INDEX_PATH = path.join(SOURCE_DIR, 'Index.html');
const DEST_INDEX_PATH = path.join(APP_BUILD_DIR, 'Index.html');
const SOURCE_MANIFEST_PATH = path.join(SOURCE_DIR, 'appsscript.json');
const DEST_MANIFEST_PATH = path.join(APP_BUILD_DIR, 'appsscript.json');

const START_MARKER = '<!-- CLIENT_CODE_START -->';
const END_MARKER = '<!-- CLIENT_CODE_END -->';

async function bundleClient() {
    console.log('[VueDemo] Bundling Client with esbuild...');
    try {
        const result = await esbuild.build({
            entryPoints: [path.join(SOURCE_DIR, 'Client.ts')],
            bundle: true,
            minify: false,
            sourcemap: 'inline',
            target: 'es2019',
            format: 'iife',
            external: ['google', 'Shared'],
            write: false,
            loader: { '.ts': 'ts' },
        });
        return result.outputFiles[0].text;
    } catch (e) {
        console.error('[VueDemo] Bundling FAILED:', e);
        throw e;
    }
}

async function buildApp() {
    console.log('[VueDemo] Starting App Build...');

    if (!fs.existsSync(APP_BUILD_DIR)) {
        fs.ensureDirSync(APP_BUILD_DIR);
    }

    // 1. Collect Bundled Code
    const clientJs = await bundleClient();

    // 2. Load Translation Manager Lib
    let tmLibJs = '';
    if (fs.existsSync(TM_DIST_PATH)) {
        console.log('[VueDemo] Loading TranslationManager library...');
        tmLibJs = fs.readFileSync(TM_DIST_PATH, 'utf8');
    } else {
        console.warn(`[VueDemo] Warning: TranslationManager dist not found at ${TM_DIST_PATH}. Make sure to build the package first.`);
    }

    // 3. Inject Client Code
    let indexHtml = fs.readFileSync(SOURCE_INDEX_PATH, 'utf8');

    const currentStartIndex = indexHtml.indexOf(START_MARKER);
    const currentEndIndex = indexHtml.indexOf(END_MARKER);

    if (currentStartIndex === -1 || currentEndIndex === -1) {
        console.error('[VueDemo] Injection markers not found in Index.html.');
        process.exit(1);
    }

    // We inject the library AND the client code
    const injection = `${START_MARKER}\n    <script>\n${tmLibJs}\n${clientJs}\n    </script>\n    `;

    const before = indexHtml.substring(0, currentStartIndex);
    const after = indexHtml.substring(currentEndIndex + END_MARKER.length);
    let finalHtml = before + injection + END_MARKER + after;

    fs.writeFileSync(DEST_INDEX_PATH, finalHtml, 'utf8');
    console.log(`[VueDemo] Injected Index.html written to ${DEST_INDEX_PATH}`);

    // 4. Copy Manifest & Clasp
    if (fs.existsSync(SOURCE_MANIFEST_PATH)) {
        fs.copySync(SOURCE_MANIFEST_PATH, DEST_MANIFEST_PATH);
    }
    const SOURCE_IGNORE_PATH = path.join(SOURCE_DIR, '.claspignore');
    const DEST_IGNORE_PATH = path.join(APP_BUILD_DIR, '.claspignore');
    if (fs.existsSync(SOURCE_IGNORE_PATH)) {
        fs.copySync(SOURCE_IGNORE_PATH, DEST_IGNORE_PATH);
    }
    const SOURCE_CLASP_PATH = path.join(SOURCE_DIR, '.clasp.json');
    const DEST_CLASP_PATH = path.join(APP_BUILD_DIR, '.clasp.json');
    if (fs.existsSync(SOURCE_CLASP_PATH)) {
        // Update .clasp.json rootDir to "." for the build directory
        const claspConfig = fs.readJsonSync(SOURCE_CLASP_PATH);
        claspConfig.rootDir = ".";
        fs.writeJsonSync(DEST_CLASP_PATH, claspConfig, { spaces: 4 });
    }

    // 5. Copy server-side Code.gs
    const SOURCE_CODE_GS = path.join(SOURCE_DIR, 'Code.gs');
    const DEST_CODE_GS = path.join(APP_BUILD_DIR, 'Code.gs');
    if (fs.existsSync(SOURCE_CODE_GS)) {
        fs.copySync(SOURCE_CODE_GS, DEST_CODE_GS);
    }

    console.log('[VueDemo] Build Complete.');
}

buildApp().catch(console.error);
