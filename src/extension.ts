// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EOF } from 'dns';
import * as fs from 'fs';
import { basename } from 'path';

let MDP_UP = -1;
let MDP_DOWN = 1;

let cmds = ["list", "salt", "index"];
let SALT_BOUNDARY = ["@startsalt", "@endsalt"]
let INDEX_BOUNDARY = ["", ""]

function findBoundary(editor: vscode.TextEditor, index: number, direction: number, boundary:string[]) {
	let line =index;

	while ((line != -1) && (line != editor.document.lineCount)) {
	    let editorLine = editor.document.lineAt(line);
		let range = new vscode.Range(editorLine.range.start, editorLine.range.end)
		let lineText = editor.document.getText(range);

		if (lineText.startsWith(boundary[0]) || lineText.startsWith(boundary[1])) {
			return line;
		}

		line += direction;
	}

	return -1;
}

function findEmptyLine(editor: vscode.TextEditor, index: number, direction: number) {
	let line =index;

	while ((line != -1) && (line != editor.document.lineCount)) {
	    let editorLine = editor.document.lineAt(line);
		let range = new vscode.Range(editorLine.range.start, editorLine.range.end)
		let lineText = editor.document.getText(range);

		if (lineText.length == 0) {
			return line;
		}

		line += direction;
	}

	return -1;
}

function doSalt(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	let startLine = findBoundary(activeEditor, line, MDP_UP, SALT_BOUNDARY);
	let endLine = findBoundary(activeEditor, line, MDP_DOWN, SALT_BOUNDARY);

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
			let lineText = activeEditor.document.getText(range).trim().replace(/\\/g, "/");
			let subfix = lineText.substring(lineText.lastIndexOf(".") + 1, lineText.length).toLowerCase();

			let fileName = editor?.document.fileName.replace(/\\/g, "/", ) || "";
			let docs_dir = basename(fileName.replace("/" + basename(fileName), ""));

			if (lineText.length <= 0)
				return ;

			if (docs_dir == "docs" && lineText.startsWith(docs_dir + "/")) 
					lineText = lineText.replace(/^docs\//, "");

			if (lineText.indexOf("http") > 0) {
				let lineTextSplit = lineText.split(" http");
				if (lineTextSplit.length = 2)
					edit.replace(range, "* [" + lineTextSplit[0].trim() + "](http" + lineTextSplit[1].trim() + ")");
			} else {
				if ( subfix == "png" || subfix == "jpg" || subfix == "jpeg" || subfix == "svg" || subfix == "gif")
					edit.replace(range, "![" + basename(lineText) + "](" + lineText + ")");
				else
					edit.replace(range, "* [" + basename(lineText) + "](" + lineText + ")");
			}

			vscode.window.showInformationMessage("convert txt: " + lineText);
		});
	}
}

function doIndex(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	var inputString = vscode.window.showInputBox(
		{ // 这个对象中所有参数都是可选参数
			password:false,               // 输入内容是否是密码
			ignoreFocusOut:true,          // 默认false，设置为true时鼠标点击别的地方输入框不会消失
			placeHolder:'input relative direcotry：',    // 在输入框内的提示信息
			prompt:'docs',                // 在输入框下方的提示信息
			validateInput:function(text){ // 校验输入信息
				cmds.forEach(element => {
					if (text.trim() == element)
						return "";
					
				});

				return null;
			}
		}).then( msg => {
			var editor = vscode.window.activeTextEditor;
			if (editor != undefined) {

				let startLine = findEmptyLine(activeEditor, line, MDP_UP);
				let endLine = findEmptyLine(activeEditor, line, MDP_DOWN);

				if (startLine == -1) 
					startLine =  0;
				else if ((startLine + 1) == activeEditor.document.lineCount)
					startLine = startLine;
				else 
					startLine += 1;

				if (endLine == -1) {
					if (activeEditor.document.lineCount > 1)
						endLine = activeEditor.document.lineCount - 1; 
					else 
						endLine = 0;
				}

				let folderPath = vscode.workspace.rootPath + "\\" + msg;
				console.log(folderPath);
				if (fs.existsSync(folderPath)) {
					if (editor != undefined) {
						editor.edit(edit => {
							let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
							edit.delete(range);
						}).then((value) => {

							line = startLine;

							if (editor != undefined) {
								editor.edit(edit => {
									let files = fs.readdirSync(folderPath || "");
									var outputString = "";
									let outputStringArray:string[] = [];
									files.forEach((file: fs.PathLike) => {
										const r = new RegExp(vscode.workspace.getConfiguration().get('MDPlant.mdindex.fileRegEx') || "^\\d{1,4}_.*\\.md", "g");
										const m = r.exec(file.toString());
										m?.forEach((value, index) => {
											outputStringArray.push("* [" + file + "](" + msg + "/" + file + ")\n")
										});
									});

									for (let i = 0; i < outputStringArray.length; i++) {
										outputString += outputStringArray[outputStringArray.length - 1 - i];
									}

									edit.insert(new vscode.Position(line, 0), outputString);
									// console.log(outputString);

									const result = vscode.workspace.getConfiguration().get('MDPlant.mdindex.fileRegEx');
									vscode.window.showInformationMessage("list files over. start: " + startLine + ", end: " + endLine + " regex: " + result);
									// vscode.window.showInformationMessage("list files over. start: " + startLine + ", end: " + endLine);
								});
							}

						});
					}
				} else {
					vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist");
				}
			}
		}
	);
}

function doMenu(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	var editor = vscode.window.activeTextEditor;
	if (editor != undefined) {

		let startLine = findEmptyLine(activeEditor, line, MDP_UP);
		let endLine = findEmptyLine(activeEditor, line, MDP_DOWN);

		if (startLine == -1) 
			startLine =  0;
		else if ((startLine + 1) == activeEditor.document.lineCount)
			startLine = startLine;
		else 
			startLine += 1;

		if (endLine == -1) {
			if (activeEditor.document.lineCount > 1)
				endLine = activeEditor.document.lineCount - 1; 
			else 
				endLine = 0;
		}

		if (startLine > endLine) 
			endLine = startLine;

		if (editor != undefined) {
			editor.edit(edit => {
				let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
				edit.delete(range);
			}).then((value) => {

				line = startLine;

				if (editor != undefined) {
					editor.edit(edit => {
						let docs = activeEditor.document.getText().split(/\r?\n/);
						let menus:string[] = [];

						for (let i = 0; i < docs.length; i++) {
							if (docs[i].match(/^#{2,} /g) != null) {
								let prefix = docs[i].substr(2, docs[i].lastIndexOf("#")).trim().replace(/#/g, "  "); 
								let content = docs[i].substr(docs[i].lastIndexOf("#") + 1).trim();
								menus.push(prefix + "* [" + content + "](#" + content.replace(/ /g, "-").replace(/[、\.\(\)\&\*]/g, "") + ")\n");
							}
						}

						let outputString = "";
						for (let i = 0; i < menus.length; i++) {
							outputString += menus[i];
						}

						edit.insert(new vscode.Position(line, 0), outputString);
						vscode.window.showInformationMessage("menu start: " + startLine + ", end: " + endLine);
					});
				}
			});
		}
	}

}


function fileAbstract(fileContentArr: string[]) {

	let startAbstract = false;
	for (let i = 0; i < fileContentArr.length; i++) {
		let element = fileContentArr[i].trim();
		if (element.startsWith("# ")) {
			startAbstract = true;
			continue;
		}

		if (startAbstract) {
			if (element.length > 0) {
				
				if (element.startsWith("#"))
					return "Empty Abstract";
				else
					return element;
			}
		}
	}
}

function doTable(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	var inputString = vscode.window.showInputBox(
		{ // 这个对象中所有参数都是可选参数
			password:false,               // 输入内容是否是密码
			ignoreFocusOut:true,          // 默认false，设置为true时鼠标点击别的地方输入框不会消失
			placeHolder:'input relative direcotry：',    // 在输入框内的提示信息
			prompt:'docs',                // 在输入框下方的提示信息
			validateInput:function(text){ // 校验输入信息
				cmds.forEach(element => {
					if (text.trim() == element)
						return "";
				});

				return null;
			}
		}).then( msg => {
			var editor = vscode.window.activeTextEditor;
			if (editor != undefined) {

				let startLine = findEmptyLine(activeEditor, line, MDP_UP);
				let endLine = findEmptyLine(activeEditor, line, MDP_DOWN);

				if (startLine == -1) 
					startLine =  0;
				else if ((startLine + 1) == activeEditor.document.lineCount)
					startLine = startLine;
				else 
					startLine += 1;

				if (endLine == -1) {
					if (activeEditor.document.lineCount > 1)
						endLine = activeEditor.document.lineCount - 1; 
					else 
						endLine = 0;
				}

				let folderPath = vscode.workspace.rootPath + "\\" + msg;
				console.log(folderPath);
				if (fs.existsSync(folderPath)) {
					if (editor != undefined) {
						editor.edit(edit => {
							let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
							edit.delete(range);
						}).then((value) => {

							line = startLine;

							if (editor != undefined) {
								editor.edit(edit => {
									let files = fs.readdirSync(folderPath || "");

									let outputString = "NO.|文件名称|摘要\n";
									outputString += ":--:|:--|:--\n";
									let outputStringArray:string[] = [];

									files.forEach((file: fs.PathLike) => {
										const r = new RegExp(vscode.workspace.getConfiguration().get('MDPlant.mdindex.fileRegEx') || "^\\d{1,4}_.*\\.md", "g");
										const m = r.exec(file.toString());
										m?.forEach((value, index) => {
											const fileContentArr = fs.readFileSync(folderPath + "\\" + file, 'utf8').split(/\r?\n/);
											let fabs = fileAbstract(fileContentArr);
											file.toString().match(/\d{1,4}/)?.forEach(index =>{
												outputStringArray.push(index + "| [" + file.toString().split(index + "_").join("").split("\.md").join("") + "](" + msg + "/" + file + ") | " + fabs + "\n");
											});
											// console.log(file);
										});
									});

									for (let i = 0; i < outputStringArray.length; i++) {
										outputString += outputStringArray[outputStringArray.length - 1 - i];
									}

									edit.insert(new vscode.Position(line, 0), outputString);

									const result = vscode.workspace.getConfiguration().get('MDPlant.mdindex.fileRegEx');
									vscode.window.showInformationMessage("list files over. start: " + startLine + ", end: " + endLine + " regex: " + result);
								});
							}

						});
					}
				} else {
					vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist");
				}
			}
		}
	);
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
                password:false,               // 输入内容是否是密码
                ignoreFocusOut:true,          // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder:'input cmd：',    // 在输入框内的提示信息
				prompt:'salt/list/index/table/menu',     // 在输入框下方的提示信息
				validateInput:function(text){ // 校验输入信息
					cmds.forEach(element => {
						if (text.trim() == element)
							return "";
						
					});

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
						} else if (msg.toLowerCase() == "index") {
							doIndex(activeEditor);
						} else if (msg.toLowerCase() == "table") {
							doTable(activeEditor);
						} else if (msg.toLowerCase() == "menu") {
							doMenu(activeEditor);
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

	disposable = vscode.commands.registerCommand('extension.mdindex', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doIndex(activeEditor);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.mdtable', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doTable(activeEditor);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.mdmenu', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doMenu(activeEditor);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
