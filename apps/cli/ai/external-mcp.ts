import { execFile } from 'child_process';
import type { McpStdioServerConfig } from '@anthropic-ai/claude-agent-sdk';

/**
 * Registry of known external MCP servers that Studio Code can connect to.
 * Each entry defines how to detect and launch the server.
 */
interface ExternalMcpServerEntry {
	/** Command to check if the server binary is available (via npx --no-install). */
	detectArgs: string[];
	/** Server config to pass to the Claude Agent SDK. */
	config: McpStdioServerConfig;
	/** Human-readable description for logging. */
	label: string;
}

const EXTERNAL_MCP_SERVERS: Record< string, ExternalMcpServerEntry > = {
	agentation: {
		detectArgs: [ 'agentation-mcp', '--version' ],
		config: {
			command: 'npx',
			args: [ '--yes', 'agentation-mcp', 'server' ],
		},
		label: 'Agentation (visual feedback)',
	},
};

/**
 * Check whether an npm package is available locally (without downloading).
 */
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
		const packageName = entry.detectArgs[ 0 ];
		if ( await isNpxPackageAvailable( packageName ) ) {
			detected[ name ] = entry.config;
		}
	} );

	await Promise.all( checks );
	return detected;
}

/**
 * Get the list of connected external MCP server names for system prompt context.
 */
export function getExternalMcpServerLabels( servers: DetectedMcpServers ): string[] {
	return Object.keys( servers )
		.filter( ( name ) => name in EXTERNAL_MCP_SERVERS )
		.map( ( name ) => EXTERNAL_MCP_SERVERS[ name ].label );
}
