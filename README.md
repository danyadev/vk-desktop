# VK Desktop

### Как установить приложение

Для установки VK Desktop нужно скачать установщик с [этого](https://github.com/danyadev/vk-desktop-installer) репозитория.

### Сборка app.asar

Установка и обновление приложения происходит при помощи скачивания `app.asar` файла с этого репозитория. Сам файл можно сгенерировать таким образом:

1. Убедитесь, что у вас на компьютере установлен [Git](https://git-scm.com/downloads) и [Node.js](https://nodejs.org/en/).
2. Склонируйте репозиторий: `git clone https://github.com/danyadev/vk-desktop.git`.
3. Перейдите в папку приложения: `cd vk-desktop`.
4. Установите зависимости: `npm i`.
5. Запустите сборку: `npm run build`.

После сборки в папке out будет лежать файл `app.asar`.
