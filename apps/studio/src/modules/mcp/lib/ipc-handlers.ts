import { getMcpBinScript } from './mcp-paths';

/**
 * Returns the MCP server JSON config block that users can copy into any
 * AI assistant's MCP settings.
 */
export async function getMcpServerConfig(): Promise< string > {
	const mcpCommand = getMcpBinScript( 'studio-mcp' );

	const config = {
		'wordpress-studio': {
			command: mcpCommand,
		},
	};

	return JSON.stringify( config, null, 2 );
}
