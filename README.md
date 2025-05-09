# VK Desktop

<img width="1154" src="https://github.com/user-attachments/assets/4347a206-fd96-4765-9667-46718cabea05" />

## Скачать VK Desktop

Все версии приложения со списком изменений расположены в
[разделе релизов](https://github.com/danyadev/vk-desktop/releases).

Поддерживается Windows 7+, macOS 10.13+ (включая arm64) и Linux

## Как открыть DevTools в приложении

Windows и Linux: `Ctrl + Shift + I`  
MacOS: `Cmd + Option + I`

## Получение логов

__Для версии 1.0.0-alpha логи не генерируются.__

* **Windows**: `%appdata%/vk-desktop/logs/`
* **macOS**: `~/Library/Logs/vk-desktop/`
* **Linux**: `~/.config/vk-desktop/logs/`

## Если не запускается приложение на macOS

Это связано с тем, что приложение не было подписано, потому что это стоит 100$ в год.

Чтобы разрешить запуск, нужно вызвать эту команду в консоли:
```bash
xattr -r -d com.apple.quarantine /Applications/VK\ Desktop.app
```

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
