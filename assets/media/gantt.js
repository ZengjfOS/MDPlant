// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();

	/**
	 * "shortName"
	 * "projectStarts"
	 * "workRequires"
	 * "starts"
	 * "ends"
	 * "startsEnds"
	 * "startsAt"
	 * "completed"
	 */
	let ids = [
		"startGantt",
		"shortName",
		"projectStarts",
		"workRequires",
		"starts",
		"ends",
		"startsEnds",
		"startsAt",
		"completed"
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
