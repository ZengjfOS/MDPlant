// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();

	/**
	 * "startuml"
	 * "AtoB"
	 * "BtoA"
	 * "AdashToB"
	 * "AtoBAndDashToA"
	 * "altWithAtoB"
	 * "loopWithAtoB"
	 * "noteRight"
	 * "noteBlock"
	 */
	let ids = [
		"startuml",
		"AtoB",
		"BtoA",
		"AdashToB",
		"AtoBAndDashToA",
		// "altWithAtoB",
		// "loopWithAtoB",
		"noteRight",
		"noteBlock"
	]

	for (i = 0; i < ids.length; i++) {
		document.getElementById(ids[i]).addEventListener('click', (e) => {
			// console.log(e.srcElement)
			// console.log(e.srcElement.innerText)
			// console.log(e.srcElement.id)
			vscode.postMessage({ type: 'functionSelected', value: e.srcElement.id });
		});
	}

}());
