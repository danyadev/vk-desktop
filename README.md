# VK Desktop

<img width="1162" alt="image" src="https://user-images.githubusercontent.com/35631027/155030916-775ce8f8-27bd-41dd-991b-154769116e66.png">

## Скачать VK Desktop

В данный момент в разработке новая крупная версия, следить за списком изменений можно
[здесь](https://github.com/danyadev/vk-desktop/blob/master/CHANGELOG.md).

Все версии приложения со списком изменений расположены в
[разделе релизов](https://github.com/danyadev/vk-desktop/releases).

Поддерживается Windows 7+, macOS 10.13+ (включая arm64) и Linux

## Как открыть DevTools в приложении

Windows и Linux: `Ctrl + Shift + I`  
MacOS: `Cmd + Option + I`

## Получение логов

* **Windows**: `%appdata%/vk-desktop/logs/`
* **macOS**: `~/Library/Logs/vk-desktop/`
* **Linux**: `~/.config/vk-desktop/logs/`

__Для версии 1.0.0-dev логи не генерируются.__

## Сборка приложения

У вас должен быть установлен [Node.js](http://nodejs.org) 20.9.0+ и [Git](https://git-scm.com/downloads).

Для установки зависимостей нужен yarn:
```bash
npm i -g yarn
```

Скачайте репозиторий и установите зависимости:
```bash
$ git clone https://github.com/danyadev/vk-desktop.git # Клонирование репозитория
$ cd vk-desktop # Переход в папку приложения
$ yarn # Установка всех зависимостей в проекте
```

Если хочется однократно запустить приложение из исходников либо отредактировать исходники,
то можно запустить режим разработки, в котором все изменения сразу отобразятся в приложении:  
(этот вариант к тому же гораздо быстрее)
```bash
$ yarn dev
```

Если вы все-таки хотите собрать приложение:
```bash
$ yarn build # Сборка клиента

# Так же можно собрать установщик для Windows:
$ yarn win-setup64 # Сборка для x64 разрядности
# Или
$ yarn win-setup32 # Сборка для x32 (ia32) разрядности
# Или
$ yarn win-setup # Сборка для обеих разрядностей
```

После сборки все файлы будут находиться в папке `app`.
