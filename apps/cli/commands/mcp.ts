import {
	configureMcpClient,
	getManualConfigInfo,
	getManualUnconfigureInfo,
	MCP_CLIENT_ASSISTANTS,
	unconfigureMcpClient,
} from '@studio/common/lib/mcp-client-config';
import { getMcpServerConfigJson } from '@studio/common/lib/mcp-config';
import { __, sprintf } from '@wordpress/i18n';
import { startMcpStdioServer } from 'cli/ai/mcp-server';
import { Logger, LoggerError } from 'cli/logger';
import { StudioArgv } from 'cli/types';

const logger = new Logger< string >();

function printInstallationInstructions(): void {
	const config = getMcpServerConfigJson();

	const lines = [
		'',
		__( 'WordPress Studio MCP Server' ),
		'─'.repeat( 40 ),
		'',
		__( "Add the following to your AI assistant's MCP configuration:" ),
		'',
		'{',
		'  "mcpServers": ' +
			config
				.split( '\n' )
				.map( ( line, i ) => ( i === 0 ? line : '  ' + line ) )
				.join( '\n' ),
		'}',
		'',
		__( 'Configuration file locations:' ),
		'',
		'  Claude Desktop',
		'    macOS  ~/Library/Application\\ Support/Claude/claude_desktop_config.json',
		'    Win    %APPDATA%\\Claude\\claude_desktop_config.json',
		'  Claude Code: ~/.claude.json',
		'',
	];

	for ( const line of lines ) {
		console.log( line );
	}
}

export async function runCommand(): Promise< void > {
	if ( process.stdin.isTTY && process.stdout.isTTY ) {
		printInstallationInstructions();
		return;
	}

	await startMcpStdioServer();
}

const AS_OPTION = {
	as: {
		alias: 'a',
		type: 'string' as const,
		choices: MCP_CLIENT_ASSISTANTS,
		describe: sprintf( __( 'AI assistant to configure (%s)' ), MCP_CLIENT_ASSISTANTS.join( ', ' ) ),
	},
};

export const registerCommand = ( yargs: StudioArgv ) => {
	return yargs.command( {
		command: 'mcp',
		describe: __( 'MCP server for AI assistants' ),
		builder: ( mcpYargs ) => {
			return mcpYargs
				.option( 'help', { type: 'boolean' } )
				.option( 'path', { hidden: true } )
				.command( {
					command: 'configure',
					describe: __( 'Configure Studio MCP in your AI assistant' ),
					builder: ( cmdYargs ) => cmdYargs.options( AS_OPTION ),
					handler: async ( argv ) => {
						const assistant = argv.as;
						if ( assistant ) {
							const result = await configureMcpClient( assistant );
							if ( result.success ) {
								console.log(
									sprintf( __( 'Studio MCP configured successfully for %s.' ), assistant )
								);
							} else {
								console.error( sprintf( __( 'Failed to configure: %s' ), result.message ?? '' ) );
								process.exitCode = 1;
							}
						} else {
							console.log( getManualConfigInfo() );
						}
					},
				} )
				.command( {
					command: 'unconfigure',
					describe: __( 'Remove Studio MCP from your AI assistant' ),
					builder: ( cmdYargs ) => cmdYargs.options( AS_OPTION ),
					handler: async ( argv ) => {
						const assistant = argv.as;
						if ( assistant ) {
							const result = await unconfigureMcpClient( assistant );
							if ( result.success ) {
								console.log(
									sprintf( __( 'Studio MCP removed successfully from %s.' ), assistant )
								);
							} else {
								console.error( sprintf( __( 'Failed to unconfigure: %s' ), result.message ?? '' ) );
								process.exitCode = 1;
							}
						} else {
							console.log( getManualUnconfigureInfo() );
						}
					},
				} );
		},
		handler: async () => {
			try {
				await runCommand();
			} catch ( error ) {
				if ( error instanceof LoggerError ) {
					logger.reportError( error );
				} else {
					const loggerError = new LoggerError( __( 'MCP server failed' ), error );
					logger.reportError( loggerError );
				}
			}
		},
	} );
};
