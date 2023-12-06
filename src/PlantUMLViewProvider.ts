import * as vscode from 'vscode';
import * as mdplantlibapi from "./mdplantlibapi"

export class PlantUMLViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'plantumlTools';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public updateContent(activeEditor: vscode.TextEditor, content: string[]) {
		let line = activeEditor.selection.active.line

		if (content == null || content == undefined)
			return

		activeEditor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)

			if (content.length > 0)
				edit.replace(range, content.join("\n"))
		}).then(value => {
			mdplantlibapi.cursor(activeEditor, line)
		})
	}

	public doStartuml(activeEditor: vscode.TextEditor) {
		console.log("doAtoB")

		let output = [
			"```plantuml",
			"@startuml",
			"",
			"title Example Title",
			"",
			"",
			"",
			"@enduml",
			"```"
		]

		return output
	}

	public doAtoB(activeEditor: vscode.TextEditor) {
		console.log("doAtoB")

		let output = ["A -> B: text"]

		return output
	}

	public doBtoA(activeEditor: vscode.TextEditor) {
		console.log("doBtoA")

		let output = ["A <- B: text"]

		return output
	}

	public doAdashToB(activeEditor: vscode.TextEditor) {
		console.log("doAdashToB")

		let output = ["A --> B: text"]

		return output
	}

	public doAtoBAndDashToA(activeEditor: vscode.TextEditor) {
		console.log("doAtoBAndDashToA")

		let output = [
			"A -> B ++: text",
			"B --> A --:",
		]

		return output
	}

	public doAltWithAtoB(activeEditor: vscode.TextEditor) {
		console.log("doAltWithAtoB")

		let output = [
			"alt text1",
			"    A -> B: text",
			"else text2",
			"    A -> B: text",
			"end"
		]
		
		return output
	}

	public doLoopWithAtoB(activeEditor: vscode.TextEditor) {
		console.log("doLoopWithAtoB")

		let output = [
			"loop text",
			"    A -> B: text",
			"end"
		]

		return output
	}

	public doNoteRight(activeEditor: vscode.TextEditor) {
		console.log("doNoteRight")

		let output = [
			"note right: note here"
		]

		return output
	}

	public doNoteBlock(activeEditor: vscode.TextEditor) {
		console.log("doNoteBlock")

		let output = [
			"note right",
			"",
			"note here",
			"",
			"end note",
		]

		return output
	}

	public doIds(id: string) {
		let idsMaps = {
			'startuml': this.doStartuml,
			'AtoB': this.doAtoB,
			'BtoA': this.doBtoA,
			'AdashToB': this.doAdashToB,
			'AtoBAndDashToA': this.doAtoBAndDashToA,
			'altWithAtoB': this.doAltWithAtoB,
			'loopWithAtoB': this.doLoopWithAtoB,
			'noteRight': this.doNoteRight,
			'noteBlock': this.doNoteBlock,
		}
        const activeEditor = vscode.window.activeTextEditor

        if (activeEditor) {
			for (const [key, value] of Object.entries(idsMaps)) {
				if (key == id) {
					
					this.updateContent(activeEditor, value(activeEditor))

					break
				}
			}
        }
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'functionSelected':
					{
						console.log(data.value)

						this.doIds(data.value)
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>PlantUML Tools</title>
			</head>
			<body>
				<button class="add-color-button" id="startuml">startuml</button>
				<button class="add-color-button" id="AtoB">A -> B</button>
				<button class="add-color-button" id="BtoA">A <- B</button>
				<button class="add-color-button" id="AdashToB">A --> B</button>
				<button class="add-color-button" id="AtoBAndDashToA">A -> B --> A</button>
				<button class="add-color-button" id="altWithAtoB">alt A -> B</button>
				<button class="add-color-button" id="loopWithAtoB">loop A -> B</button>
				<button class="add-color-button" id="noteRight">note right</button>
				<button class="add-color-button" id="noteBlock">note block</button>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
