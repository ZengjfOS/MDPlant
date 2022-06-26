# Change Log

All notable changes to the "mdplant" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.0.24] - 2022-6-26

### Added
- 无

### Changed
- 无

### Fixed
- 修复list中嵌套代码段导致无法快捷处理list问题

## [0.0.23] - 2022-5-29
### Added
- 无

### Changed
- change info log to console

### Fixed
- fix resolv indent error for table


## [0.0.22] - 2022-5-27
### Added
- 无

### Changed
- 无

### Fixed
- remove menu info at menu link
- resolv indent code at list


## [0.0.21] - 2022-5-18
### Added
- 无

### Changed
- 无

### Fixed
- since "#menu" and "## menu" for alt+enter(cmd + enter)


## [0.0.20] - 2022-5-3
### Added
- 无

### Changed
- 无

### Fixed
- http index for alt+enter(cmd + enter)
- since "## docs" for alt+enter(cmd + enter)

## [0.0.19] - 2022-3-11
### Added
- 无

### Changed
- 无

### Fixed
- chinese punctuation


## [0.0.18] - 2022-3-7
### Added
- 无

### Changed
- 无

### Fixed
- compatible Windows



## [0.0.17] - 2022-3-5
### Added
- auto generate image index when paste image

### Changed
- 无

### Fixed
- fix last line can't work for ctrl + enter when paste image


## [0.0.16] - 2022-2-11
### Added
- 无

### Changed
- 无

### Fixed
- fix last line can't work for ctrl + enter
- fix ctrl+ enter not work for directory

## [0.0.15] - 2022-1-7
### Added
- ctrl+enter will auto check menu/list/indent/table function

### Changed
- 无

### Fixed
- 无

## [0.0.14] - 2021-12-11
### Added
- ctrl+enter(cmd+enter) for save image from clipboard

### Changed
- 无

### Fixed
- 无

## [0.0.13] - 2021-11-19
### Added
- 无

### Changed
- more easy use for salt cmd
- keep line wihtespace for list cmd

### Fixed
- 无

## [0.0.12] - 2021-10-16
### Added
- support sub dir README.md

### Changed
- table use default dir "docs" when enter empty inputed

### Fixed
- 无


## [0.0.11] - 2021-09-30
### Added
- support indent, list to tree

### Changed
- 无

### Fixed
- 无

## [0.0.10] - 2021-09-22
### Added
- 无

### Changed
- 无

### Fixed
- support list revert
- support salt revert
- remove index, table is batter then index
- table with relative path for default generate and for absolute with '~' string start

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