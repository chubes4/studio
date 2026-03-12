import { execSync } from 'node:child_process';
import { getMcpServerConfigJson, STUDIO_MCP_SERVER_NAME } from './mcp-config';

export const MCP_CLIENT_ASSISTANTS = [ 'claude-code' ] as const;

type McpClientAssistant = ( typeof MCP_CLIENT_ASSISTANTS )[ number ];

const ASSISTANT_CONFIG: Record< McpClientAssistant, { installUrl: string; displayName: string } > =
	{
		'claude-code': {
			installUrl: 'https://code.claude.com/docs/en/terminal-guide',
			displayName: 'Claude Code',
		},
	};

function isAssistantInstalled( assistant: McpClientAssistant ): boolean {
	if ( assistant === 'claude-code' ) {
		try {
			execSync( 'claude --version', { stdio: 'pipe', encoding: 'utf-8' } );
			return true;
		} catch {
			return false;
		}
	}
	return false;
}

function getAssistantNotInstalledMessage( assistant: McpClientAssistant ): string {
	const { installUrl, displayName } = ASSISTANT_CONFIG[ assistant ];
	return `${ displayName } is not installed. Install it from: ${ installUrl }`;
}

function getErrorMessage( error: unknown ): string {
	if ( error instanceof Error ) {
		const stderr =
			'stderr' in error ? String( ( error as { stderr?: string } ).stderr ?? '' ).trim() : '';
		return stderr || error.message;
	}
	return String( error );
}

export async function configureMcpClient(
	assistant: McpClientAssistant
): Promise< { success: boolean; message?: string } > {
	if ( assistant === 'claude-code' ) {
		if ( ! isAssistantInstalled( assistant ) ) {
			return { success: false, message: getAssistantNotInstalledMessage( assistant ) };
		}
		try {
			execSync(
				`claude mcp add --transport stdio --scope user ${ STUDIO_MCP_SERVER_NAME } -- studio mcp`,
				{ stdio: 'pipe', encoding: 'utf-8' }
			);
			return { success: true };
		} catch ( error ) {
			return { success: false, message: getErrorMessage( error ) || 'Command failed.' };
		}
	}

	return { success: false, message: `Unsupported assistant: ${ assistant }` };
}

export async function unconfigureMcpClient(
	assistant: McpClientAssistant
): Promise< { success: boolean; message?: string } > {
	if ( assistant === 'claude-code' ) {
		if ( ! isAssistantInstalled( assistant ) ) {
			return { success: false, message: getAssistantNotInstalledMessage( assistant ) };
		}
		try {
			execSync( `claude mcp remove ${ STUDIO_MCP_SERVER_NAME } --scope user`, {
				stdio: 'pipe',
				encoding: 'utf-8',
			} );
			return { success: true };
		} catch ( error ) {
			return { success: false, message: getErrorMessage( error ) || 'Command failed.' };
		}
	}

	return { success: false, message: `Unsupported assistant: ${ assistant }` };
}

/**
 * Returns manual configuration instructions for AI assistants that are not
 * supported with auto-configuration via --as. Used when the user runs
 * configure/unconfigure without specifying an assistant.
 */
export function getManualConfigInfo(): string {
	const config = getMcpServerConfigJson();
	const configBlock =
		'{\n  "mcpServers": ' +
		config
			.split( '\n' )
			.map( ( line, i ) => ( i === 0 ? line : '  ' + line ) )
			.join( '\n' ) +
		'\n}';

	const supportedList = MCP_CLIENT_ASSISTANTS.join( ', ' );
	const lines = [
		'',
		'WordPress Studio MCP Server',
		'─'.repeat( 50 ),
		'',
		`Auto-configure is available for: ${ supportedList }.`,
		`Run: studio mcp configure --as ${ supportedList }`,
		'',
		'If your AI assistant is not in the list above, add the following to its MCP configuration:',
		'',
		configBlock,
		'',
	];

	return lines.join( '\n' );
}

/**
 * Returns instructions for removing Studio MCP when no assistant is specified.
 * Used when the user runs unconfigure without --as.
 */
export function getManualUnconfigureInfo(): string {
	const supportedList = MCP_CLIENT_ASSISTANTS.join( ', ' );
	return [
		'',
		'WordPress Studio MCP Server - Remove Configuration',
		'─'.repeat( 50 ),
		'',
		`To remove Studio MCP, run: studio mcp unconfigure --as <assistant>`,
		`Supported assistants: ${ supportedList }`,
		'',
	].join( '\n' );
}
