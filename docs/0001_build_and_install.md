# build and install

编译及安装

# 离线安装

`code --install-extension mdplant-x.x.x.vsix`

# 注意

* **在不同的电脑上开发的时候，发现需要使用`npm install`来下载一些项目必要的依赖包；**
* 如果你安装了`Markdown All in One`插件，`menu`命令会出现`Table of Contents(out of date)`问题；

# 编译及安装

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
