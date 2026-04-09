import { execFile } from 'child_process';
import type { McpStdioServerConfig } from '@anthropic-ai/claude-agent-sdk';

export type DetectedMcpServers = Record< string, McpStdioServerConfig >;

const AGENTATION_PACKAGE = 'agentation-mcp';

async function isNpxPackageAvailable( packageName: string ): Promise< boolean > {
	return new Promise( ( resolve ) => {
		execFile( 'npx', [ '--no-install', packageName, '--version' ], ( error ) => {
			resolve( ! error );
		} );
	} );
}

/**
 * Detect external MCP servers installed on the system.
 * Currently checks for Agentation (visual feedback tool).
 */
export async function detectExternalMcpServers(): Promise< DetectedMcpServers > {
	if ( await isNpxPackageAvailable( AGENTATION_PACKAGE ) ) {
		return {
			agentation: {
				command: 'npx',
				args: [ AGENTATION_PACKAGE, 'server' ],
			},
		};
	}
	return {};
}
