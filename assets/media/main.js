// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();

	document.getElementById('startuml').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'startuml' });
	});

	document.getElementById('AtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'AtoB' });
	});

	document.getElementById('BtoA').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'BtoA' });
	});

	document.getElementById('AdashToB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'AdashToB' });
	});

	document.getElementById('AtoBAndDashToA').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'AtoBAndDashToA' });
	});

	/*
	document.getElementById('altWithAtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'altWithAtoB' });
	});

	document.getElementById('loopWithAtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'loopWithAtoB' });
	});
	*/

	document.getElementById('noteRight').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'noteRight' });
	});

	document.getElementById('noteBlock').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'noteBlock' });
	});

}());


