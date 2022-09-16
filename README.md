# vscode Plugin

## 离线安装

`code --install-extension mdplant-x.x.x.vsix`

## command list

* mdplant
  * index: 采用list的形式列举指定目录下指定正则表达式的的文件链接
  * list: 将鼠标当前行文字转成链接或者图片链接
  * indent: 将代码list转换为tree
  * table: 生成Markdown Table目录
  * menu: 生成Markdown Menu
* mdindex: 同mdplant -> index解释
* mdlist: 同mdplant -> list解释
* mdindent: 同mdplant -> indent解释
* mdtable: 同mdplant -> table解释
* mdmenu: 同mdplant -> menu解释

## 使用示例

### index命令

采用list的形式列举指定目录下指定正则表达式的的文件链接，譬如`^\\d{1,4}_.*\\.md`可以匹配以1～4个数字和下划线开头md文件

### indent命令

将以下代码

```
* title
  * program 1
    * text 1
  * program 2
    * text 2
    * program 3
      * text 3
      * program 4
        * text 4
    * program 5
      * text 5
  * program 6
    * text 6
```

转成

```
* title
  ├── program 1
  │   └── text 1
  ├── program 2
  │   ├── text 2
  │   ├── program 3
  │   │   ├── text 3
  │   │   └── program 4
  │   │       └── text 4
  │   └── program 5
  │       └── text 5
  └── program 6
      └── text 6
```

### list命令

将当前行的内容转成文字链接或者图片，能够自动检测`png`、`jpg`、`jpeg`、`svg`格式图片，转成图片链接

### indent命令

用于分析代码，List结构，将List缩进数据转成Tree格式

### table命令

根据输入的相对目录（打开的项目根目录），根据`/^\d{1,4}_.*\.md/g`正则表达式匹配文件名，获取文件标题一下的第一行实体内容作为摘要，组成Table表格

### menu命令

提取当前文档的标题，并形成菜单

## 注意

* **在不同的电脑上开发的时候，发现需要使用`npm install`来下载一些项目必要的依赖包；**
* 如果你安装了`Markdown All in One`插件，`menu`命令会出现`Table of Contents(out of date)`问题；

## 编译及安装

* 如果没有安装nodejs，安装nodejs
  * https://nodejs.org/zh-cn/download/
* npm install -g yo generator-code
* npm install -g vsce
  * sudo npm install -g vsce --unsafe-perm=true --allow-root
* npm install -g typescript
* 二次编译的可以直接用下面这条安装依赖
  * npm install
    * 可能需要：https://www.npmjs.com/package/@types/vscode
      * npm install @types/vscode@1.43.0
      * npm install @types/vscode@1.33.0
* yo code
* code ./mdplant
* cd mdplant
* vsce package
* code --install-extension mdplant-0.0.1.vsix

## save image

* 参考：https://github.com/mushanshitiancai/vscode-paste-image
* mac: 
  * 截屏：cmd + shift + 5
  * 保存
    ```
    osascript res/mac.applescript `pwd`/temp.png
    ```
