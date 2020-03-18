// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

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
			const selections = activeEditor.selections;
			var range = new vscode.Range(new vscode.Position(line, 0), new vscode.Position(line + 1, 0))
			vscode.window.showInformationMessage(activeEditor.document.getText(range));

			var editor = vscode.window.activeTextEditor;
			if (editor != undefined) {
				editor.edit(edit => edit.replace(range, "changed text"));
			}
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
