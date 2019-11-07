# VK Desktop

## Скачать VK Desktop

Скачать последнюю версию приложения всегда можно [здесь](https://github.com/danyadev/vk-desktop/releases).

## Сборка приложения

У вас должен быть установлен [Node.js](http://nodejs.org) **версии 10+**.

После клонирования этого репозитория запустите следующее:

### Windows

``` bash
$ npm i -g windows-build-tools # Установка необходимых инструментов для сборки
$ npm i # Установка всех зависимостей в проекте
$ npm run rebuild # Сборка winutils для Electron

$ npm run build # Сборка VK Desktop

# Здесь можно указать 32, 64 или ничего, чтобы собрать под все разрядности
$ npm run win-setup[32|64] # Сборка установщика
```

### macOS

```bash
$ npm i # Установка всех зависимостей в проекте
$ npm run build # Сборка VK Desktop и установщика
```

### Linux

TODO
