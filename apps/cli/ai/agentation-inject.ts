/**
 * Opens a headed Playwright browser on a Studio site with the Agentation
 * annotation toolbar injected. The user can click elements and add feedback.
 * Annotations sync to the agentation-mcp HTTP server (localhost:4747) and
 * the agent reads them via MCP tools.
 */

const AGENTATION_ENDPOINT = 'http://localhost:4747';

type Browser = Awaited< ReturnType< ( typeof import('playwright') )[ 'chromium' ][ 'launch' ] > >;
type Page = Awaited< ReturnType< Browser[ 'newPage' ] > >;

let agentationBrowser: Browser | null = null;
let agentationPage: Page | null = null;

export async function openAgentationBrowser( siteUrl: string ): Promise< string > {
	if ( agentationBrowser && agentationPage ) {
		try {
			await agentationPage.evaluate( () => true );
			return 'Agentation browser is already open. The user can annotate elements.';
		} catch {
			agentationBrowser = null;
			agentationPage = null;
		}
	}

	const { chromium } = await import( 'playwright' );
	agentationBrowser = await chromium.launch( {
		headless: false,
		args: [ '--ignore-certificate-errors' ],
	} );

	agentationPage = await agentationBrowser.newPage( {
		viewport: { width: 1440, height: 900 },
		ignoreHTTPSErrors: true,
	} );

	await agentationPage.goto( siteUrl, {
		waitUntil: 'domcontentloaded',
		timeout: 30_000,
	} );

	await agentationPage.waitForLoadState( 'networkidle', { timeout: 10_000 } ).catch( () => {} );

	// Import map ensures a single React instance across all ESM imports
	await agentationPage.evaluate( ( endpoint ) => {
		const importMap = document.createElement( 'script' );
		importMap.type = 'importmap';
		importMap.textContent = JSON.stringify( {
			imports: {
				react: 'https://esm.sh/react@18',
				'react/': 'https://esm.sh/react@18/',
				'react-dom': 'https://esm.sh/react-dom@18',
				'react-dom/': 'https://esm.sh/react-dom@18/',
			},
		} );
		document.head.prepend( importMap );

		const script = document.createElement( 'script' );
		script.type = 'module';
		script.textContent = `
			import React from 'react';
			import { createRoot } from 'react-dom/client';
			import { PageFeedbackToolbarCSS } from 'https://esm.sh/agentation@3?external=react,react-dom';

			const container = document.createElement('div');
			container.id = '__agentation-root';
			document.body.appendChild(container);

			createRoot(container).render(
				React.createElement(PageFeedbackToolbarCSS, {
					endpoint: '${ endpoint }',
				})
			);
		`;
		document.body.appendChild( script );
	}, AGENTATION_ENDPOINT );

	agentationPage.on( 'close', () => {
		agentationBrowser = null;
		agentationPage = null;
	} );

	return `Agentation browser opened at ${ siteUrl }. The user can now click elements and add annotations. Use agentation tools to read their feedback.`;
}
