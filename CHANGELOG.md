# Change Log

All notable changes to the "mdplant" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release

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