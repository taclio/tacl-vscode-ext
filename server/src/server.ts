/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	Diagnostic,
	DiagnosticSeverity,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import * as keywordDes from './config/keyword.json';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed TACL features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});

// The example settings
interface ExampleSettings {
	maxNumberOfProblems: number;
} 

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		// Reset all cached document settings
		documentSettings.clear();
	} else {
		globalSettings = <ExampleSettings>(
			(change.settings.languageServerExample || defaultSettings)
		);
	}

	// Revalidate all open text documents
	documents.all().forEach(validateTaclDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerExample'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
	documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTaclDocument(change.document);
});

async function validateTaclDocument(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase. Can you please fix that`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	const pattern_do = /do/;
	const pattern_click = /do/;
	const pattern_open = /do/;
	const pattern_fill = /do/;
	const pattern_type = /do/;

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

async function validateDoInTacl(textDocument: TextDocument): Promise<void> {
	// In this simple example we get the settings for every validate run.
	const settings = await getDocumentSettings(textDocument.uri);

	// The validator creates diagnostics for all uppercase words length 2 and more
	const text = textDocument.getText();
	console.log(text);
	const pattern = /\b[A-Z]{2,}\b/g;
	let m: RegExpExecArray | null;

	let problems = 0;
	const diagnostics: Diagnostic[] = [];
	while ((m = pattern.exec(text)) && problems < settings.maxNumberOfProblems) {
		problems++;
		const diagnostic: Diagnostic = {
			severity: DiagnosticSeverity.Warning,
			range: {
				start: textDocument.positionAt(m.index),
				end: textDocument.positionAt(m.index + m[0].length)
			},
			message: `${m[0]} is all uppercase. Can you please fix that`,
			source: 'ex'
		};
		if (hasDiagnosticRelatedInformationCapability) {
			diagnostic.relatedInformation = [
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Spelling matters'
				},
				{
					location: {
						uri: textDocument.uri,
						range: Object.assign({}, diagnostic.range)
					},
					message: 'Particularly for names'
				}
			];
		}
		diagnostics.push(diagnostic);
	}

	// const pattern_do = /do/;
	// const pattern_click = /do/;
	// const pattern_open = /do/;
	// const pattern_fill = /do/;
	// const pattern_type = /do/;

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'Given',
				kind: CompletionItemKind.Property,
				data: 1
			},
			{
				label: 'actions',
				kind: CompletionItemKind.Property,
				data: 2
			},
			{
				label: 'Then',
				kind: CompletionItemKind.Property,
				data: 3
			},
			{
				label: 'And',
				kind: CompletionItemKind.Property,
				data: 4
			},
			{
				label: 'do',
				kind: CompletionItemKind.Function,
				data: 5
			},
			{
				label: 'click',
				kind: CompletionItemKind.Class,
				data: 6
			},
			{
				label: 'type',
				kind: CompletionItemKind.Function,
				data: 7
			},
			{
				label: 'check',
				kind: CompletionItemKind.Function,
				data: 8
			},
			{
				label: 'uncheck',
				kind: CompletionItemKind.Function,
				data: 9
			},
			{
				label: 'fill',
				kind: CompletionItemKind.Function,
				data: 10
			},
			{
				label: 'assert',
				kind: CompletionItemKind.Property,
				data: 11
			},
			{
				label: 'press',
				kind: CompletionItemKind.Function,
				data: 12
			},
			{
				label: 'double_click',
				kind: CompletionItemKind.Function,
				data: 13
			},
			{
				label: 'name',
				kind: CompletionItemKind.Variable,
				data: 14
			},
			{
				label: 'value',
				kind: CompletionItemKind.Variable,
				data: 15
			},
			{
				label: 'description',
				kind: CompletionItemKind.Variable,
				data: 16
			},
			{
				label: 'scenarios',
				kind: CompletionItemKind.Variable,
				data: 17
			},
			{
				label: 'steps',
				kind: CompletionItemKind.Variable,
				data: 18
			},
			{
				label: 'focus',
				kind: CompletionItemKind.Function,
				data: 19
			},
			{
				label: 'enabled',
				kind: CompletionItemKind.Variable,
				data: 20
			},
			{
				label: 'empty',
				kind: CompletionItemKind.Variable,
				data: 21
			},
			{
				label: 'editable',
				kind: CompletionItemKind.Variable,
				data: 22
			},
			{
				label: 'hidden',
				kind: CompletionItemKind.Variable,
				data: 23
			},
			{
				label: 'visible',
				kind: CompletionItemKind.Variable,
				data: 24
			},
			{
				label: 'available',
				kind: CompletionItemKind.Variable,
				data: 25
			},
			{
				label: 'empty',
				kind: CompletionItemKind.Variable,
				data: 26
			},
			{
				label: 'contains',
				kind: CompletionItemKind.Variable,
				data: 27
			},
			{
				label: 'title',
				kind: CompletionItemKind.Variable,
				data: 28
			},
			{
				label: 'checked',
				kind: CompletionItemKind.Function,
				data: 29
			}
		
		];
	}
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		const count = item.data - 1;
		const temp = keywordDes[count];
		item.detail = temp.detail;
		item.documentation = temp.documentation;
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
