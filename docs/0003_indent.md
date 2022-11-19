# indent命令

将锁紧结构转换为tree显示

# 参考

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
