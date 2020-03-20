// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EOF } from 'dns';

let MDP_UP = -1;
let MDP_DOWN = 1;

function findBoundary(editor: vscode.TextEditor, index: number, direction: number) {
	let line =index;

	while ((line != -1) && (line != editor.document.lineCount)) {
	    let editorLine = editor.document.lineAt(line);
		let range = new vscode.Range(editorLine.range.start, editorLine.range.end)
		let lineText = editor.document.getText(range);

		if (lineText.startsWith("@startsalt") || lineText.startsWith("@endsalt")) {
			return line;
		}

		line += direction;
	}

	return -1;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "mdplant" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.mdplant', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		// vscode.window.showInformationMessage('MDPlant Work Well!');


		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			var line = activeEditor.selection.active.line;

			let startLine = findBoundary(activeEditor, line, MDP_UP);
			let endLine = findBoundary(activeEditor, line, MDP_DOWN);

			vscode.window.showInformationMessage("start: " + startLine + ", end: " + endLine);

			if (startLine >= 0 && endLine >= 0) {
				var editor = vscode.window.activeTextEditor;
				if (editor != undefined) {
					editor.edit(edit => {
						let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(startLine).range.end)
						let lineText = activeEditor.document.getText(range);
						edit.replace(range, lineText + "\n{\n{T");

						for (var i = (startLine + 1); i < endLine; i++) {
							let range = new vscode.Range(activeEditor.document.lineAt(i).range.start, activeEditor.document.lineAt(i).range.end)
							let lineText = activeEditor.document.getText(range);
							
							let outString = "";
							for (var j = 0; j < lineText.indexOf("*") + 1; j++) {
								outString += "+";
							}
							outString += lineText.substring(lineText.indexOf("*") + 1, lineText.length - 1);

							edit.replace(range, outString);
						}

						range = new vscode.Range(activeEditor.document.lineAt(endLine).range.start, activeEditor.document.lineAt(endLine).range.end)
						lineText = activeEditor.document.getText(range);
						edit.replace(range, "}\n}\n" + lineText);

					});
				}
			} else {
				vscode.window.showInformationMessage("Please check data format.");
			}
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
