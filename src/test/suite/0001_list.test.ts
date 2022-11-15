import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { after, before, it } from 'mocha';
import * as fs from 'fs'
// import * as myExtension from '../extension';
import * as mdplantTest from './lib/MDPlantTest'
import * as mdplant from '../../extension'
import * as path from 'path'

suite('Extension List Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let rootPath = mdplantTest.getRootPath(vscode.workspace.workspaceFolders, __dirname)
	let filePath = "output/" + path.basename(__filename) + ".md"
	let fileFullPath = rootPath + "/" + filePath

	before(async () => {
		console.log("before")

		if (!fs.existsSync(fileFullPath)) {
			let fd = fs.openSync(fileFullPath, 'w')
			fs.writeSync(fd, "Hello Word\r\n你好！\r\n")
			await fs.closeSync(fd)
		}
	})

	after(async () => {
		/*
		if (fs.existsSync(fileFullPath)) {
			let fd = fs.openSync(fileFullPath, 'w')
			fs.writeSync(fd, "")
			await fs.closeSync(fd)

			// await fs.unlinkSync(fileFullPath)
		}
		*/

		console.log('after');
	});

	test('list test', async () => {
		assert.equal(-1, [1, 2, 3].indexOf(5));
		assert.equal(-1, [1, 2, 3].indexOf(0));

		await mdplantTest.mdplantEditorTestSample(filePath, mdplant.doList, "res/0001_list.json", "dataset")
	});
});
