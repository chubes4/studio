import os from 'os';
import path from 'path';

export function getMcpInstallDir(): string {
	return path.join( os.homedir(), '.wordpress-studio-mcp' );
}

export function getMcpServerDir(): string {
	return path.join( getMcpInstallDir(), 'mcp' );
}

export function getMcpBinDir(): string {
	return path.join( getMcpInstallDir(), 'bin' );
}

export function getMcpVersionFile(): string {
	return path.join( getMcpServerDir(), '.version' );
}

export function getMcpBinScript( name: 'studio-mcp' | 'studio-cli' ): string {
	return path.join( getMcpBinDir(), name );
}
