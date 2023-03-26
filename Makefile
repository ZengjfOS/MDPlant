mdplantCountLine    = $(shell find src -iname "*.ts" | xargs wc -l | tail -n 1 | awk -F ' ' '{print $$1}')
mdplantlibCountLine = $(shell find node_modules/mdplantlib/lib node_modules/mdplantlib/test -iname "*.js" | xargs wc -l | tail -n 1 | awk -F ' ' '{print $$1}')
countLine           = $(shell echo $(mdplantCountLine)+$(mdplantlibCountLine) | bc)

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
	rm -rf mdplant-*.vsix

count:
	@echo "MDPlant:    $(mdplantCountLine) lines"
	@echo "MDPlantLib: $(mdplantlibCountLine) lines"
	@echo "$(countLine) line for valid working code :\)"

package: remote
	vsce package

install:
	code --install-extension mdplant-*.vsix
