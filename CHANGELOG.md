# Change Log

All notable changes to the "mdplant" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release
## [0.0.7] - 2021-01-31
### Added
- 无

### Changed
- 无

### Fixed
- support gif
- table remove subfix `.md`



## [0.0.7] - 2020-04-2
### Added
- 无

### Changed
- 无

### Fixed
- 匹配GMF标题目录，主要是移除`、.()`标题中的这几个字符


## [0.0.6] - 2020-03-29
### Added
- menu命令，提取当前文档的标题，并形成菜单

### Changed
- 无

### Fixed
- 无

## [0.0.5] - 2020-03-28
### Added
- table命令，将index命令生成的索引换成生成table，并提取其摘要内容，摘要内容是标题一到标题二之间的第一行实体内容，如果没有，显示`Empty Abstract`

### Changed
- 无

### Fixed
- 无


## [0.0.4] - 2020-03-28
### Added
- 无

### Changed
- index命令，添加Settings的`MDPlant.mdindex.fileRegEx`字段匹配文件名，默认`^\d{1,4}_.*\.md`正则表达式匹配文件名

### Fixed
- 无

## [0.0.3] - 2020-03-27
### Added
- index命令，根据输入的相对目录（打开的项目根目录），根据`/^\d{1,4}_.*\.md/g`正则表达式匹配文件名，以Markdown list形式展现

### Changed
- 无

### Fixed
- 无