// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { basename } from 'path';
import * as path from 'path';
import { spawn } from 'child_process';
const axios = require('axios');

let MDP_UP = -1;
let MDP_DOWN = 1;

let cmds = ["list", "salt", "indent", "menu", "table"];
let SALT_BOUNDARY = ["@startsalt", "@endsalt"]
let INDEX_BOUNDARY = ["```", "```"]
let imageSubfixArray = ['.xbm','.tif','.pjp','.svgz','.jpg','.jpeg','.ico','.tiff','.gif','.svg','.jfif','.webp','.png','.bmp','.pjpeg','.avif']

function findBoundary(editor: vscode.TextEditor, index: number, direction: number, boundary:string[]) {
	let line =index;

	while ((line != -1) && (line != editor.document.lineCount)) {
		let editorLine = editor.document.lineAt(line);
		let range = new vscode.Range(editorLine.range.start, editorLine.range.end)
		let lineText = editor.document.getText(range).trim();

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

function findIndexsWithSkip(level: number, start: number, end: number, contentArray: string[], columnInterval: number, debug: boolean, skipLevel: number) {

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
			if (line.length > ((level + skipLevel) * columnInterval) && line[(2 * level - 1 + skipLevel) * columnInterval] == "*") {
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

function listToTreeWithSkip(level: number, start: number, end: number, contentArray: string[], columnInterval: number, debug: boolean, skipLevel: number) {
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
	let indexs = findIndexsWithSkip(level + 1, start, end, contentArray, columnInterval, debug, skipLevel)
	if (debug) {
		console.log("indexs:")
		console.log(indexs)
	}

	if (indexs.length > 0) {
		if (debug)
			console.log("-------padding space--------")
		// 额外添加的行缩进，目前是每个level添加2个空格，为了更方便的阅读，2 + 2 = 4 space
		for (let i = start; i < end; i++) {
			contentArray[i] = contentArray[i].substring(0, (2 * level + skipLevel) * columnInterval) + "  " + contentArray[i].substring((2 * level + skipLevel) * columnInterval)
			if (debug)
				console.log(contentArray[i])
		}

		if (debug)
			console.log("-------replace with | --------")
		// 绘制当前的标记的列，range是前闭后开，所以要+1，因为前面为每个level增加了2个空格，替换字符位置是(2 * level + 1) * columnInterval为基准
		for (let i = start; i < (indexs[indexs.length - 1] + 1); i++) {
			contentArray[i] = contentArray[i].substring(0, (2 * level + 1 + skipLevel) * columnInterval) + "│" + contentArray[i].substring((2 * level + 1 + skipLevel) * columnInterval + 1)
			if (debug)
				console.log(contentArray[i])
		}

		if (debug)
			console.log("-------replace with └── /├──--------")
		// 绘制当前标记的行，由于需要替换掉*号，所以行范围需要range内要+1，由于前面额外的每个level添加了2个空格，所以要以(2 * level + 1) * columnInterval为基准
		indexs.forEach(value => {
			if (value == indexs[indexs.length - 1])
				contentArray[value] = contentArray[value].substring(0, (2 * level + 1 + skipLevel) * columnInterval) + "└──" + contentArray[value].substring((2 * level + 1 + skipLevel) * columnInterval + 3)
			else
				contentArray[value] = contentArray[value].substring(0, (2 * level + 1 + skipLevel) * columnInterval) + "├──" + contentArray[value].substring((2 * level + 1 + skipLevel) * columnInterval + 3)

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
				listToTreeWithSkip(level + 1, start, indexs[i], contentArray, columnInterval, debug, skipLevel)

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

function treeToListWithSkip(contentArray: string[], debug: boolean, skipSpaces: number) {
	/**
	 * 1. 所有的节点都是以'─ '开头;
	 * 2. 前面level是4的倍数；
	 * 3. 保留2个space，也就是index / 2
	 */
	for (let i = 0; i < contentArray.length; i++) {
		let index = contentArray[i].indexOf("─ ") - skipSpaces
		if (index > 0) {
			contentArray[i] = "".padStart(index / 2 + skipSpaces) + "* " + contentArray[i].substring(index + 2 + skipSpaces)
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

	let startLine = findBoundary(activeEditor, line, MDP_UP, INDEX_BOUNDARY);
	let endLine = findBoundary(activeEditor, line, MDP_DOWN, INDEX_BOUNDARY);
	let revert = false

	console.log("start: " + startLine + ", end: " + endLine);

	if (startLine >= 0 && endLine >= 0) {
		var editor = vscode.window.activeTextEditor;
		if (editor != undefined) {
			editor.edit(edit => {
				let range = new vscode.Range(activeEditor.document.lineAt(startLine + 1).range.start, activeEditor.document.lineAt(startLine + 1).range.end)
				let lineText = activeEditor.document.getText(range);
				let outString = " ";
				if (lineText.startsWith("@startsalt")) {
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
					if (lineText.startsWith("```plantuml"))
						edit.replace(range, lineText + "\n@startsalt\n{\n{T");
					else
						edit.replace(range, lineText + "plantuml\n@startsalt\n{\n{T");

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
					edit.replace(range, "}\n}\n@endsalt\n" + lineText);
				}
			}).then((value) => {
				if (revert == true) {
					console.log("revert")
					editor?.edit(edit => {
						let range = new vscode.Range(activeEditor.document.lineAt(endLine - 4).range.end, activeEditor.document.lineAt(endLine - 1).range.end)
						edit.delete(range);
						range = new vscode.Range(activeEditor.document.lineAt(startLine + 1).range.start, activeEditor.document.lineAt(startLine + 4).range.start)
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
			let rawText = activeEditor.document.getText(range)
			let spaceString = rawText.substring(0, rawText.search(/\S/))
			let lineText = activeEditor.document.getText(range).trim().replace(/\\/g, "/");
			let subfix = lineText.substring(lineText.lastIndexOf(".") + 1, lineText.length).toLowerCase();

			if (lineText.length <= 0)
				return ;

			// revert string
			if (lineText.startsWith("* ") || lineText.startsWith("![")) {
				if (lineText.indexOf("(") > -1 && lineText.indexOf(")") > -1) {
					if (lineText.indexOf("http") > -1) {
						edit.replace(range, spaceString + lineText.split("[")[1].split("]")[0] + " " + lineText.split("(")[1].split(")")[0]);
					} else {
						let showString = lineText.split("(")[1].split(")")[0]
						if (!showString.startsWith("/"))
							edit.replace(range, spaceString + showString);
						else
							edit.replace(range, spaceString + showString.replace("/", ""));
					}
				}

				return
			} else {
				if (lineText.startsWith(currentFileDir)) {
					lineText = lineText.replace(currentFileDir + "/", "");
				} else {
					if (fs.existsSync(vscode.workspace.rootPath + "/" + lineText)) {
						if (!lineText.startsWith("/"))
							lineText = "/" + lineText
					}
				}

				if (lineText.indexOf("http") > 0) {
					let lineTextSplit = lineText.split(" http");
					if (lineTextSplit.length = 2)
						edit.replace(range, spaceString + "* [" + lineTextSplit[0].trim() + "](http" + lineTextSplit[1].trim() + ")");
				} else {
					if (imageSubfixArray.includes("." + subfix))
						edit.replace(range, spaceString + "![" + basename(lineText) + "](" + lineText + ")");
					else
						edit.replace(range, spaceString + "* [" + basename(lineText) + "](" + lineText + ")");
				}

				console.log("convert txt: " + lineText);
			}
		});
	}
}

/**
 * use applescript to save image from clipboard and get file path
 */
function saveClipboardImageToFileAndGetPath(imagePath: string, cb: (imagePath: string, imagePathFromScript: string) => void) {
	if (!imagePath) return;

	let platform = process.platform;
	if (platform === 'win32') {
		// Windows
		const scriptPath = path.join(__dirname, '../res/pc.ps1');

		let command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
		let powershellExisted = fs.existsSync(command)
		if (!powershellExisted) {
			command = "powershell"
		}

		const powershell = spawn(command, [
			'-noprofile',
			'-noninteractive',
			'-nologo',
			'-sta',
			'-executionpolicy', 'unrestricted',
			'-windowstyle', 'hidden',
			'-file', scriptPath,
			imagePath
		]);
		powershell.on('error', function (e) {
			console.log(e);
		});
		powershell.on('exit', function (code, signal) {
			// console.log('exit', code, signal);
		});
		powershell.stdout.on('data', function (data: Buffer) {
			cb(imagePath, data.toString().trim());
		});
	}
	else if (platform === 'darwin') {
		console.log("darwin")
		// Mac
		let scriptPath = path.join(__dirname, '../res/mac.applescript');
		console.log(scriptPath)

		let ascript = spawn('osascript', [scriptPath, imagePath]);
		ascript.on('error', function (e) {
			console.log(e)
		});
		ascript.on('exit', function (code, signal) {
			console.log('exit',code,signal);
		});
		ascript.stdout.on('data', function (data: Buffer) {
			cb(imagePath, data.toString().trim());
		});
	} else {
		// Linux 

		let scriptPath = path.join(__dirname, '../res/linux.sh');

		let ascript = spawn('sh', [scriptPath, imagePath]);
		ascript.on('error', function (e) {
			console.log(e)
		});
		ascript.on('exit', function (code, signal) {
			// console.log('exit',code,signal);
		});
		ascript.stdout.on('data', function (data: Buffer) {
			let result = data.toString().trim();
			if (result == "no xclip") {
				console.log('You need to install xclip command first.');
				return;
			}
			cb(imagePath, result);
		});
	}
}

async function doPaste(activeEditor: vscode.TextEditor)
{
	let currentEditorFile = vscode.window.activeTextEditor?.document.uri.path;
	let editFileName = basename(currentEditorFile || "")
	let currentFileDir = path.dirname(currentEditorFile || "")
	const r = new RegExp("^\\d{1,4}_.*", "g");

	let filePrefix = ""
	if (r.test(editFileName)) {
		filePrefix = editFileName.split("_")[0] + "_"
	}

	currentFileDir = currentFileDir.replace(vscode.workspace.rootPath?.replace(/\\/g, "/") || "", "")
	let clipboard_content = await vscode.env.clipboard.readText()
	let linkFilePath = ""

	console.log(clipboard_content)
	if (fs.existsSync(clipboard_content)) {
		let imageFileSubfix = path.extname(basename(clipboard_content))
		let fileSaveRelationDir = "refers"

		if (imageSubfixArray.includes(imageFileSubfix))
			fileSaveRelationDir = "images"

		await vscode.window.showInputBox(
		{	// 这个对象中所有参数都是可选参数
			password:false,								// 输入内容是否是密码
			ignoreFocusOut:true,						// 默认false，设置为true时鼠标点击别的地方输入框不会消失
			// placeHolder:'input file name：',			// 在输入框内的提示信息
			value: filePrefix + basename(clipboard_content),
			prompt:'copy file',		// 在输入框下方的提示信息
		}).then(msg => {
			if (msg != undefined && msg.length > 0) {
				let targetFilePath = ""
				if (fs.existsSync(vscode.workspace.rootPath + "/" + currentFileDir + "/" + fileSaveRelationDir)) {
					targetFilePath = fileSaveRelationDir + "/" + msg
				} else {
					targetFilePath = msg
				}

				fs.copyFile(clipboard_content, vscode.workspace.rootPath + "/" + currentFileDir + "/" + targetFilePath, (err) => {
					if (err) throw err;
					console.log(clipboard_content + ' was copied to ' + targetFilePath);
				});

				linkFilePath = targetFilePath
			}
		})

		if (linkFilePath.trim().length > 0) {
			var editor = vscode.window.activeTextEditor;
			var line = activeEditor.selection.active.line;
			if (editor != undefined) {
				editor.edit(edit => {
					let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
					let rawText = activeEditor.document.getText(range)
					let spaceString = rawText.substring(0, rawText.search(/\S/))

					if (imageSubfixArray.includes(path.extname(linkFilePath)))
						edit.replace(range, spaceString + "![" + basename(linkFilePath) + "](" + linkFilePath + ")");
					else
						edit.replace(range, spaceString + "* [" + basename(linkFilePath) + "](" + linkFilePath + ")");
				})
			}
		}
	} else if(clipboard_content.startsWith("http")) {
		await vscode.window.showInputBox(
		{	// 这个对象中所有参数都是可选参数
			password:false,								// 输入内容是否是密码
			ignoreFocusOut:true,						// 默认false，设置为true时鼠标点击别的地方输入框不会消失
			// placeHolder:'input file name：',			// 在输入框内的提示信息
			value: filePrefix + basename(clipboard_content.split("?")[0]),
			prompt:'get doc from web',					// 在输入框下方的提示信息
		}).then(msg => {
			if (msg != undefined && msg.length > 0) {
				axios({
					method: "get",
					url: clipboard_content,
					responseType: "stream"
				}).then(function (response: any) {
					let imageFileSubfix = path.extname(basename(clipboard_content.split("?")[0]))
					let imageFilePath = ""
					let fileSaveRelationDir = "refers"

					if (imageSubfixArray.includes(imageFileSubfix))
						fileSaveRelationDir = "images"

					if (fs.existsSync(vscode.workspace.rootPath + "/" + currentFileDir + "/" + fileSaveRelationDir)) {
						imageFilePath = fileSaveRelationDir + "/" + msg + imageFileSubfix
					} else {
						imageFilePath = msg + imageFileSubfix
					}

					response.data.pipe(fs.createWriteStream(vscode.workspace.rootPath + "/" + currentFileDir + "/" + imageFilePath));

					var editor = vscode.window.activeTextEditor;
					var line = activeEditor.selection.active.line;
					if (editor != undefined) {
						editor.edit(edit => {
							let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
							let rawText = activeEditor.document.getText(range)
							let spaceString = rawText.substring(0, rawText.search(/\S/))
							if (imageSubfixArray.includes(imageFileSubfix)) 
								edit.replace(range, spaceString + "![" + basename(imageFilePath) + "](" + imageFilePath + ")");
							else
								edit.replace(range, spaceString + "* [" + basename(imageFilePath) + "](" + imageFilePath + ")");
						})
					}
				}).catch((error:any) => {
					vscode.window.showInformationMessage("文件下载失败：" + clipboard_content);
				})
			}
		})
	} else {
		var fileNumber = 0
		var editorFullPath = path.dirname(vscode.window.activeTextEditor?.document.uri.fsPath.replace(/\\/g, "/") || "");
		if (fs.existsSync(editorFullPath + "/images")) {
			var allImages = fs.readdirSync(editorFullPath + "/images")
			for (var image in allImages) {
				var imageName = allImages[image]

				if (imageName.startsWith(filePrefix)) {
					var fileNumberString = imageName.split("_")[1].split(".")[0]
					var currentFileNumber = Number(fileNumberString)
					if (currentFileNumber != NaN && currentFileNumber >= fileNumber) {
						fileNumber = currentFileNumber + 1
					}
				}
			}

			filePrefix += String(fileNumber).padStart(4,'0')
		}

		await vscode.window.showInputBox(
		{	// 这个对象中所有参数都是可选参数
			password:false,								// 输入内容是否是密码
			ignoreFocusOut:true,						// 默认false，设置为true时鼠标点击别的地方输入框不会消失
			// placeHolder:'input file name：',			// 在输入框内的提示信息
			value: filePrefix,
			prompt:'save image from clipboard',		// 在输入框下方的提示信息
		}).then(msg => {
			if (msg != undefined && msg.length > 0) {
				let imageFilePath = ""
				if (fs.existsSync(vscode.workspace.rootPath + "/" + currentFileDir + "/images")) {
					imageFilePath = "images/" + msg + ".png"
				} else {
					imageFilePath = msg + ".png"
				}

				saveClipboardImageToFileAndGetPath(vscode.workspace.rootPath + "/" + currentFileDir + "/" + imageFilePath, (imagePath, imagePathReturnByScript) => {
					if (!imagePathReturnByScript) return;
					if (imagePathReturnByScript === 'no image') {
						vscode.window.showInformationMessage("剪切板(clipboard)图片为空");
						return;
					}

					var editor = vscode.window.activeTextEditor;
					var line = activeEditor.selection.active.line;
					if (editor != undefined) {
						editor.edit(edit => {
							let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
							let rawText = activeEditor.document.getText(range)
							let spaceString = rawText.substring(0, rawText.search(/\S/))
							edit.replace(range, spaceString + "![" + basename(imageFilePath) + "](" + imageFilePath + ")");
						})
					}
				});
			}
		})
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
							if (docs[i].trim().startsWith("#") && (docs[i].trim().toLowerCase().indexOf("menu") >= 0
									|| docs[i].trim().toLowerCase().indexOf("目录") >= 0))
								continue

							if (docs[i].match(/^#{1,} /g) != null) {
								if ((i > 0 && docs[i - 1].trim().length == 0) && ((i < (docs.length - 1)) && docs[i + 1].trim().length == 0)) {
									let prefix = docs[i].substr(1, docs[i].lastIndexOf("#")).trim().replace(/#/g, "  "); 
									let content = docs[i].substr(docs[i].lastIndexOf("#") + 1).trim();
									var chinese_reg = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/g;
									menus.push(prefix + "* [" + content + "](#" + content.replace(/ /g, "-").replace(chinese_reg, "").replace(/[\\'!"#$%&()*+,.\/:;<=>?@\[\]^_`{|}~]/g, "") + ")\n");
								}
							}
						}

						let outputString = "";
						for (let i = 0; i < menus.length; i++) {
							outputString += menus[i];
						}

						edit.insert(new vscode.Position(line, 0), outputString);
						console.log("menu start: " + startLine + ", end: " + endLine);
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

	console.log("start: " + startLine + ", end: " + endLine);

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

				let skipLeve = contentArray[0].indexOf("* ") / columnInterval

				if (contentArray[1].indexOf("─ ") > 0) {
					treeToListWithSkip(contentArray, false, skipLeve * columnInterval)
				} else {
					if (findIndexsWithSkip(0, 0, contentArray.length, contentArray, columnInterval, false, skipLeve).length > 1) {
						vscode.window.showInformationMessage("只能有一个根节点，请检查格式");
						return
					}

					// check list start with "* "
					for (var i = 0; i < contentArray.length; i++) {
						let flagIndex = contentArray[i].indexOf("* ")
						if ( flagIndex < 0 || (flagIndex % 2) != 0) {
							vscode.window.showInformationMessage("检查数据格式：两个空格 * n + '* ' + 数据 (错误行：" + (startLine + i + 1) + ")");
							return
						}
					}

					listToTreeWithSkip(0, 0, contentArray.length, contentArray, columnInterval, false, skipLeve)
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
			if (msg == "") {
				msg = "docs"
				console.log("use default sub dir: " + msg)
			}
			let dirMsg = msg

			// get current file relative dir
			let currentEditorFile = activeEditor.document.uri.path
			let currentWorkspaceFold = activeEditor.document.uri.path
			if(vscode.workspace.workspaceFolders !== undefined) {
				currentWorkspaceFold = vscode.workspace.workspaceFolders[0].uri.path
			}
			let currentFileDir = path.dirname(currentEditorFile.replace(currentWorkspaceFold, ""))

			// merge relative dir
			let folderPath = ""
			if (msg?.startsWith("~")) {
				folderPath = vscode.workspace.rootPath + "/" + msg.replace("~", "");
			} else {
				folderPath = vscode.workspace.rootPath + "/" + currentFileDir + "/" + dirMsg;
			}

			var inputString = vscode.window.showInputBox(
			{ // 这个对象中所有参数都是可选参数
				password:false,               // 输入内容是否是密码
				ignoreFocusOut:true,          // 默认false，设置为true时鼠标点击别的地方输入框不会消失
				placeHolder:'input regex：',  // 在输入框内的提示信息
				prompt:'.*\\.md,^\\d{1,4}_.*\\.md',   // 在输入框下方的提示信息
				validateInput:function(text){ // 校验输入信息
					cmds.forEach(element => {
						if (text.trim() == element)
							return "";
					});

					return null;
				}
			}).then( msg => {

				if (msg == "") {
					msg = "^\\d{1,4}_.*\\.md"
					console.log("use default sub dir: " + msg)
				}

				var editor = vscode.window.activeTextEditor;
				if (editor != undefined) {

					let startLine = findEmptyLine(activeEditor, line, MDP_UP);
					let endLine = findEmptyLine(activeEditor, line, MDP_DOWN);

					if (startLine == -1)
						startLine =  0;
					else if ((startLine + 1) == activeEditor.document.lineCount)
						startLine = startLine;

					if (startLine == endLine) {
						endLine = startLine + 1
						if (endLine == activeEditor.document.lineCount)
							endLine = activeEditor.document.lineCount - 1;

						startLine = startLine - 1
					}

					if (endLine == -1) {
						if (activeEditor.document.lineCount > 1)
							endLine = activeEditor.document.lineCount - 1;
						else
							endLine = 0;
					}

					if (editor != undefined) {
						editor.edit(edit => {
							let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
							edit.delete(range);
						}).then((value) => {

							line = startLine;

							if (editor != undefined) {
								editor.edit(edit => {

									if (fs.existsSync(folderPath)) {
										let files = fs.readdirSync(folderPath || "");
										let outputString = "\nNO.|文件名称\n";
										outputString += ":--:|:--\n";
										let outputStringArray:string[] = [];
										let count = 1

										files.forEach((file: fs.PathLike) => {
											// const r = new RegExp("^\\d{1,4}_.*\\.md", "g");
											const r = new RegExp(msg || "^\\d{1,4}_.*\\.md", "g");
											const m = r.exec(file.toString());
											m?.forEach((value, index) => {
												if (file.toString().match(/\d{1,4}/) != null) {
													file.toString().match(/\d{1,4}/)?.forEach(index =>{
														outputStringArray.push(index + "| [" + file.toString().split(index + "_").join("") + "](" + dirMsg + "/" + file + ")\n");
													});
												} else {
													outputStringArray.push(("" + count).padStart(4,'0') + "| [" + file.toString().split(index + "_").join("") + "](" + dirMsg + "/" + file + ")\n");
													count += 1
												}
											});
										});

										for (let i = 0; i < outputStringArray.length; i++) {
											outputString += outputStringArray[outputStringArray.length - 1 - i];
										}

										edit.insert(new vscode.Position(line, 0), outputString);
										// console.log(outputString);

										vscode.window.showInformationMessage("list files over. start: " + startLine + ", end: " + endLine);
									} else {
										vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist");
									}
								});
							}

						});
					}
				}
			});
		}
	);
}

function fileAbstract(fileContentArr: string[]) {

	let startAbstract = false;
	for (let i = 0; i < fileContentArr.length; i++) {
		let element = fileContentArr[i].trim();
		if (element.startsWith("# ") && (startAbstract == false)) {
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

	return "Empty Abstract";
}

function doTable(activeEditor: vscode.TextEditor, checkedStartLine = -1)
{
	var line = activeEditor.selection.active.line;

	var inputString = vscode.window.showInputBox(
		{	// 这个对象中所有参数都是可选参数
			password:false,								// 输入内容是否是密码
			ignoreFocusOut:true,						// 默认false，设置为true时鼠标点击别的地方输入框不会消失
			placeHolder:'input relative direcotry：',	// 在输入框内的提示信息
			prompt:'docs',								// 在输入框下方的提示信息
			validateInput:function(text){				// 校验输入信息
				cmds.forEach(element => {
					if (text.trim() == element)
						return "";
				});

				return null;
			}
		}).then( msg => {
			if (msg == "") {
				msg = "docs"
				console.log("use default sub dir: " + msg)
			}

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

				if (checkedStartLine > 0)
					startLine = checkedStartLine

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
					folderPath = vscode.workspace.rootPath + "/" + msg.replace("~", "");
				} else {
					folderPath = vscode.workspace.rootPath + "/" + currentFileDir + "/" + msg;
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
										if (fs.lstatSync(folderPath + "/" + file).isDirectory()) {
											let subREADME = folderPath + "/" + file + "/README.md"
											if (fs.existsSync(subREADME)) {
												const r = new RegExp("^\\d{1,4}_.*", "g");
												const m = r.exec(file.toString());
												m?.forEach((value, index) => {
													const fileContentArr = fs.readFileSync(subREADME, 'utf8').split(/\r?\n/);
													let fabs = fileAbstract(fileContentArr);
													file.toString().match(/\d{1,4}/)?.forEach(index =>{
														outputStringArray.push(index + "| [" + file.toString().split(index + "_").join("") + "](" + msg?.replace("~", "") + "/" + file + "/README.md" + ") | " + fabs + "\n");
													});
													// console.log(file);
												});
											}
										} else {
											const r = new RegExp(vscode.workspace.getConfiguration().get('MDPlant.mdindex.fileRegEx') || "^\\d{1,4}_.*\\.md", "g");
											const m = r.exec(file.toString());
											m?.forEach((value, index) => {
												const fileContentArr = fs.readFileSync(folderPath + "/" + file, 'utf8').split(/\r?\n/);
												let fabs = fileAbstract(fileContentArr);
												file.toString().match(/\d{1,4}/)?.forEach(index =>{
													outputStringArray.push(index + "| [" + file.toString().split(index + "_").join("").split("\.md").join("") + "](" + msg?.replace("~", "") + "/" + file + ") | " + fabs + "\n");
												});
												// console.log(file);
											});
										}
									});

									for (let i = 0; i < outputStringArray.length; i++) {
										outputString += outputStringArray[outputStringArray.length - 1 - i];
									}

									edit.insert(new vscode.Position(line, 0), outputString);

									const result = vscode.workspace.getConfiguration().get('MDPlant.mdindex.fileRegEx');
									console.log("list files over. start: " + startLine + ", end: " + endLine + " regex: " + result);
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
			{	// 这个对象中所有参数都是可选参数
				password:false,						// 输入内容是否是密码
				ignoreFocusOut:true,				// 默认false，设置为true时鼠标点击别的地方输入框不会消失
				placeHolder:'input cmd：',			// 在输入框内的提示信息
				prompt: "cmds: " + cmds.join("/"),	// 在输入框下方的提示信息
				validateInput:function(text){		// 校验输入信息
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
						if (msg.toLowerCase() == "index") {
							doIndex(activeEditor);
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

	disposable = vscode.commands.registerCommand('extension.mdindex', () => {

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doIndex(activeEditor);
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

	disposable = vscode.commands.registerCommand('extension.mdpaste', () => {

		// just use the keybindings do more
		{
			var editor = vscode.window.activeTextEditor;
			if (editor != undefined) {

				var line = editor.selection.active.line;
				let startLine = findEmptyLine(editor, line, MDP_UP);
				let endLine = findEmptyLine(editor, line, MDP_DOWN);

				if (startLine == -1)
					startLine =  0;
				else if ((startLine + 1) == editor.document.lineCount)
					startLine = startLine;
				else
					startLine += 1;

				if (endLine == -1) {
					if (editor.document.lineCount > 1)
						endLine = editor.document.lineCount - 1;
					else
						endLine = 0;
				}

				let code_startLine = findBoundary(editor, line, MDP_UP, INDEX_BOUNDARY);
				if ((code_startLine != -1) && (code_startLine > startLine)) {
					startLine = code_startLine
					endLine = findBoundary(editor, line, MDP_DOWN, INDEX_BOUNDARY);
				}

				let range = new vscode.Range(editor.document.lineAt(line).range.start, editor.document.lineAt(line).range.end)
				let lineText = editor.document.getText(range);
				if ((lineText.trim().length > 0) && (lineText.trim().indexOf("|") < 0) && (lineText.trim().indexOf("#") < 0)) {
					if (lineText.split("](").length == 2 || lineText.indexOf("http") > -1) {
						doList(editor)
						return
					}

					if (lineText.trim().startsWith("*") 
							&& lineText.split("](").length == 2 
							&& path.basename(lineText.trim()).indexOf(".") > 0) {
						doList(editor)
						return
					}

					if (fs.existsSync(vscode.workspace.rootPath + "/" + lineText.trim())) {
						doList(editor)
						return
					}
				}

				if (lineText.trim().length > 0) {
					for (var i = startLine; i <= (endLine); i++) {
						let range = new vscode.Range(editor.document.lineAt(i).range.start, editor.document.lineAt(i).range.end)
						let lineText = editor.document.getText(range);

						if (lineText.trim().length == 0)
							continue

						if (lineText.trim() == "NO.|文件名称") {
							let range = new vscode.Range(editor.document.lineAt(i + 1).range.start, editor.document.lineAt(i + 1).range.end)
							let lineText = editor.document.getText(range);
							if (lineText.startsWith(":--:|:--")) {
								doIndex(editor)
								return
							}
						}

						if (lineText.startsWith("NO.|文件名称|摘要")) {
							let range = new vscode.Range(editor.document.lineAt(i + 1).range.start, editor.document.lineAt(i + 1).range.end)
							let lineText = editor.document.getText(range);
							if (lineText.startsWith(":--:|:--|:--")) {
								doTable(editor)
								return
							}
						}

						if (lineText.trim().startsWith("```plantuml")){
							doSalt(editor)
							return
						}

						if (lineText.trim().startsWith("```")) {
							let range = new vscode.Range(editor.document.lineAt(i + 1).range.start, editor.document.lineAt(i + 1).range.end)
							let lineText = editor.document.getText(range);
							if (lineText.trim().startsWith("* ")) {
								doIndent(editor)
								return
							}
						}

						if (lineText.split("](#").length == 2) {
							doMenu(editor)
							return
						}

						if (lineText.split("](").length == 2 || lineText.indexOf("http") > -1 || path.basename(lineText.trim()).indexOf(".") > 0) {
							doList(editor)
							return
						}

						if (fs.existsSync(vscode.workspace.rootPath + "/" + lineText.trim())) {
							doList(editor)
							return
						}

					}
				}

				// check table and create menu
				for (var i = (startLine - 1); i >= 0; i--) {
					let range = new vscode.Range(editor.document.lineAt(i).range.start, editor.document.lineAt(i).range.end)
					let lineText = editor.document.getText(range);

					if (lineText.trim().length == 0)
						continue

					if (lineText.startsWith("NO.|文件名称|摘要")) {
						let range = new vscode.Range(editor.document.lineAt(i + 1).range.start, editor.document.lineAt(i + 1).range.end)
						let lineText = editor.document.getText(range);
						if (lineText.startsWith(":--:|:--|:--")) {
							doTable(editor, i)
							return
						}
					}

					if (lineText.startsWith("# ") || lineText.startsWith("## ")) {
						var fragments = lineText.trim().split(" ")
						if (fragments.length == 2) {
							if (fragments[1].toLowerCase() == "docs"  || fragments[1].toLowerCase() == "文档索引") {
								doTable(editor)
								return
							}

							if (fragments[1].toLowerCase() == "menu" || fragments[1].toLowerCase() == "目录") {
								doMenu(editor)
								return
							}

							if (fragments[1].toLowerCase() == "index" || fragments[1].toLowerCase() == "索引") {
								doIndex(editor)
								return
							}
						}

						break
					}

				}
			}
		}

		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor) {
			doPaste(activeEditor);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
