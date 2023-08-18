// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

import * as mdplantlibapi from "./mdplantlibapi"
const logger = new mdplantlibapi.Loggger("mdplant", true)

export function doPlantumlLineShortcut(activeEditor: vscode.TextEditor, lineText:string = "")
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let contentArray: string[] = textBlock.textBlock
    let plantumlRE = new RegExp("\\s*(plantuml[\\s:]*([\\w\\/]*\\.(puml|plantuml|iuml|pu)?))", "g")
    logger.info(textBlock)
    logger.info("doPlantuml")

    if (lineText.trim().startsWith("plantuml")) {
        let matchValue = plantumlRE.exec(lineText)
        if (matchValue) {
            logger.debug(matchValue[2])
            contentArray = fs.readFileSync(path.join(mdplantlibapi.getRootPath(activeEditor), matchValue[2])).toString().split(/\r?\n/)
            logger.debug(contentArray)

            mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
                let suffix = mdplantlibapi.getConfig("MDPlant.plantuml.image.suffix", "svg")
                imageFileRelativePath += "." + suffix

                let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
                let imageAbsolutePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath

                mdplantlibapi.getHTTPPlantumlImage(contentArray, suffix, imageAbsolutePath, status => {
                    logger.info("status: " + status + ", path: " + imageAbsolutePath)
                    activeEditor.edit(edit => {
                        let range = new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end)
                        let rawText = activeEditor.document.getText(range)
                        if (rawText.trim().length != 0) {
                            // edit.delete(range)
                            let spaceString = "<!-- " + lineText + " -->\n" + rawText.match(/^\s*/)
                            edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")")
                        }
                    }).then(value => {
                        mdplantlibapi.cursor(activeEditor, startLine)
                    })
                })
            })
        }
    }
}

export function doPlantuml(activeEditor: vscode.TextEditor)
{
    var line = activeEditor.selection.active.line
    let textBlock = mdplantlibapi.getTextBlock(activeEditor, line, false)
    let startLine = textBlock.start
    let endLine = textBlock.end
    let contentArray: string[] = textBlock.textBlock
    logger.info("doPlantuml")

    if (contentArray.length > 1) {
        if (contentArray[0].trim().startsWith("* ")) {
            contentArray =  mdplantlibapi.convert2SequenceDiagram(contentArray, startLine)
        }

        mdplantlibapi.saveImageFile(activeEditor, imageFileRelativePath => {
            let suffix = mdplantlibapi.getConfig("MDPlant.plantuml.image.suffix", "svg")
            imageFileRelativePath += "." + suffix

            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let imageAbsolutePath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + imageFileRelativePath

            mdplantlibapi.getHTTPPlantumlImage(contentArray, suffix, imageAbsolutePath, status => {
                let imagePositiion = mdplantlibapi.getConfig("MDPlant.plantuml.image.position", "up")
                logger.info("status: " + status + ", image pos: " + imagePositiion +  ", path: " + imageAbsolutePath)
                activeEditor.edit(edit => {
                    if (imagePositiion == "up") {
                        if ((startLine - 2) >= 0) {
                            let range = new vscode.Range(activeEditor.document.lineAt(startLine - 2).range.start, activeEditor.document.lineAt(startLine - 1).range.start)
                            let rawText = activeEditor.document.getText(range)
                            if (rawText.trim().length != 0) {
                                startLine -= 1
                                edit.delete(range)
                            }
                        }
                    } else if (imagePositiion == "down") {
                        if (activeEditor.document.lineCount > endLine + 2) {
                            let range = new vscode.Range(activeEditor.document.lineAt(endLine + 1).range.end, activeEditor.document.lineAt(endLine + 2).range.end)
                            let rawText = activeEditor.document.getText(range)
                            if (rawText.trim().length != 0) {
                                edit.delete(range)
                            }
                        }
                    }
                }).then ( value => {
                    activeEditor.edit(edit => {
                        if (imagePositiion == "up") {
                            let range = new vscode.Range(activeEditor.document.lineAt(startLine - 1).range.start, activeEditor.document.lineAt(startLine - 1).range.end)
                            let rawText = activeEditor.document.getText(range)
                            let spaceString = rawText.match(/^\s*/)
                            edit.replace(range, spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")" + "\n" + rawText)
                        } else if (imagePositiion == "down") {
                            let range = new vscode.Range(activeEditor.document.lineAt(endLine + 1).range.start, activeEditor.document.lineAt(endLine + 1).range.end)
                            let rawText = activeEditor.document.getText(range)
                            let spaceString = rawText.match(/^\s*/)
                            edit.replace(range, rawText + "\n" + spaceString + "![" + path.basename(imageFileRelativePath) + "](" + imageFileRelativePath + ")")
                        }
                    }).then(value => {
                        if (imagePositiion == "up") {
                            mdplantlibapi.cursor(activeEditor, startLine - 1)
                        } else if (imagePositiion == "down") {
                            mdplantlibapi.cursor(activeEditor, endLine + 2)
                        }
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
    let rootPath = mdplantlibapi.getRootPath(activeEditor)

    activeEditor.edit(edit => {
        let range = new vscode.Range(activeEditor.document.lineAt(line).range.start, activeEditor.document.lineAt(line).range.end)
        let lineText = activeEditor.document.getText(range).replace(/\\/g, "/")

        if (lineText.trim().length <= 0)
            return 

        if (lineText.trim().startsWith(rootPath))
            lineText = lineText.replace(rootPath + "/", "")

        if (lineText.trim().startsWith(currentFileDir)) {
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

                    logger.info("doPaste: " + imageFileRelativePath)
                }).then(value => {
                    mdplantlibapi.cursor(activeEditor, line)
                })
            }
        } else {
            vscode.window.showInformationMessage("save image error: " + ret.content)
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

            logger.info("doMenu:  start: " + startLine + ", end: " + endLine)
        }).then( value => {
            mdplantlibapi.cursor(activeEditor, startLine)
        })
    })
}

export function doMenuIndex(activeEditor: vscode.TextEditor)
{
    let docs = activeEditor.document.getText().split(/\r?\n/)

    let contentArray = mdplantlibapi.doMenuIndex("", docs)

    var line = activeEditor.selection.active.line
    let startLine = 0
    let endLine = activeEditor.document.lineCount - 1

    if (contentArray.length > 1) {
        activeEditor.edit(edit => {
            edit.replace(new vscode.Range(activeEditor.document.lineAt(startLine).range.start, activeEditor.document.lineAt(endLine).range.end), contentArray.join("\n"))
            logger.info("doMenuIndex: finished")
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })
    }
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
                logger.info("doIndent: finished")
            }
        }).then(value => {
            mdplantlibapi.cursor(activeEditor, line)
        })
    }
}

export function doTableLineShortcut(activeEditor: vscode.TextEditor, lineValue: string) {
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

export function doCopyShortcut(activeEditor: vscode.TextEditor, lineValue: string) {
    let currentEditorFile = activeEditor.document.uri.fsPath
    let lineValueArray = lineValue.trim().split(/\s+/)
    let output = ""

    if (lineValueArray.length == 2) {
        output = mdplantlibapi.copyDocument(lineValueArray[1], [], currentEditorFile, false).content
    } else if (lineValueArray.length == 3) {
        output = mdplantlibapi.copyDocument(lineValueArray[1], [], lineValueArray[2], true).content
    }

    if (output.length > 0) {
        let preLineStart = activeEditor.selection.active.line - 1
        let preLineEnd = activeEditor.selection.active.line + 1

        activeEditor.edit(edit => {
            if (preLineStart < 0)
                preLineStart = 0
            else {
                let preRange = new vscode.Range(activeEditor.document.lineAt(preLineStart).range.start, activeEditor.document.lineAt(preLineStart).range.end)
                let preLineStartText = activeEditor.document.getText(preRange).trim()

                console.log(preLineStart)
                console.log(preLineStartText.length)

                if (preLineStartText.length != 0)
                    preLineStart = activeEditor.selection.active.line

                if (preLineEnd >= (activeEditor.document.lineCount - 1))
                    preLineEnd = activeEditor.document.lineCount - 1
            }

            console.log(preLineStart)
            console.log(preLineEnd)
            let range = new vscode.Range(activeEditor.document.lineAt(preLineStart).range.start, activeEditor.document.lineAt(preLineEnd).range.end)
            edit.delete(range)
        }).then(async value => {
            // mdplantlibapi.cursor(activeEditor, preLine)

            doFile(output)

            await vscode.workspace.openTextDocument(vscode.Uri.parse(output)).then( async doc => {
                await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                    logger.info("show file success...")

                    vscode.workspace.saveAll()
                })
            })
        })

        return true
    } else
        return false
}

function doDelete(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)

    logger.info(pathInfo)

    // README.md修改
    if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.mainPath + "/README.md", rootPath + "/" + path.dirname(pathInfo.subPath))
    } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
        const indexRE = new RegExp("^\\d{1,4}_.*", "g")
        if (!indexRE.test(path.basename(filePath)) || !filePath.endsWith(".md")) {
            logger.info("skip file: " + filePath)
            return
        }

        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.subPath + "/README.md", rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath)
    }
}

function doFile(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let relativePath = filePath.replace(rootPath + "", "").replace(/[\\]/gi, "/").replace(/^\//, "")
    let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)

    logger.info(pathInfo)

    const indexRE = new RegExp("^\\d{1,4}_.*", "g")
    if (path.basename(filePath) != "README.md" && (!indexRE.test(path.basename(filePath)) || !filePath.endsWith(".md"))) {
        logger.info("skip file: " + filePath)
        return
    }

    // 顶层目录的README.md修改不需要做任何处理
    if (relativePath == "README.md") {
        logger.info("skip root README.md")

        return
    }

    // README.md修改
    if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.readme) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.mainPath + "/README.md", rootPath + "/" + pathInfo.mainPath + "/" + pathInfo.subSrcPath)
    } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
        mdplantlibapi.refreshReadmeDocsTable(rootPath + "/" + pathInfo.subPath + "/README.md", rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath)
    }
}
export async function doSort(filePath: string) {
    logger.info("doSort: " + filePath)

    mdplantlibapi.sortDocument(filePath)
}

export async function doResort(filePath: string) {
    logger.info("doResort: " + filePath)

    mdplantlibapi.resortDocument(filePath)
}

export async function doMerge(filePath: string) {
    logger.info("doMerge: " + filePath)

    mdplantlibapi.mergeDocument(mdplantlibapi.getRootPath(undefined), mdplantlibapi.getRelativePath(filePath))
}

export async function doSubproject(filePath: string) {
    logger.info("doSubproject: " + filePath)

    let rootPath = mdplantlibapi.getRootPath(undefined)
    let regex = new RegExp("^(\\d{0,4})_")
    let docsPathRegex = new RegExp("[\\/\\\\](docs|src)[\\/\\\\]\\d{0,4}_[^\\/\\\\]*.md$")
    let maxIndex = 0
    let currentFileDir = ""

    let matchValue = docsPathRegex.exec(filePath)
    if (matchValue != null) {
        currentFileDir = filePath.replace(matchValue[0], "") + "/" + matchValue[1]
    }

    logger.info(currentFileDir)
    let pathInfo = mdplantlibapi.parsePath(rootPath, currentFileDir)
    logger.info(pathInfo)
    if (pathInfo.status) {
        if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {
            let docsPath = currentFileDir
            logger.info("doDir docs path: " + docsPath)

            let files = fs.readdirSync(docsPath)
            files.forEach((dir => {
                if (fs.lstatSync(currentFileDir + "/" + dir).isDirectory()) {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }
            }))

            if (maxIndex == 0) {
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
                        mdplantlibapi.convertToSubProject(docsPath, docsPath + "/" + msg)

                        doFile(docsPath + "/" + msg + "/README.md")

                        await vscode.workspace.openTextDocument(docsPath + "/" + msg + "/README.md").then( async doc => {
                            await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                logger.info("show file success...")
                            })
                        })
                    }
                })
            }
        }
    }
}

export async function doFormatIndex(filePath: string) {
    logger.info("doSubproject: " + filePath)

    mdplantlibapi.formatIndex(filePath)
}

export async function doDir(filePath: string) {
    let rootPath = mdplantlibapi.getRootPath(undefined)
    let regex = new RegExp("^(\\d{0,4})_")
    let maxIndex = 0

    logger.info("doDir: " + filePath)

    // 空文件夹，拷贝整个参考模板目录
    if (filePath == rootPath) {
        let authorName = ""
        let newProjectFlag = true

        if (fs.existsSync(rootPath + "/" + "conf.py")) {
            const fileContent = fs.readFileSync(rootPath + "/" + "conf.py", 'utf8').split(/\r?\n/)
            for (let i = 0; i < fileContent.length; i++) {
                if(fileContent[i].trim().startsWith("author")) {
                    authorName = fileContent[i].trim().split("=")[1].trim().replace(/'/g, "")
                    newProjectFlag = false

                    break
                }
            }
        }

        await vscode.window.showInputBox(
        {   // 这个对象中所有参数都是可选参数
            password:false,             // 输入内容是否是密码
            ignoreFocusOut:true,        // 默认false，设置为true时鼠标点击别的地方输入框不会消失
            value: authorName,
            prompt:'author name',       // 在输入框下方的提示信息
        }).then(msg => {
            if (msg != undefined && msg.length > 0) {
                if (!mdplantlibapi.newProject(rootPath, msg, newProjectFlag)) {
                    vscode.window.showInformationMessage("请清空目录及隐藏文件")
                }
            }
        })
    // 针对src、docs目录，创建子项目目录，兼容win、linux
    } else {
        let pathInfo = mdplantlibapi.parsePath(rootPath, filePath)
        logger.info(pathInfo)
        if (pathInfo.status) {
            if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.dir) {
                let docsPath = ""

                if (pathInfo.subSrcPath != "") {
                    docsPath = rootPath + "/" + pathInfo.subPath
                    docsPath += "/" + pathInfo.subSrcPath
                } else
                    docsPath = rootPath + "/" + path.dirname(pathInfo.subPath)
                logger.info("doDir docs path: " + docsPath)

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
                                logger.info("show file success...")
                            })
                        })
                    }
                })
            } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.file) {

                let docsPath = rootPath + "/" + pathInfo.subPath + "/" + pathInfo.subSrcPath
                let files = fs.readdirSync(docsPath)

                logger.info("doDir docs path: " + docsPath)

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
                }).then(async msg => {
                    if (msg != undefined && msg.length > 0) {
                        if (msg.indexOf(".md") == -1)
                            msg += ".md"

                        mdplantlibapi.newSubProjectWorkFile(docsPath + "/" + msg)

                        await vscode.workspace.openTextDocument(docsPath + "/" + msg).then( async doc => {
                            await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                logger.info("show file success...")
                            })
                        })
                    }
                })
            } else if (pathInfo.pathType == mdplantlibapi.projectPathTypeEnum.src
                    || pathInfo.subSrcPath.trim().length != 0) {

                let docsPath = rootPath + "/" + pathInfo.subSrcPath
                let files = fs.readdirSync(docsPath)

                logger.info("doDir docs path: " + docsPath)

                files.forEach((dir => {
                    let matchValue = regex.exec(dir.trim())
                    if (matchValue != null) {
                        let index = Number(matchValue[1])
                        if (index > maxIndex) {
                            maxIndex = index
                        }
                    }
                }))

                if (pathInfo.subSrcPath != "docs") {
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
                                    logger.info("show file success...")
                                })
                            })
                        }
                    })
                } else {
                    let filePrefix = String(maxIndex + 1).padStart(4,'0')
                    await vscode.window.showInputBox(
                    {   // 这个对象中所有参数都是可选参数
                        password:false,                          // 输入内容是否是密码
                        ignoreFocusOut:true,                     // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                        // placeHolder:'input file name: ',      // 在输入框内的提示信息
                        value: filePrefix + "_",
                        prompt:'file name',                      // 在输入框下方的提示信息
                    }).then(async msg => {
                        if (msg != undefined && msg.length > 0) {
                            if (msg.indexOf(".md") == -1)
                                msg += ".md"

                            mdplantlibapi.newSubProjectWorkFile(docsPath + "/" + msg)

                            await vscode.workspace.openTextDocument(docsPath + "/" + msg).then( async doc => {
                                await vscode.window.showTextDocument(doc, { preview: false }).then(async editor => {
                                    logger.info("show file success...")
                                })
                            })
                        }
                    })
                }
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
                logger.info("use default sub dir: " + msg)
            }

            let startLine = textBlock.start
            let endLine = textBlock.end
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let folderPath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + msg
            logger.info(folderPath)

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
                let mdDirs = ["docs", "src"]

                for (let i = 0; i < mdDirs.length; i++) {
                    let checkDocsPath = mdplantlibapi.getRootPath(activeEditor)
                            + "/" + mdplantlibapi.getRelativeDir(activeEditor)
                            + "/" + mdDirs[i]

                    if (fs.existsSync(checkDocsPath)) {
                        let files = fs.readdirSync(checkDocsPath)
                        let regex = new RegExp("^(\\d{0,4})_")

                        for (let j = 0; j < files.length; j++) {
                            let matchValue = regex.exec(files[j].trim())
                            if (matchValue != null) {
                                msg = mdDirs[i]

                                break
                            }
                        }
                    }

                    if (msg != "")
                        break
                }

                if (msg == "")
                    msg = "docs"

                logger.info("use default sub dir: " + msg)
            }

            let startLine = textBlock.start
            let endLine = textBlock.end
            let currentFileDir = mdplantlibapi.getRelativeDir(activeEditor)
            let folderPath = mdplantlibapi.getRootPath(activeEditor) + "/" + currentFileDir + "/" + msg
            logger.info(folderPath)

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

    // Use the console to output diagnostic information (logger.info) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    logger.info('Congratulations, your extension "mdplant" is now active!')

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

            logger.info(textBlock)

            let textBlockInfo = mdplantlibapi.parseTextBlock(textBlock.textBlock, mdplantlibapi.getRootPath(activeEditor), line - startLine)
            logger.info(textBlockInfo)

            if (textBlockInfo.status) {
                switch(textBlockInfo.type) {
                    case mdplantlibapi.projectTextBlockTypeEnum.indent:
                        doIndent(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.list:
                        doList(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.table:
                        if (textBlockInfo.content== "docs") {
                            doTable(activeEditor)
                        } else if (textBlockInfo.content == "index") {
                            doIndex(activeEditor)
                        } else if (textBlockInfo.content.startsWith("table")) {
                            doTableLineShortcut(activeEditor, textBlockInfo.content)
                        }
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.menu:
                        if (textBlockInfo.content == "")
                            doMenu(activeEditor)
                        else if (textBlockInfo.content == "menu index")
                            doMenuIndex(activeEditor)
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.plantuml:
                        if (textBlockInfo.content.startsWith("plantuml")) {
                            doPlantumlLineShortcut(activeEditor, textBlockInfo.content)
                        } else {
                            doPlantuml(activeEditor)
                        }
                        break
                    case mdplantlibapi.projectTextBlockTypeEnum.copy:
                        doCopyShortcut(activeEditor, textBlockInfo.content)
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
        logger.info("doFile: " + event.uri.fsPath)
        doFile(event.uri.fsPath)
    })

    context.subscriptions.push(onDidSaveTextDocumentEventDispose)

    let onDidDeleteFilesEventDispose  = vscode.workspace.onDidDeleteFiles(function(event){
        logger.info("doDelete: " + event.files[0].fsPath)
        doDelete(event.files[0].fsPath)
    })

    context.subscriptions.push(onDidDeleteFilesEventDispose)

    disposable = vscode.commands.registerCommand('extension.mdsort', (uri:vscode.Uri) => {
        doSort(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdresort', (uri:vscode.Uri) => {
        doResort(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdmerge', (uri:vscode.Uri) => {
        doMerge(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdsubproject', (uri:vscode.Uri) => {
        doSubproject(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    disposable = vscode.commands.registerCommand('extension.mdformatIndex', (uri:vscode.Uri) => {
        doFormatIndex(uri.fsPath)
    })
    context.subscriptions.push(disposable)

    vscode.commands.executeCommand('setContext', 'ext.unSupportedProjectPath', [
        'README.md',
        'images',
        'refers',
        'docs',
        'src',
        'drawio',
    ]);

    vscode.commands.executeCommand('setContext', 'ext.unSupportedSortPath', [
        'README.md',
        'images',
        'refers',
        'docs',
        'src',
        'drawio',
        path.basename(mdplantlibapi.getRootPath(undefined)),
    ]);
}

// this method is called when your extension is deactivated
export function deactivate() {}
