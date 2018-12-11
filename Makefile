all: build
build:
	electron-packager . --electronVersion 4.0.0-beta.9 --overwrite
