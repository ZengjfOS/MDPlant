# 换vscode开发版本

需要用到webview，对版本有要求

# steps

https://github.com/microsoft/vscode-extension-samples/blob/main/webview-view-sample/package.json#L64C21-L64C28

```js
{
	"devDependencies": {
		"@types/vscode": "^1.73.0",
        // ...省略
	}
}
```

`npm install @types/vscode@1.73.0`
