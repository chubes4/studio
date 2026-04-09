import { execFile } from 'child_process';
import type { McpStdioServerConfig } from '@anthropic-ai/claude-agent-sdk';

interface ExternalMcpServerEntry {
	/** npm package name to detect via npx --no-install. */
	packageName: string;
	/** Server config to pass to the Claude Agent SDK. */
	config: McpStdioServerConfig;
}

const EXTERNAL_MCP_SERVERS: Record< string, ExternalMcpServerEntry > = {
	agentation: {
		packageName: 'agentation-mcp',
		config: {
			command: 'npx',
			args: [ '--yes', 'agentation-mcp', 'server' ],
		},
	},
};

async function isNpxPackageAvailable( packageName: string ): Promise< boolean > {
	return new Promise( ( resolve ) => {
		execFile( 'npx', [ '--no-install', packageName, '--version' ], ( error ) => {
			resolve( ! error );
		} );
	} );
}

export type DetectedMcpServers = Record< string, McpStdioServerConfig >;

/**
 * Detect which external MCP servers are installed and available.
 * Returns a map of server name to stdio config for each detected server.
 */
export async function detectExternalMcpServers(): Promise< DetectedMcpServers > {
	const detected: DetectedMcpServers = {};

	const checks = Object.entries( EXTERNAL_MCP_SERVERS ).map( async ( [ name, entry ] ) => {
		if ( await isNpxPackageAvailable( entry.packageName ) ) {
			detected[ name ] = entry.config;
		}
	} );

	await Promise.all( checks );
	return detected;
}
