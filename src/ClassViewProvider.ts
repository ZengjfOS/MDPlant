import * as vscode from 'vscode';
import * as mdplantlibapi from "./mdplantlibapi"

export class ClassViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'ClassDiagram';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public updateContent(activeEditor: vscode.TextEditor, content: string[]) {
		let line = activeEditor.selection.active.line

		if (content == null || content == undefined || content.length == 0)
			return

		activeEditor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)

			if (content.length > 0)
				edit.replace(range, content.join("\n"))
		}).then(value => {
			mdplantlibapi.cursor(activeEditor, line)
		})
	}

	public getLineContent(activeEditor: vscode.TextEditor) {
		let line = activeEditor.selection.active.line
		let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
		let lineText = activeEditor.document.getText(range).replace(/\t/g, "    ")

		console.log("line text: " + lineText)

		return lineText
	}

	public doStartClass(activeEditor: vscode.TextEditor, line: string) {
		console.log("doStartMindmap")

		if (line.length > 0)
			return []

		let output = [
			"```plantuml",
			"@startuml",
			"",
			"class Foo {",
			"    + 1",
			"    + 2",
			"}",
			"	",
			"class Bar {",
			"    + 3",
			"    + 4",
			"}",
			"",
			"Foo::1 --> Bar::3 : foo",
			"Foo::2 --> Bar::4",
			"",
			"@enduml",
			"```"
		]

		return output
	}

	public doArrowTo(activeEditor: vscode.TextEditor, line: string) {
		console.log("doArrowTo")

		let output: string[] = []

		if (line.length > 0) {
			let regex = new RegExp("(\\s*)([^\\s]+)\\s+([^\\s]+)\\s+(.*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + matchValue[2] + " --> " + matchValue[3] + ": " + matchValue[4])
			} else {
				regex = new RegExp("(\\s*)([^\\s]+)\\s+(.*)")
				matchValue = regex.exec(line.trimRight())
				// console.log(matchValue)
				if (matchValue != null) {
					output.push(matchValue[1] + matchValue[2] + " --> " + matchValue[3])
				}
			}
		}

		return output
	}

	public doNoteLeft(activeEditor: vscode.TextEditor, line: string) {
		console.log("doNoteLeft")

		let output: string[] = []

		if (line.length >= 0) {
			let regex = new RegExp("(\\s*)([^\\s].*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + "note left of "+ matchValue[2])
				output.push(matchValue[1] + "" )
				output.push(matchValue[1] + "end note")
			}
		}

		return output
	}

	public doNoteRight(activeEditor: vscode.TextEditor, line: string) {
		console.log("doNoteRight")

		let output: string[] = []

		if (line.length >= 0) {
			let regex = new RegExp("(\\s*)([^\\s].*)")
			let matchValue = regex.exec(line.trimRight())
			// console.log(matchValue)
			if (matchValue != null) {
				output.push(matchValue[1] + "note right of " + matchValue[2])
				output.push(matchValue[1] + "")
				output.push(matchValue[1] + "end note")
			}
		}

		return output
	}

	public doIds(id: string) {
		let idsMaps = {
			'startClass': this.doStartClass,
			'arrowTo': this.doArrowTo,
			'noteLeft': this.doNoteLeft,
			'noteRight': this.doNoteRight,
		}

		const activeEditor = vscode.window.activeTextEditor
		if (activeEditor) {
			for (const [key, value] of Object.entries(idsMaps)) {
				if (key == id) {
					let lineContent = this.getLineContent(activeEditor)
					this.updateContent(activeEditor, value(activeEditor, lineContent))

					return
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
						console.log("function: " + data.value)

						this.doIds(data.value)
						break;
					}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'assets/media', 'class.js'));

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
				<button class="add-color-button" id="startClass">start class</button>
				<button class="add-color-button" id="arrowTo">arrow to</button>
				<button class="add-color-button" id="noteLeft">note left</button>
				<button class="add-color-button" id="noteRight">note right</button>

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
