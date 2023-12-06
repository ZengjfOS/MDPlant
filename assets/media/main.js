// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();
	let ids = ['AtoB', 'AdashToB', 'AtoBAndDashToA', 'altWithAtoB', 'optWithAtoB', 'loopWithAtoB']

	document.getElementById('AtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'AtoB' });
	});

	document.getElementById('AdashToB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'AdashToB' });
	});

	document.getElementById('AtoBAndDashToA').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'AtoBAndDashToA' });
	});

	document.getElementById('altWithAtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'altWithAtoB' });
	});

	document.getElementById('optWithAtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'optWithAtoB' });
	});

	document.getElementById('loopWithAtoB').addEventListener('click', () => {
		vscode.postMessage({ type: 'functionSelected', value: 'loopWithAtoB' });
	});

}());


