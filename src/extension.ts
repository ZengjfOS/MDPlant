// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EOF } from 'dns';

let MDP_UP = -1;
let MDP_DOWN = 1;

let cmds = ["list", "salt"];

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

function doSalt(activeEditor: vscode.TextEditor)
{
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
					outString += lineText.substring(lineText.indexOf("*") + 1, lineText.length);

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

function doList(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	var editor = vscode.window.activeTextEditor;
	if (editor != undefined) {
		editor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
			let lineText = activeEditor.document.getText(range).trim();
			let subfix = lineText.substring(lineText.lastIndexOf(".") + 1, lineText.length).toLowerCase();

			if ( subfix == "png" || subfix == "jpg" || subfix == "jpeg" || subfix == "svg")
				edit.replace(range, "* ![" + lineText.replace("\\", "/") + "](" + lineText.replace("\\", "/") + ")");
			else
				edit.replace(range, "* [" + lineText.replace("\\", "/") + "](" + lineText.replace("\\", "/") + ")");

			vscode.window.showInformationMessage("convert txt: " + lineText);

		});
	}
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

		var inputString = vscode.window.showInputBox(
        	{ // 这个对象中所有参数都是可选参数
                password:false, 				// 输入内容是否是密码
                ignoreFocusOut:true, 			// 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder:'input cmd：', 		// 在输入框内的提示信息
				prompt:'salt/list', 			// 在输入框下方的提示信息
				validateInput:function(text){	// 校验输入信息
					cmds.forEach(element => {
						if (text.trim() == element)
							return "";
						
					});

					// vscode.window.showInformationMessage('cmds: ' + cmds);

					/**
					 * Return undefined, null, or the empty string when 'value' is valid.
					 */
					return null;
				}
            }).then( msg => {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor) {

					if (msg) {
						if (msg.toLowerCase() == "salt") {
							doSalt(activeEditor);
						} else if (msg.toLowerCase() == "list") {
							doList(activeEditor);
						}
					}
				}
			}
		);

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.mdsalt', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doSalt(activeEditor);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.mdlist', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doList(activeEditor);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
