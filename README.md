# README

## 参考文档

* [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)

## Install

* nodejs
* git

## steps

* 一下操作都是在cmd中进行操作，PowerShell中不行
* npm install -g yo generator-code
* yo code
  ```
  ? ==========================================================================
  We're constantly looking for ways to make yo better!
  May we anonymously report usage statistics to improve the tool over time?
  More info: https://github.com/yeoman/insight & http://yeoman.io
  ========================================================================== Yes
  
       _-----_     ╭──────────────────────────╮
      |       |    │   Welcome to the Visual  │
      |--(o)--|    │   Studio Code Extension  │
     `---------´   │        generator!        │
      ( _´U`_ )    ╰──────────────────────────╯
      /___A___\   /
       |  ~  |
     __'.___.'__
   ´   `  |° ´ Y `
  
  ? What type of extension do you want to create? New Extension (TypeScript)
  ? What's the name of your extension? MDPlant
  ? What's the identifier of your extension? mdplant
  ? What's the description of your extension? convert markdown list to plantuml
  ? Initialize a git repository? Yes
  ? Which package manager to use? npm
     create mdplant\.vscode\extensions.json
     create mdplant\.vscode\launch.json
     create mdplant\.vscode\settings.json
     create mdplant\.vscode\tasks.json
     create mdplant\src\test\runTest.ts
     create mdplant\src\test\suite\extension.test.ts
     create mdplant\src\test\suite\index.ts
     create mdplant\.vscodeignore
     create mdplant\.gitignore
     create mdplant\README.md
     create mdplant\CHANGELOG.md
     create mdplant\vsc-extension-quickstart.md
     create mdplant\tsconfig.json
     create mdplant\src\extension.ts
     create mdplant\package.json
     create mdplant\.eslintrc.json
  
  
  I'm all done. Running npm install for you to install the required dependencies. If this fails, try running the command yourself.
  
  
  npm notice created a lockfile as package-lock.json. You should commit this file.
  npm WARN optional SKIPPING OPTIONAL DEPENDENCY: fsevents@~2.1.1 (node_modules\chokidar\node_modules\fsevents):
  npm WARN notsup SKIPPING OPTIONAL DEPENDENCY: Unsupported platform for fsevents@2.1.2: wanted {"os":"darwin","arch":"any"} (current: {"os":"win32","arch":"x64"})
  npm WARN mdplant@0.0.1 No repository field.
  npm WARN mdplant@0.0.1 No license field.
  
  added 232 packages from 176 contributors and audited 528 packages in 105.095s
  
  25 packages are looking for funding
    run `npm fund` for details
  
  found 0 vulnerabilities
  
  
  Your extension mdplant has been created!
  
  To start editing with Visual Studio Code, use the following commands:
  
       cd mdplant
       code .
  
  Open vsc-extension-quickstart.md inside the new extension for further instructions
  on how to modify, test and publish your extension.
  
  For more information, also visit http://code.visualstudio.com and follow us @code.
  
  
  ```
* code ./mdplant
  会自动打开vscode，并进入调试模式；

## 修改

* package.json
  ```json
    [...]
  	"activationEvents": [
  		"onCommand:extension.mdplant"                   // 修改onCommand触发函数
  	],
  	"main": "./out/extension.js",                     // 主程序
  	"contributes": {
  		"commands": [
  			{
  				"command": "extension.mdplant",             // 命令简写对应的命令
  				"title": "mdplant"                          // 命令简写，命令
  			}
  		]
  	},
    [...]
  ```
* extension.ts
  ```TypeScript
  // The module 'vscode' contains the VS Code extensibility API
  // Import the module and reference it with the alias vscode in your code below
  import * as vscode from 'vscode';
  
  // this method is called when your extension is activated
  // your extension is activated the very first time the command is executed
  export function activate(context: vscode.ExtensionContext) {
  
  	// Use the console to output diagnostic information (console.log) and errors (console.error)
  	// This line of code will only be executed once when your extension is activated
  	console.log('Congratulations, your extension "mdplant" is now active!');
  
  	// The command has been defined in the package.json file
  	// Now provide the implementation of the command with registerCommand
  	// The commandId parameter must match the command field in package.json
  	let disposable = vscode.commands.registerCommand('extension.mdplant', () => {           // 注册命令函数
  		// The code you place here will be executed every time your command is executed
  
  		// Display a message box to the user
  		vscode.window.showInformationMessage('MDPlant Work Well!');
  	});
  
  	context.subscriptions.push(disposable);
  }
  
  // this method is called when your extension is deactivated
  export function deactivate() {}
  ```