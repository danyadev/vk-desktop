# Инструкции по сборке

Предпологается, что у вас установлен Node.js. Если же нет, установите его с [официального сайта](https://nodejs.org).

## Для macOS

Сначала скачайте данный репозиторий, нажав на **Clone or Download > Download ZIP**. Откройте консоль и перейдите в папку проекта.

После этого скачайте [файлы для сборки](https://handlerug.me/vk-desktop/build-files-macos.zip) с иконкой и распакуйте их в корневую директорию проекта.

Затем:

```
npm install electron electron-builder --save-dev
./node_modules/.bin/electron-builder
```

Готово, сборка будет лежать в `dist/vk-desktop-<version>.dmg`.
