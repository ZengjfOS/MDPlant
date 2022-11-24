all: package install

local: delete
	npm install ../MDPlantLib

remote: delete
	npm install mdplantlib

delete:
	@# for macOS
	@#   1. install gnu-sed with cmd: brew install gnu-sed
	@#   2. use cmd 'brew info gnu-sed' to get path setting for ~/.zshrc
	sed -i"" -e "/mdplantlib/d" package.json
	rm -rf node_modules/mdplantlib

package: remote
	vsce package

install:
	code --install-extension mdplant-*.vsix
