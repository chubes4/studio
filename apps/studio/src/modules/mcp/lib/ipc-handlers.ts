import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import {
	getMcpBinScript,
	getClaudeDesktopConfigDir,
	getClaudeDesktopConfigPath,
} from './mcp-paths';

export async function isClaudeDesktopInstalled(): Promise< boolean > {
	const paths = [
		'/Applications/Claude.app',
		path.join( os.homedir(), 'Applications', 'Claude.app' ),
	];

	return paths.some( ( p ) => fs.pathExistsSync( p ) );
}

export async function isClaudeConfiguredForMcp(): Promise< boolean > {
	const configPath = getClaudeDesktopConfigPath();
	if ( ! ( await fs.pathExists( configPath ) ) ) {
		return false;
	}
	try {
		const config = JSON.parse( await fs.readFile( configPath, 'utf-8' ) );
		return !! config?.mcpServers?.[ 'wordpress-studio' ];
	} catch {
		return false;
	}
}

export async function configureClaudeForMcp(): Promise< void > {
	const configPath = getClaudeDesktopConfigPath();
	const mcpCommand = getMcpBinScript( 'studio-mcp' );

	await fs.ensureDir( getClaudeDesktopConfigDir() );

	let config: Record< string, unknown > = {};
	if ( await fs.pathExists( configPath ) ) {
		try {
			config = JSON.parse( await fs.readFile( configPath, 'utf-8' ) );
		} catch {
			config = {};
		}
	}

	const mcpServers = ( config.mcpServers ?? {} ) as Record< string, unknown >;
	// If user has configured MCP via bash script before, remove the old config
	delete mcpServers[ 'wordpress-developer' ];

	mcpServers[ 'wordpress-studio' ] = {
		command: mcpCommand,
	};

	config.mcpServers = mcpServers;

	await fs.writeFile( configPath, JSON.stringify( config, null, 2 ) );
}

export async function unconfigureClaudeForMcp(): Promise< void > {
	const configPath = getClaudeDesktopConfigPath();

	if ( ! ( await fs.pathExists( configPath ) ) ) {
		return;
	}

	try {
		const config = JSON.parse( await fs.readFile( configPath, 'utf-8' ) );
		const mcpServers = config.mcpServers;
		if ( mcpServers ) {
			delete mcpServers[ 'wordpress-studio' ];
		}
		await fs.writeFile( configPath, JSON.stringify( config, null, 2 ) );
	} catch {
		// If config is corrupt, leave it alone
	}
}

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
