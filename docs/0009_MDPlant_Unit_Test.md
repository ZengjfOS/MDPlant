# MDPlant Unit Test

单个MDPlant单元测试说明

# 说明

* 需要指定一个缓存文件
* 修改完成之后保存，会触发文件保存操作
* 之后会进行缓存文件内容校验

```
----------------------start mdplant unit test---------------------------------
[config] title with http link
[prepare] root path >>>: /Users/zengjf/zengjf/github/MDPlant/src/test/suite
[prepare] start open to write file >>>: output/0001_list.test.js.md
[delete] start show file for delete file content >>>: output/0001_list.test.js.md
[delete] delete all content >>>: output/0001_list.test.js.md
[delete] delete all content success? >>>: true
[delete] end show file for delete file content >>>: output/0001_list.test.js.md
[editor] start show file >>>: output/0001_list.test.js.md
[editor] content writen to >>>: output/0001_list.test.js.md
[editor] insert success? >>>: true
[editor] start do content check >>>: output/0001_list.test.js.md
[editor] check active line >>>: 1
[info] [list]: zengjf http://zengjf.fun --> * [zengjf](http://zengjf.fun)
[editor] end do content check >>>: output/0001_list.test.js.md
[info] [mdplant]: doFile: /Users/zengjf/zengjf/github/MDPlant/src/test/suite/output/0001_list.test.js.md
[info] [project]: [
  'output/0001_list.test.js.md',
  '',
  undefined,
  undefined,
  undefined,
  undefined,
  'output/0001_list.test.js.md',
  'output',
  undefined,
  '0001_list.test.js.md',
  index: 0,
  input: 'output/0001_list.test.js.md',
  groups: undefined
]
[info] [mdplant]: {
  status: true,
  pathType: 2,
  mainPath: '',
  subPath: '',
  subrelativePath: 'output/0001_list.test.js.md',
  subSrcPath: 'output'
}
[info] [project]: refresh readme: /Users/zengjf/zengjf/github/MDPlant/src/test/suite//output
[info] [mdplant]: doFile: /Users/zengjf/zengjf/github/MDPlant/src/test/suite/output/0001_list.test.js.md
[info] [project]: [
  'output/0001_list.test.js.md',
  '',
  undefined,
  undefined,
  undefined,
  undefined,
  'output/0001_list.test.js.md',
  'output',
  undefined,
  '0001_list.test.js.md',
  index: 0,
  input: 'output/0001_list.test.js.md',
  groups: undefined
]
[info] [mdplant]: {
  status: true,
  pathType: 2,
  mainPath: '',
  subPath: '',
  subrelativePath: 'output/0001_list.test.js.md',
  subSrcPath: 'output'
}
[info] [project]: refresh readme: /Users/zengjf/zengjf/github/MDPlant/src/test/suite//output
[editor] end show file <<<: output/0001_list.test.js.md
[editor] end open to write file <<<: output/0001_list.test.js.md
[check] start do check >>>: output/0001_list.test.js.md
[check] enter doCheck
[check] read from file: /Users/zengjf/zengjf/github/MDPlant/src/test/suite/output/0001_list.test.js.md
[check] end doCheck
[check] end do check >>>: output/0001_list.test.js.md
[config] return runFlag: true
------------------------end mdplant unit test---------------------------------
```
