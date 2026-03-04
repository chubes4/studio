import { execFile } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { getBundledNodeBinaryPath, getCliPath } from 'src/storage/paths';
import {
	getMcpInstallDir,
	getMcpServerDir,
	getMcpBinDir,
	getMcpBinScript,
	getMcpVersionFile,
} from './mcp-paths';

const MCP_RELEASES_API_URL =
	'https://api.github.com/repos/nightnei/wordpress-developer-mcp-server/releases';

async function isMcpServerInstalled(): Promise< boolean > {
	return fs.pathExists( getMcpVersionFile() );
}

async function fetchLatestRelease(): Promise< {
	tag_name: string;
	assets: { name: string; browser_download_url: string }[];
} > {
	const response = await fetch( `${ MCP_RELEASES_API_URL }/latest`, {
		headers: {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'WordPress-Studio',
		},
	} );

	if ( ! response.ok ) {
		throw new Error( `Failed to fetch latest MCP server release: ${ response.statusText }` );
	}

	return response.json();
}

async function downloadAndExtractTarball( url: string, destDir: string ): Promise< void > {
	const tmpDir = await fs.mkdtemp( path.join( os.tmpdir(), 'mcp-server-' ) );
	const tarballPath = path.join( tmpDir, 'mcp-server.tar.gz' );

	try {
		const response = await fetch( url, {
			headers: { 'User-Agent': 'WordPress-Studio' },
		} );

		if ( ! response.ok ) {
			throw new Error( `Download failed: ${ response.statusText }` );
		}

		const buffer = Buffer.from( await response.arrayBuffer() );
		await fs.writeFile( tarballPath, buffer );
		await fs.ensureDir( destDir );

		await new Promise< void >( ( resolve, reject ) => {
			execFile( 'tar', [ '-xzf', tarballPath, '-C', destDir ], ( error ) => {
				if ( error ) {
					reject( new Error( `Failed to extract MCP server: ${ error.message }` ) );
				} else {
					resolve();
				}
			} );
		} );
	} finally {
		await fs.remove( tmpDir ).catch( () => {} );
	}
}

function createWrapperScript(
	scriptPath: string,
	nodeBinaryPath: string,
	entryPoint: string
): void {
	const content = `#!/bin/bash\n"${ nodeBinaryPath }" "${ entryPoint }" "$@"\n`;
	fs.writeFileSync( scriptPath, content, { mode: 0o755 } );
}

function refreshWrapperScripts(): void {
	const nodeBinaryPath = getBundledNodeBinaryPath();
	const cliMainPath = getCliPath();

	fs.ensureDirSync( getMcpBinDir() );

	createWrapperScript(
		getMcpBinScript( 'studio-mcp' ),
		nodeBinaryPath,
		path.join( getMcpServerDir(), 'index.js' )
	);
	createWrapperScript( getMcpBinScript( 'studio-cli' ), nodeBinaryPath, cliMainPath );
}

export async function setupMcpServer(): Promise< void > {
	// TODO: Add support for Windows
	if ( process.platform !== 'darwin' ) {
		return;
	}

	await fs.ensureDir( getMcpInstallDir() );

	// TODO: consider updating the version here if there is a new release or consider theoretical idea to allow MCP update itself automatically
	if ( ! ( await isMcpServerInstalled() ) ) {
		console.log( 'MCP server not found, downloading...' );
		const release = await fetchLatestRelease();
		const version = release.tag_name;
		const asset = release.assets.find( ( a ) => a.name.endsWith( '.tar.gz' ) );
		if ( ! asset ) {
			throw new Error( `No tarball asset found in MCP server release ${ version }` );
		}

		await downloadAndExtractTarball( asset.browser_download_url, getMcpServerDir() );
		await fs.writeFile( getMcpVersionFile(), version );
		console.log( `MCP server ${ version } installed.` );
	}

	refreshWrapperScripts();
	// TODO should we also refresh claude config here if it's configured (dev / prod / reset previous bash)
}