// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs'
// import * as myExtension from '../extension';

interface DatasetItem {
	"title": string,
	"description": string,
	"enable": boolean,
	"cursor": number,
	"input": string[],
	"output": string[],
	"checkType": string
}
export interface Dataset {
	"title": string,
	"enable": boolean,
	"sets": DatasetItem[]
}

export function getRootPath(workspaceFolders: ReadonlyArray<vscode.WorkspaceFolder> | undefined, filePath: string) {
	let output = ""

	if (workspaceFolders?.length == 1)
		output = workspaceFolders[0].uri.fsPath
	else {
		workspaceFolders?.forEach(workspaceFolder => {
			console.log("workspace folder: " + workspaceFolder.uri.fsPath)
			if (filePath.includes(workspaceFolder.uri.fsPath)) {
				output = workspaceFolder.uri.fsPath
			}
		})
	}

	return output
}

export async function mdplantEditorTest(filePath: string, content: string, textPos: vscode.Position, cursor: vscode.Position, doEditor: (activeEditor: vscode.TextEditor) => void, doCheck: (filePath: string, data: DatasetItem) => boolean, data: DatasetItem) {
	let runFlag = false
	let rootPath = getRootPath(vscode.workspace.workspaceFolders, __dirname)
	let fileFullPath = rootPath + "/" + filePath

	console.log("[prepare] root path >>>: " + rootPath)
	console.log("[prepare] start open to write file >>>: " + filePath)

	await vscode.workspace.openTextDocument(fileFullPath).then( async doc => {
		console.log("[delete] start show file for delete file content >>>: " + filePath)
		await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
			await editor.edit(editorEdit => {
				let range = new vscode.Range(editor.document.lineAt(0).range.start, editor.document.lineAt(editor.document.lineCount - 1).range.end)
				editorEdit.delete(range);
				console.log("[delete] delete all content >>>: " + filePath)
			}).then(isSuccess => {
				console.log("[delete] delete all content success? >>>: " + isSuccess)
			})
		})
		doc.save()
		console.log("[delete] end show file for delete file content >>>: " + filePath)

		console.log("[editor] start show file >>>: " + filePath)
		await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
			await editor.edit(editorEdit => {
				editorEdit.insert(textPos, content);
				console.log("[editor] content writen to >>>: " + filePath)
			}).then(isSuccess => {
				console.log("[editor] insert success? >>>: " + isSuccess)

				if (isSuccess) {
					console.log("[editor] start do content check >>>: " + filePath)
					let selections = editor.selections.map(s => {
						// let pos = editor.document.positionAt(11)
						return new vscode.Selection(s.anchor, cursor);
					});
					editor.selections = selections;
					console.log("[editor] check active line >>>: " + editor.selection.active.line)

					if (doEditor)
						doEditor(editor)

					console.log("[editor] end do content check >>>: " + filePath)
				}
			})

			await editor.document.save()
			console.log("[editor] end show file <<<: " + filePath)
		})

		console.log("[editor] end open to write file <<<: " + filePath)

		await doc.save()
	}, err => {
		console.error('open ' + filePath + ' in window err: ' + err);
	}).then(() => {
		if (doCheck) {
			console.log("[check] start do check >>>: " + filePath)
			if (fs.existsSync(fileFullPath)) {
				runFlag = doCheck(fileFullPath, data)
			} else {
				console.log("[check] file not exist >>>: " + fileFullPath)
			}
			console.log("[check] end do check >>>: " + filePath)
		}
	})

	return runFlag
}

function doCheck(filePath: string, data: DatasetItem){
	let runFlag = false
	console.log("[check] enter doCheck")
	console.log("[check] read from file: "+ filePath)

	if (data.checkType == "content") {
		let fileContent = fs.readFileSync(filePath).toString().split(/\r?\n/)
		let checkFlag = false

		for (let i = 0; i < fileContent.length; i++) {
			// console.log("[check] " + fileContent[i] + " -> " + data.output[i])
			if (fileContent[i] != data.output[i]) {
				console.log("[check] error: " + fileContent[i] + " -> " + data.output[i])
				checkFlag = true
			}
		}

		if (!checkFlag)
			runFlag = true
	}

	console.log("[check] end doCheck")

	return runFlag
}

export async function mdplantEditorTestSample(filePath: string, doEditor: (activeEditor: vscode.TextEditor) => void, jsonFile: string, key: string) {
	let rootPath = getRootPath(vscode.workspace.workspaceFolders, __dirname)
	let dataset = loadJsonDataset(rootPath + "/" + jsonFile, key)

	if ((!dataset.hasOwnProperty("enable")) || dataset.enable) {
		console.log("[config] start dataset: " + dataset.title)
		for (let i = 0; i < dataset.sets.length; i++) {
			let data = dataset.sets[i]

			console.log("----------------------start mdplant unit test--------------------------------- ")
			console.log("[config] " + data.title)
			if (data.hasOwnProperty("description"))
				console.log("[config] " + data.description)

			if ((!data.hasOwnProperty("enable")) || data.enable) {
				let runFlag = await mdplantEditorTest(filePath, data.input.join("\n"), new vscode.Position(0, 0), new vscode.Position(data.cursor, 0), doEditor, doCheck, data)

				console.log("[config] return runFlag: " + runFlag)
				assert.equal(true, runFlag);
			} else {
				console.log("[config] skip dataset item: " + data.title)
			}

			console.log("------------------------end mdplant unit test--------------------------------- ")
		}
	} else {
		console.log("[config] skip dataset: " + dataset.title)
	}
}

export function loadJsonDataset(filePath: string, datasetName: string) {

	let tableEntry

	try {
		const data = fs.readFileSync(filePath, 'utf8');
		// parse JSON string to JSON object
		const config = JSON.parse(data);

		tableEntry = eval('config.' + datasetName)
	} catch (err) {
		console.log(`Error reading file from disk: ${err}`);
		tableEntry = {"title": "can't get data", "sets": []}
	}

	return tableEntry
}
