// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { EOF } from 'dns';
import * as fs from 'fs';
import { basename } from 'path';
import * as path from 'path';
import { createSecureContext } from 'tls';

let MDP_UP = -1;
let MDP_DOWN = 1;

let cmds = ["list", "salt", "indent", "menu", "table"];
let SALT_BOUNDARY = ["@startsalt", "@endsalt"]
let INDEX_BOUNDARY = ["```", "```"]

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

function findIndexs(level: number, start: number, end: number, contentArray: string[], columnInterval: number, debug: boolean) {

	let indexs: number[] = []

	if (debug) {
		console.log("------------level " + level + " --------------")
		console.log("level = " + level)
		console.log("start = " + start)
		console.log("end = " + end)
		console.log("columnInterval = " + columnInterval)
	}

	for (let i = start; i < end; i++) {
		// level * columnInterval: 当前行本身缩进
		// (level - 1) * columnInterval: 额外添加的行缩进，目前是每个level添加2个空格，为了更方便的阅读
		let line = contentArray[i]
		if (level > 0) {
			if (line.length > level * columnInterval && line[level * columnInterval + (level - 1) * columnInterval] == "*") {
				indexs.push(i)
			}
		} else {	// level <= 0
			level = 0
			if (line.length > 0 && line[0] == "*") {
				indexs.push(i)
			}
		}
	}

	return indexs
}

function listToTree(level: number, start: number, end: number, contentArray: string[], columnInterval: number, debug: boolean) {
	if (debug) {
		console.log("------------level " + level + " --------------")
		console.log("level = " + level)
		console.log("start = " + start)
		console.log("end = " + end)
		console.log("columnInterval = " + columnInterval)

		for (let i = start; i < end - start; i++) {
			console.log(contentArray[i])
		}
	}

	// 因为传入的是包前不包后，排除第一行
	start += 1

	// 查找子索引数组
	let indexs = findIndexs(level + 1, start, end, contentArray, columnInterval, debug)
	if (debug) {
		console.log("indexs:")
		console.log(indexs)
	}

	if (indexs.length > 0) {
		if (debug)
			console.log("-------padding space--------")
		// 额外添加的行缩进，目前是每个level添加2个空格，为了更方便的阅读，2 + 2 = 4 space
		for (let i = start; i < end; i++) {
			contentArray[i] = contentArray[i].substring(0, 2 * level * columnInterval) + "  " + contentArray[i].substring(2 * level * columnInterval)
			if (debug)
				console.log(contentArray[i])
		}

		if (debug)
			console.log("-------replace with | --------")
		// 绘制当前的标记的列，range是前闭后开，所以要+1，因为前面为每个level增加了2个空格，替换字符位置是(2 * level + 1) * columnInterval为基准
		for (let i = start; i < (indexs[indexs.length - 1] + 1); i++) {
			contentArray[i] = contentArray[i].substring(0, (2 * level + 1) * columnInterval) + "│" + contentArray[i].substring((2 * level + 1) * columnInterval + 1)
			if (debug)
				console.log(contentArray[i])
		}

		if (debug)
			console.log("-------replace with └── /├──--------")
		// 绘制当前标记的行，由于需要替换掉*号，所以行范围需要range内要+1，由于前面额外的每个level添加了2个空格，所以要以(2 * level + 1) * columnInterval为基准
		indexs.forEach(value => {
			if (value == indexs[indexs.length - 1])
				contentArray[value] = contentArray[value].substring(0, (2 * level + 1) * columnInterval) + "└──" + contentArray[value].substring((2 * level + 1) * columnInterval + 3)
			else
				contentArray[value] = contentArray[value].substring(0, (2 * level + 1) * columnInterval) + "├──" + contentArray[value].substring((2 * level + 1) * columnInterval + 3)

		})

		if (debug)
			console.log("-------recursion--------")
		/**
		 * 1. 当前递归的区域的最后一行放入indexs集合，当作结束范围，这样就可以囊括整个子区域
		 * 2. 示例 1，不用添加最后一行
		 *	  * indent 1
		 *		* indent 2
		 *	  * indent 1
		 *	  * indent 1
		 * 3. 示例 2，需要添加最后一行
		 *	  * indent 1
		 *		* indent 2
		 *	  * indent 1
		 *		* indent 2
		 *		* indent 2
		 *	-> 这个位置就是：indexs.push(end) <-
		 * 4. 综上两个示例，统一添加最后一行，在内部判断start、end不相等才递归
		 */
		indexs.push(end)
		for (let i = 0; i < indexs.length; i++) {
			if (debug) {
				console.log("-------start next recursion" + i + "--------")
				console.log("start = " + start)
				console.log("end = " + indexs[i])
			}

			// skip start == end
			if (start != indexs[i])
				listToTree(level + 1, start, indexs[i], contentArray, columnInterval, debug)

			// 下一个子区域
			start = indexs[i]
		}
	} else
		return

	if (debug) {
		if (level == 0) {
			console.log("-------output--------")
			for (let i = 0; i < contentArray.length; i++) {
				console.log(contentArray[i])
			}
		}
	}
}

function treeToList(contentArray: string[], debug: boolean) {
	/**
	 * 1. 所有的节点都是以'─ '开头;
	 * 2. 前面level是4的倍数；
	 * 3. 保留2个space，也就是index / 2
	 */
	for (let i = 0; i < contentArray.length; i++) {
		let index = contentArray[i].indexOf("─ ")
		if (index > 0) {
			contentArray[i] = "".padStart(index / 2) + "* " + contentArray[i].substring(index + 2)
		}
	}

	if (debug) {
		console.log("-------output--------")
		for (let i = 0; i < contentArray.length; i++) {
			console.log(contentArray[i])
		}
	}
}

function doSalt(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	let startLine = findBoundary(activeEditor, line, MDP_UP, SALT_BOUNDARY);
	let endLine = findBoundary(activeEditor, line, MDP_DOWN, SALT_BOUNDARY);
	let revert = false

	vscode.window.showInformationMessage("start: " + startLine + ", end: " + endLine);

	if (startLine >= 0 && endLine >= 0) {
		var editor = vscode.window.activeTextEditor;
		if (editor != undefined) {
			editor.edit(edit => {
				let range = new vscode.Range(activeEditor.document.lineAt(startLine + 1).range.start, activeEditor.document.lineAt(startLine + 1).range.end)
				let lineText = activeEditor.document.getText(range);
				let outString = " ";
				if (lineText.startsWith("{")) {
					for (var i = (startLine + 1); i < (endLine); i++) {
						range = new vscode.Range(activeEditor.document.lineAt(i).range.start, activeEditor.document.lineAt(i).range.end)
						lineText = activeEditor.document.getText(range);

						if (lineText.startsWith("{") || lineText.startsWith("}")) {
							edit.replace(range, "")
							continue
						}

						outString = lineText.trim().replace("+ ", "* ")
						outString = outString.replace(/\+/g, " ")

						edit.replace(range, outString);
					}

					revert = true
				} else {
					range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(startLine).range.end)
					lineText = activeEditor.document.getText(range);
					console.log(lineText)
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
				}
			}).then((value) => {
				if (revert == true) {
					console.log("revert")
					editor?.edit(edit => {
						let range = new vscode.Range(activeEditor.document.lineAt(endLine - 3).range.end, activeEditor.document.lineAt(endLine - 1).range.end)
						edit.delete(range);
						range = new vscode.Range(activeEditor.document.lineAt(startLine + 1).range.start, activeEditor.document.lineAt(startLine + 3).range.start)
						edit.delete(range);
					})
				}
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
		// get current file relative dir
		let currentEditorFile = editor.document.uri.path
		let currentWorkspaceFold = editor.document.uri.path
		if(vscode.workspace.workspaceFolders !== undefined) {
			currentWorkspaceFold = vscode.workspace.workspaceFolders[0].uri.path
		}
		let currentFileDir = path.dirname(currentEditorFile.replace(currentWorkspaceFold, "").replace(/^\//, ""))
		// console.log(currentFileDir)

		editor.edit(edit => {
			let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
			let lineText = activeEditor.document.getText(range).trim().replace(/\\/g, "/");
			let subfix = lineText.substring(lineText.lastIndexOf(".") + 1, lineText.length).toLowerCase();

			if (lineText.length <= 0)
				return ;

			// revert string
			if (lineText.startsWith("* ") || lineText.startsWith("![")) {
				if (lineText.indexOf("(") > -1 && lineText.indexOf(")") > -1) {
					if (lineText.indexOf("http") > -1) {
						edit.replace(range, lineText.split("[")[1].split("]")[0] + " " + lineText.split("(")[1].split(")")[0]);
					} else {
						edit.replace(range, lineText.split("(")[1].split(")")[0]);
					}
				}

				return
			} else {
				if (lineText.startsWith(currentFileDir))
						lineText = lineText.replace(currentFileDir + "/", "");

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
			}
		});
	}
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

function doIndent(activeEditor: vscode.TextEditor)
{
	var line = activeEditor.selection.active.line;

	let startLine = findBoundary(activeEditor, line, MDP_UP, INDEX_BOUNDARY) + 1;
	let endLine = findBoundary(activeEditor, line, MDP_DOWN, INDEX_BOUNDARY);
	let contentArray: string[] = []
	let columnInterval = 2

	// vscode.window.showInformationMessage("start: " + startLine + ", end: " + endLine);

	if (startLine >= 0 && endLine >= 0) {
		var editor = vscode.window.activeTextEditor;
		if (editor != undefined) {
			editor.edit(edit => {
				for (var i = startLine; i < endLine; i++) {
					let range = new vscode.Range(activeEditor.document.lineAt(i).range.start, activeEditor.document.lineAt(i).range.end)
					let lineText = activeEditor.document.getText(range);
					contentArray.push(lineText)
				}
				// console.log(contentArray)

				if (contentArray[1].indexOf("─ ") > 0) {
					treeToList(contentArray, false)
				} else {
					if (findIndexs(0, 0, contentArray.length, contentArray, columnInterval, false).length > 1) {
						vscode.window.showInformationMessage("just support one title, plz check data format.");
						return
					}

					// check list start with "* "
					for (var i = 0; i < contentArray.length; i++) {
						if (contentArray[i].indexOf("* ") < 0) {
							vscode.window.showInformationMessage("Please check list data format.");
							return
						}
					}

					listToTree(0, 0, contentArray.length, contentArray, columnInterval, false)
				}

				for (var i = startLine; i < endLine; i++) {
					let range = new vscode.Range(activeEditor.document.lineAt(i).range.start, activeEditor.document.lineAt(i).range.end)
					edit.replace(range, contentArray[i - startLine])
				}
			});
		}
	} else {
		vscode.window.showInformationMessage("Please check data format.");
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
			password:false,			   // 输入内容是否是密码
			ignoreFocusOut:true,		  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
			placeHolder:'input relative direcotry：',	// 在输入框内的提示信息
			prompt:'docs',				// 在输入框下方的提示信息
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

				// get current file relative dir
				let currentEditorFile = editor.document.uri.path
				let currentWorkspaceFold = editor.document.uri.path
				if(vscode.workspace.workspaceFolders !== undefined) {
					currentWorkspaceFold = vscode.workspace.workspaceFolders[0].uri.path
				}
				let currentFileDir = path.dirname(currentEditorFile.replace(currentWorkspaceFold, ""))

				// merge relative dir
				let folderPath = ""
				if (msg?.startsWith("~")) {
					folderPath = vscode.workspace.rootPath + "\\" + msg.replace("~", "");
				} else {
					folderPath = vscode.workspace.rootPath + "\\" + currentFileDir.replace("/", "\\") + "\\" + msg;
				}
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
												outputStringArray.push(index + "| [" + file.toString().split(index + "_").join("").split("\.md").join("") + "](" + msg?.replace("~", "") + "/" + file + ") | " + fabs + "\n");
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
				password:false,	            // 输入内容是否是密码
				ignoreFocusOut:true,        // 默认false，设置为true时鼠标点击别的地方输入框不会消失
				placeHolder:'input cmd：',	// 在输入框内的提示信息
				prompt: "cmds: " + cmds.join("/"),  // 在输入框下方的提示信息
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
						} else if (msg.toLowerCase() == "table") {
							doTable(activeEditor);
						} else if (msg.toLowerCase() == "indent") {
							doIndent(activeEditor);
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

	disposable = vscode.commands.registerCommand('extension.mdtable', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doTable(activeEditor);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.mdindent', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doIndent(activeEditor);
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
