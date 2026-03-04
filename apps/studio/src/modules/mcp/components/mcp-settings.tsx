import { CheckboxControl } from '@wordpress/components';
import { useI18n } from '@wordpress/react-i18n';
import { useEffect, useState } from 'react';
import Button from 'src/components/button';
import { getIpcApi } from 'src/lib/get-ipc-api';
import { SettingsFormField } from 'src/modules/user-settings/components/settings-form-field';

type McpSettingsProps = {
	valueClaude: boolean;
	onChangeClaude: ( value: boolean ) => void;
};

export function McpSettings( { valueClaude, onChangeClaude }: McpSettingsProps ) {
	const { __ } = useI18n();
	const [ configJson, setConfigJson ] = useState( '' );
	const [ isClaudeDesktopAppInstalled, setIsClaudeDesktopAppInstalled ] = useState( false );
	const [ copied, setCopied ] = useState( false );

	useEffect( () => {
		getIpcApi()
			.getMcpServerConfig()
			.then( setConfigJson )
			.catch( () => {} );
		getIpcApi()
			.isClaudeDesktopInstalled()
			.then( setIsClaudeDesktopAppInstalled )
			.catch( () => {} );
	}, [] );

	const handleCopy = async () => {
		await getIpcApi().copyText( configJson );
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	};

	return (
		<SettingsFormField label={ __( 'AI MCP Server' ) }>
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<div className="a8c-body-small text-a8c-gray-700">
						{ __( "Copy the configuration below to your AI assistant's MCP settings." ) }
					</div>
					<div className="relative">
						<pre className="bg-a8c-gray-0 border border-a8c-gray-200 rounded p-3 text-xs overflow-x-auto whitespace-pre m-0 font-mono">
							{ configJson }
						</pre>
						<div className="absolute top-2 right-2">
							<Button
								variant="secondary"
								onClick={ handleCopy }
								className="!text-xs !min-h-0 !px-2 !py-1"
							>
								{ copied ? __( 'Copied!' ) : __( 'Copy' ) }
							</Button>
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-1">
					<CheckboxControl
						label={ __( 'Auto-configure Claude Desktop' ) }
						checked={ valueClaude }
						onChange={ onChangeClaude }
						disabled={ ! isClaudeDesktopAppInstalled }
					/>
					{ ! isClaudeDesktopAppInstalled && (
						<div className="a8c-body-small text-a8c-gray-700 ml-6">
							{ __(
								'Claude Desktop is not installed. Download it from https://claude.com/download to enable auto-configuration.'
							) }
						</div>
					) }
					{ isClaudeDesktopAppInstalled && (
						<div className="a8c-body-small text-a8c-gray-700 ml-6">
							{ __( 'More AI assistants will be supported for auto-configuration in the future.' ) }
						</div>
					) }
				</div>
			</div>
		</SettingsFormField>
	);
}
