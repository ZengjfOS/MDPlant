// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import * as mdplantlibapi from "./mdplantlibapi"

export function doPlantuml(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let contentArray: string[] = textBlock.textBlock
    console.log("doPlantuml")

    if (contentArray.length > 1) {
        activeEditor.edit( async edit => {
            if (contentArray[0].trim().startsWith("* ")) {
                contentArray =  mdplantlibapi.convert2SequenceDiagram(contentArray, startLine)
            }

            await mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
                    let suffix = mdplantlibapi.getConfig("MDPlant.plantuml.image.suffix", "svg")
                    imageFileRelativePath += "." + suffix

                    let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
                    let imageAbsolutePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath

                    mdplantlibapi.getHTTPPlantumlImage(contentArray, suffix, imageAbsolutePath, status => {
                        console.log("status: " + status + ", path: " + imageAbsolutePath)
                        activeEditor.edit(edit => {
                            if (activeEditor.document.lineCount > endLine + 2) {
                                let range = new vscode.Range(activeEditor.document.lineAt(endLine + 1).range.end, activeEditor.document.lineAt(endLine + 2).range.end)
                                let rawText = activeEditor.document.getText(range)
                                if (rawText.trim().length != 0) {
                                    edit.delete(range)
                                }
                            }
                        }).then ( value => {
                            activeEditor.edit(edit => {
                                let range = new vscode.Range(activeEditor.document.lineAt(endLine + 1).range.start, activeEditor.document.lineAt(endLine + 1).range.end)
                                let rawText = activeEditor.document.getText(range)
                                let spaceString = rawText.match(/^\s*/)
                                edit.replace(range, rawText + "\n" + spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")")

                            }).then(value => {
                                mdplantlibapi.cursor(activeEditor, endLine + 2)
                            })
                        })
                    })
            })
        })
    }
}

export function doList(activeEditor: vscode.TextEditor)
{
    let line = activeEditor.selection.active.line
    let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)

    activeEditor.edit(edit => {
        let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
        let lineText = activeEditor.document.getText(range).trim().replace(/\\/g, "/")

        if (lineText.length <= 0)
            return 

        if (lineText.startsWith(currentFileDir)) {
            lineText = lineText.replace(currentFileDir + "/", "")
        } else {
            if (fs.existsSync(mdplantlibapi.getWorkspaceFolder(activeEditor) + "/" + lineText)) {
                if (!lineText.startsWith("/"))
                    lineText = "/" + lineText
            }
        }

        let output = mdplantlibapi.doList(lineText)
        if (output.length > 0)
            edit.replace(range, output)
    }).then(value => {
        mdplantlibapi.cursor(activeEditor, line)
    })
}

export async function doPaste(activeEditor: vscode.TextEditor)
{
    mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
        imageFileRelativePath += "." + mdplantlibapi.getConfig("MDPlant.paste.image.suffix", "png")

        let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
        let ret = mdplantlibapi.saveClipboardImage(mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath)

        if (ret.status) {
            var editor = vscode.window.activeTextEditor
            var line = activeEditor.selection.active.line
            if (editor != undefined) {
                editor.edit(edit => {
                    let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
                    let rawText = activeEditor.document.getText(range)
                    let spaceString = rawText.match(/^\s*/)
                    edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")")

                    console.log("doPaste: " + imageFileRelativePath)
                }).then(value => {
                    mdplantlibapi.cursor(activeEditor, line)
                })
            }
        } else {
                vscode.window.showInformationMessage("save image error: " + ret.reason)
        }
    })
}

export function doMenu(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line)
    let startLine = textBlock.start
    let endLine = textBlock.end

    activeEditor.edit(edit => {
        let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
        edit.delete(range)
    }).then((value) => {
        activeEditor.edit(edit => {
            let docs = activeEditor.document.getText().split(/\r?\n/)
            let menus:string[] = mdplantlibapi.doMenu(docs)

            edit.insert(new vscode.Position(startLine, 0), menus.join("\n"))

            console.log("doMenu:  start: " + startLine + ", end: " + endLine)
        }).then( value => {
            mdplantlibapi.cursor(activeEditor, startLine)
        })
    })
}

export function doIndent(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let contentArray: string[] = textBlock.textBlock

    if (contentArray.length > 1) {
        activeEditor.edit(edit => {
            if (mdplantlibapi.doIndent(contentArray, startLine)) {
                edit.replace(new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end), contentArray.join("\n"))
                console.log("doIndent: finished")
            }
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })
    }
}

export function doLineShortcut(activeEditor: vscode.TextEditor, lineValue: string) {
    let output: string
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
    let relativeFilePath = lineValue.replace(currentFileDir + "/", "")
    let prefixLine = "<!-- " + relativeFilePath + " -->\n"

    output = mdplantlibapi.convert2Table(relativeFilePath, mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir)
    
    if (output.length > 0) {
        activeEditor.edit(edit => {
            let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
            edit.replace(range, prefixLine + output)
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })

        return true
    } else
        return false
}

function doDelete(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)

    console.log(pathInfo)

    // README.md修改
    if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.mainPath + "/README.md", rootPath + "/" + pathInfo.mainPath + "/" + path.dirname(pathInfo.subPath))
    } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.subPath + "/README.md", rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath)
    }
}

function doFile(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let relativePath = filePath.replace(rootPath + "", "").replace(/[\\]/gi, "/").replace(/^\//, "")
    let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)

    console.log(pathInfo)

    // 顶层目录的README.md修改不需要做任何处理
    if (relativePath == "README.md") {
        console.log("skip root README.md")

        return
    }

    // README.md修改
    if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.readme) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.mainPath + "/README.md", rootPath + "/" + pathInfo.mainPath + "/" + pathInfo.subSrcPath)
    } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.subPath + "/README.md", rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath)
    }
}

export async function doDir(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let regex = new RegExp("^(\\d{0,4})_")
    let maxIndex = 0

    console.log("doDir: " + filePath)

    // 空文件夹，拷贝整个参考模板目录
    if (filePath == rootPath) {
        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,             // 输入内容是否是密码
            ignoreFocusOut:true,        // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            prompt:'author name',       // 在输入框下方的提示信息
        }).then(msg => {
            if (msg != undefined && msg.length > 0) {
                mdplantlibapi.newProject(rootPath, msg)
            }
        })
    // 针对src、docs目录，创建子项目目录，兼容win、linux
    } else {
        let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)
        console.log(pathInfo)
        if (pathInfo.status) {
            if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir && pathInfo.subPath != "" && pathInfo.subSrcPath == "") {
                let docsPath = rootPath + "/" + path.dirname(pathInfo.subPath)

                console.log("doDir sub path: " + pathInfo.subPath)
                console.log("doDir docs path: " + docsPath)

                let files = fs.readdirSync(docsPath)
                files.forEach((dir => {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }))

                let filePrefix = String(maxIndex + 1).padStart(4,'0')
                await vscode.window.showInputBox(
                {   // 这个对象中所有参数都是可选参数
                    password:false,                       // 输入内容是否是密码
                    ignoreFocusOut:true,                  // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    // placeHolder:'input file name：',   // 在输入框内的提示信息
                    value: filePrefix + "_",
                    prompt:'sub project name',            // 在输入框下方的提示信息
                }).then(async msg => {
                    if (msg != undefined && msg.length > 0) {
                        mdplantlibapi.newSubProject(docsPath + "/" + msg)

                        doFile(docsPath + "/" + msg + "/README.md")

                        await vscode.workspace.openTextDocument(docsPath + "/" + msg + "/README.md").then( async doc => {
                            await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                console.log("show file success...")
                            })
                        })
                    }
                })
            } else if ((pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir && pathInfo.subPath != "" && pathInfo.subSrcPath != "") 
                    || pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {

                let docsPath = rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath
                let files = fs.readdirSync(docsPath)

                console.log("doDir docs path: " + docsPath)

                files.forEach((dir => {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }))

                let filePrefix = String(maxIndex + 1).padStart(4,'0')
                await vscode.window.showInputBox(
                {   // 这个对象中所有参数都是可选参数
                    password:false,                          // 输入内容是否是密码
                    ignoreFocusOut:true,                     // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                    // placeHolder:'input file name: ',      // 在输入框内的提示信息
                    value: filePrefix + "_",
                    prompt:'file name',                      // 在输入框下方的提示信息
                }).then(msg => {
                    if (msg != undefined && msg.length > 0) {
                        if (msg.indexOf(".md") == -1)
                            msg += ".md"

                        mdplantlibapi.newSubProjectWorkFile(docsPath + "/" + msg)
                    }
                })
            }
        }
    }
}

export async function doIndex(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line)

    await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                           // 输入内容是否是密码
            ignoreFocusOut:true,                      // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder:'input relative direcotry: ', // 在输入框内的提示信息
            prompt:'docs',                            // 在输入框下方的提示信息
            validateInput:function(text){             // 校验输入信息，返回null表示检查OK
                if (text.trim().length > 0)
                    return null
                else
                    return "请输入文件相对目录"
            }
        }).then( msg => {
            if (msg == undefined)
                return 

            if (msg == "") {
                msg = "docs"
                console.log("use default sub dir: " + msg)
            }

            let startLine = textBlock.start
            let endLine = textBlock.end
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let folderPath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + msg
            console.log(folderPath)

            if (fs.existsSync(folderPath)) {
                activeEditor.edit(edit => {
                    let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
                    edit.delete(range)
                }).then((value) => {
                    activeEditor.edit(edit => {
                        let outputString = mdplantlibapi.generateIndexTable(mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir, msg, "")

                        edit.insert(new vscode.Position(startLine, 0), outputString)
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine)
                    })
                })
            } else {
                vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist")
            }
        }
    )
}

export async function doTable(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)

    await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,                           // 输入内容是否是密码
            ignoreFocusOut:true,                      // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            placeHolder:'input relative direcotry: ', // 在输入框内的提示信息
            prompt:'docs',                            // 在输入框下方的提示信息
            validateInput:function(text){             // 校验输入信息，返回null表示检查OK
                return null
            }
        }).then( msg => {
            if (msg == undefined)
                return

            if (msg == "") {
                msg = "docs"
                console.log("use default sub dir: " + msg)
            }

            let startLine = textBlock.start
            let endLine = textBlock.end
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let folderPath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + msg
            console.log(folderPath)

            if (fs.existsSync(folderPath)) {
                activeEditor.edit(edit => {
                    let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
                    edit.delete(range)
                }).then((value) => {
                    activeEditor.edit(edit => {
                        let outputString = mdplantlibapi.refreshReadmeDocsTable(undefined, folderPath)
                        edit.insert(new vscode.Position(startLine, 0), outputString)
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine)
                    })
                })
            } else {
                vscode.window.showInformationMessage("folder Path: " + folderPath + " not exist")
            }
        }
    )
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "mdplant" is now active!')

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable

    disposable = vscode.commands.registerCommand('extension.mdindex', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doIndex(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdlist', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doList(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdtable', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doTable(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdindent', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doIndent(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdmenu', () => {

        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor) {
            doMenu(activeEditor)
        }
    })

    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mddir', (uri:vscode.Uri) => {
        doDir(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdpaste', () => {

        // just use the keybindings do more
        const activeEditor = vscode.window.activeTextEditor
        if (activeEditor != undefined) {

            var line = activeEditor.selection.active.line
            let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, true)
            let startLine = textBlock.start
            let endLine = textBlock.end

            console.log(textBlock)

            let textBlockInfo = mdplantlibapi.parseTextBlock(textBlock.textBlock, mdplantlibapi.getRootPath(activeEditor), line - startLine)
            console.log(textBlockInfo)

            if (textBlockInfo.status) {
                switch(textBlockInfo.type) {
                    case mdplantlibapi.projectTextBlockTypeEnum.indent:
                        doIndent(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.list:
                        doList(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.table:
                        if (textBlockInfo.info == "docs") {
                            doTable(activeEditor)
                        } else if (textBlockInfo.info == "index") {
                            doIndex(activeEditor)
                        } else if (textBlockInfo.info.startsWith("table ")) {
                            doLineShortcut(activeEditor, textBlockInfo.info)
                        }
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.menu:
                        doMenu(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.plantuml:
                        doPlantuml(activeEditor)
                        break
                    default:
                        break
                }

                return
            }

            // check table and create menu
            for (var i = (startLine - 1); i >= 0; i--) {
                let range = new vscode.Range(activeEditor.document.lineAt(i).range.start, activeEditor.document.lineAt(i).range.end)
                let lineText = activeEditor.document.getText(range)

                if (lineText.trim().length == 0)
                    continue

                if (lineText.startsWith("NO.|文件名称|摘要")) {
                    let range = new vscode.Range(activeEditor.document.lineAt(i + 1).range.start, activeEditor.document.lineAt(i + 1).range.end)
                    let lineText = activeEditor.document.getText(range)
                    if (lineText.startsWith(":--:|:--|:--")) {
                        doTable(activeEditor)
                        return
                    }
                }

                if (lineText.startsWith("# ") || lineText.startsWith("## ")) {
                    var fragments = lineText.trim().split(" ")
                    if (fragments.length == 2) {
                        if (fragments[1].toLowerCase() == "docs"  || fragments[1].toLowerCase() == "文档索引") {
                            doTable(activeEditor)
                            return
                        }

                        if (fragments[1].toLowerCase() == "menu" || fragments[1].toLowerCase() == "目录") {
                            doMenu(activeEditor)
                            return
                        }

                        if (fragments[1].toLowerCase() == "index" || fragments[1].toLowerCase() == "索引") {
                            doIndex(activeEditor)
                            return
                        }
                    }

                    break
                }

            }

            let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
            let lineText = activeEditor.document.getText(range)
            if (lineText.trim().length == 0) {
                doPaste(activeEditor)
            }
        }
    })

    context.subscriptions.push(disposable)

    let onDidSaveTextDocumentEventDispose = vscode.workspace.onDidSaveTextDocument(function(event){
        console.log("doFile: " + event.fileName)
        doFile(event.fileName)
    })

    context.subscriptions.push(onDidSaveTextDocumentEventDispose)

    let onDidDeleteFilesEventDispose  = vscode.workspace.onDidDeleteFiles(function(event){
        console.log("doDelete: " + event.files[0].path)
        doDelete(event.files[0].path)
    })

    context.subscriptions.push(onDidDeleteFilesEventDispose)
}

// this method is called when your extension is deactivated
export function deactivate() {}
