all:
	vsce package

local: delete
	npm install ../MDPlantLib

remote: delete
	npm install mdplantlib

delete:
	sed -i "" -e "/mdplantlib/d" package.json
	rm -rf node_modules/mdplantlib

package: remote
	vsce package

install:
	code --install-extension mdplant-*.vsix
