import { execFile } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { getResourcesPath } from 'src/storage/paths';
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

function createWrapperScripts(): void {
	const resourcesPath = getResourcesPath();
	const studioNodePath = path.join( resourcesPath, 'bin', 'node' );
	const studioCliPath = path.join( resourcesPath, 'cli', 'main.js' );
	const mcpEntryPoint = path.join( getMcpServerDir(), 'index.js' );
	const cliScriptPath = getMcpBinScript( 'studio-cli' );

	const nodeResolution = `STUDIO_NODE="${ studioNodePath }"

if [ -x "$STUDIO_NODE" ]; then
  NODE="$STUDIO_NODE"
else
  NODE="node"
fi`;

	fs.ensureDirSync( getMcpBinDir() );

	const mcpScript = `#!/bin/bash
${ nodeResolution }

export STUDIO_CLI_PATH="${ cliScriptPath }"
"$NODE" "${ mcpEntryPoint }" "$@"
`;
	fs.writeFileSync( getMcpBinScript( 'studio-mcp' ), mcpScript, { mode: 0o755 } );

	const cliScript = `#!/bin/bash
${ nodeResolution }

"$NODE" "${ studioCliPath }" "$@"
`;
	fs.writeFileSync( getMcpBinScript( 'studio-cli' ), cliScript, { mode: 0o755 } );
}

export async function setupMcpServer(): Promise< void > {
	// TODO: Add support for Windows
	if ( process.platform !== 'darwin' ) {
		return;
	}

	await fs.ensureDir( getMcpInstallDir() );

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

	if (
		! fs.pathExistsSync( getMcpBinScript( 'studio-mcp' ) ) ||
		! fs.pathExistsSync( getMcpBinScript( 'studio-cli' ) )
	) {
		createWrapperScripts();
	}
}
