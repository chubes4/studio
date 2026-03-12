/**
 * Generates the MCP server configuration block that users add to their
 * AI assistant's settings. Shared between the CLI `studio mcp` command
 * and the Studio desktop Settings dialog.
 */

export const STUDIO_MCP_SERVER_NAME = 'wordpress-studio';

export function getMcpServerConfig(): Record< string, { command: string; args: string[] } > {
	return {
		[ STUDIO_MCP_SERVER_NAME ]: {
			command: 'studio',
			args: [ 'mcp' ],
		},
	};
}

export function getMcpServerConfigJson(): string {
	return JSON.stringify( getMcpServerConfig(), null, 2 );
}
