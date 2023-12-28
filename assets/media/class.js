// @ts-nocheck

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
	const vscode = acquireVsCodeApi();

	let linkPropStatus = 0
	let linkPropStatusId = "linkStructProperty"
	let linkPropStatus0Str = "link struct property"
	let linkPropStatus1Str = "property link to"

	buttons = document.getElementsByClassName("add-color-button")
	for (i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener('click', (e) => {
			// console.log(e.srcElement)
			// console.log(e.srcElement.innerText)
			// console.log(e.srcElement.id)
			if (e.srcElement.id != linkPropStatusId) {
				document.getElementById(linkPropStatusId).innerText = linkPropStatus0Str
				linkPropStatus = 0
			}

			console.log(e.srcElement.id)
			if (e.srcElement.id == linkPropStatusId) {
				if (e.srcElement.innerText == linkPropStatus0Str) {
					e.srcElement.innerText = linkPropStatus1Str
					linkPropStatus = 0
				} else if (e.srcElement.innerText == linkPropStatus1Str) {
					e.srcElement.innerText = linkPropStatus0Str
					linkPropStatus = 1
				}
			}
			vscode.postMessage({ type: 'functionSelected', value: e.srcElement.id, status: linkPropStatus });
		});
	}

}());
