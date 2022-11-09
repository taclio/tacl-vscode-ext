/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, languages, DiagnosticCollection, Diagnostic, Uri, Range } from 'vscode';
import * as hoverDes from './config/hover.json';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;
let diagnosticCollection: DiagnosticCollection;

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
	const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'tacl' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'languageServerExample',
		'Language Server Example',
		serverOptions,
		clientOptions
	);

	languages.registerHoverProvider('tacl', {
		provideHover(document, position, token) {
			const location = path.dirname(document.uri.fsPath)
			if(location.endsWith("features")) {
				console.log("Its a feature file");
				
			}
			else if(location.endsWith("steps")) {
				console.log("Its a step file");
			}
			else if(location.endsWith("elements")) {
				console.log("Its an elements file");
			}
			else if(location.endsWith("data")) {
				console.log("Its a dataset file");
			}
			let return_content = '';
			const word = document.getText(document.getWordRangeAtPosition(position));
			hoverDes.forEach(element => {
				if(element.label == word) {
					return_content = element.documentation;
				}
			});

		return {
			contents: [return_content]
		};
		}
	});



	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}


