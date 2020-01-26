# VK Desktop

## Скачать VK Desktop

Скачать последнюю версию приложения всегда можно [здесь](https://github.com/danyadev/vk-desktop/releases).

## Сборка приложения

У вас должен быть установлен [Node.js](http://nodejs.org) **версии минимум 10.13.0** и [Git](https://git-scm.com/downloads).

```bash
$ git clone https://github.com/danyadev/vk-desktop.git && cd vk-desktop # Клонирование репозитория
$ npm i # Установка всех зависимостей в проекте
$ npm run build # Сборка клиента
# ТОЛЬКО ДЛЯ WINDOWS
# Здесь можно указать 32, 64 или ничего, чтобы собрать под все разрядности
$ npm run win-setup[32|64] # Сборка установщика
```

После сборки все файлы будут находиться в папке out.
