# VK Desktop

## Скачать VK Desktop

Скачать последнюю версию приложения всегда можно [здесь](https://github.com/danyadev/vk-desktop/releases).

## Сборка приложения

Для начала, вы должны установить [Node.js](http://nodejs.org) **10+** и [Yarn](https://yarnpkg.com/en/docs/install).

После клонирования этого репозитория запустите следующее:

``` bash
$ yarn # Установит все зависимости в проекте
$ yarn rebuild # Только для Windows, соберет пакет winutils

$ yarn build # Собирает VK Desktop + собирает установщик для macOS

# Здесь можно указать 32, 64 или ничего, чтобы собрать под все разрядности
$ yarn win-setup[32|64] # Собирает установщик для Windows
```
