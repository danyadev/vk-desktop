export const ru = {
  vk_desktop_label: 'VK Desktop',
  cancel: 'Отмена',
  months_of: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ],

  auth_login_placeholder: 'Телефон или почта',
  auth_password_placeholder: 'Пароль',
  auth_submit: 'Войти',
  auth_show_password: 'Показать пароль',
  auth_hide_password: 'Скрыть пароль',
  auth_register: 'Зарегистрироваться',
  auth_forgot_password: 'Забыли пароль?',
  auth_account_delete: 'Удалить',

  auth_confirm_login: 'Подтвердите вход',
  auth_sms_with_code_sent: 'SMS с кодом отправлен на номер {0}',
  auth_enter_code_from_code_gen_app: 'Введите код из приложения генератора кодов',
  auth_enter_code: 'Введите код',
  auth_sms_is_sending: 'SMS отправляется',
  auth_resend_sms_at: 'Повторить через {time}',
  auth_resend_sms: 'Повторить отправку SMS',
  auth_send_sms: 'Отправить SMS',

  auth_captcha_enter_error: 'Ошибка ввода капчи',
  auth_user_load_error: 'Ошибка получения данных о пользователе',
  auth_app_token_getting_error: 'Ошибка получения токена приложения',
  auth_network_error: 'Ошибка сети',
  auth_unknown_error: 'Неизвестная ошибка',

  me_convo_list_author: '{author}:',
  me_convo_list_author_you: 'Вы',
  me_convo_list_date_mins: '{mins}м',
  me_convo_list_date_hours: '{hours}ч',
  me_convo_list_date_days: '{days}д',
  me_convo_list_date_weeks: '{weeks}н',
  me_convo_empty: 'Пустой диалог',
  me_message_disappeared: 'Сообщение исчезло',
  me_unsupported_message: 'Сообщение не поддерживается',
  me_message_attaches: ['Вложение', '{0} вложения', '{0} вложений'],
  me_message_messages: ['Сообщение', '{0} сообщения', '{0} сообщений'],

  //#region service messages
  me_service_chat_create: [
    '{author} создал чат «{title}»',
    '{author} создала чат «{title}»'
  ],
  me_service_chat_title_update: [
    '{author} изменил название чата с «{oldTitle}» на «{title}»',
    '{author} изменила название чата с «{oldTitle}» на «{title}»'
  ],
  me_service_chat_photo_update: [
    '{author} обновил фотографию чата',
    '{author} обновила фотографию чата'
  ],
  me_service_chat_photo_remove: [
    '{author} удалил фотографию чата',
    '{author} удалила фотографию чата'
  ],
  me_service_chat_kick_don: 'Вы исключены из чата, так как перестали поддерживать сообщество через VK Donut',
  me_service_call_transcription_failed: 'Не удалось создать расшифровку звонка',
  me_service_chat_invite_user_by_link: [
    '{author} присоединился к чату по ссылке',
    '{author} присоединилась к чату по ссылке'
  ],
  me_service_chat_screenshot: [
    '{author} сделал скриншот чата',
    '{author} сделала скриншот чата'
  ],
  me_service_chat_group_call_started: [
    '{author} начал групповой звонок',
    '{author} начала групповой звонок'
  ],
  me_service_chat_invite_user_by_call_join_link: [
    '{author} присоединился к звонку по ссылке',
    '{author} присоединилась к звонку по ссылке'
  ],
  me_service_chat_invite_user: [
    '{author} пригласил {target}',
    '{author} пригласила {target}'
  ],
  me_service_chat_invite_user_self: [
    '{author} вернулся в чат',
    '{author} вернулась в чат'
  ],
  me_service_chat_kick_user: [
    '{author} исключил {target}',
    '{author} исключила {target}'
  ],
  me_service_chat_kick_user_self: [
    '{author} вышел из чата',
    '{author} вышла из чата'
  ],
  me_service_accepted_message_request: 'Это {target} из вашего списка контактов',
  me_service_chat_invite_user_by_message_request: [
    '{author} пригласил {target} в чат',
    '{author} пригласила {target} в чат'
  ],
  me_service_chat_invite_user_by_call: [
    '{author} пригласил {target} в звонок',
    '{author} пригласила {target} в звонок'
  ],
  me_service_chat_kick_user_call_block: [
    '{target} исключён из чата',
    '{target} исключена из чата'
  ],
  me_service_chat_pin_message: [
    '{author} закрепил сообщение «{message}»',
    '{author} закрепила сообщение «{message}»'
  ],
  me_service_chat_unpin_message: [
    '{author} открепил сообщение «{message}»',
    '{author} открепила сообщение «{message}»'
  ],
  me_service_conversation_style_update: [
    '{author} изменил оформление чата на «{style}»',
    '{author} изменила оформление чата на «{style}»'
  ],
  me_service_conversation_style_reset: [
    '{author} сбросил оформление чата',
    '{author} сбросила оформление чата'
  ],
  //#endregion

  //#region message attaches
  me_message_attach_photo: ['Фотография', '{0} фотографии', '{0} фотографий'],
  me_message_attach_audio: ['Аудиозапись', '{0} аудиозаписи', '{0} аудиозаписей'],
  me_message_attach_video: ['Видео', '{0} видео', '{0} видео'],
  me_message_attach_doc: ['Файл', '{0} файла', '{0} файлов'],
  me_message_attach_link: ['Ссылка', '{0} ссылки', '{0} ссылок'],
  me_message_attach_gift: 'Подарок',
  me_message_attach_sticker: 'Стикер',
  me_message_attach_ugc_sticker: 'Стикер',
  me_message_attach_wall: 'Запись',
  me_message_attach_wall_reply: 'Комментарий',
  me_message_attach_event: 'Мероприятие',
  me_message_attach_audio_message: 'Аудиосообщение',
  me_message_attach_audio_playlist: 'Плейлист',
  me_message_attach_artist: 'Исполнитель',
  me_message_attach_curator: 'Куратор',
  me_message_attach_article: 'Статья',
  me_message_attach_poll: 'Опрос',
  me_message_attach_story: 'История',
  me_message_attach_narrative: 'Сюжет',
  me_message_attach_graffiti: 'Граффити',
  me_message_attach_market: 'Товар',
  me_message_attach_podcast: 'Подкаст',
  me_message_attach_money_request: 'Денежный запрос',
  me_message_attach_money_transfer: 'Денежный перевод',
  me_message_attach_geo: 'Карта',
  me_message_attach_call: 'Звонок',
  me_message_attach_group_call_in_progress: 'Звонок',
  me_message_attach_mini_app: 'Мини-приложение',
  me_message_attach_app_action: 'Сервис',
  me_message_attach_video_message: 'Видеосообщение',
  me_message_attach_widget: 'Виджет',
  me_message_attach_question: 'Вопрос',
  me_message_attach_donut_link: 'Сообщество с VK Donut',
  //#endregion

  me_convo_styles: {
    unknown: 'Неизвестное',
    default: 'Основное',
    candy: 'Розовое',
    crimson: 'Красное',
    disco: 'Диско',
    easter_egg: 'Красивое',
    emerald: 'Зелёное',
    frost: 'Ледяное',
    gamer: 'Геймерское',
    gifts: 'Подарки',
    halloween_orange: 'Тыквенное',
    halloween_violet: 'Мистическое',
    lagoon: 'Голубое',
    mable: 'Стандартное',
    marine: 'Морское',
    midnight: 'Синее',
    new_year: 'Новогоднее',
    retrowave: 'Ретровейв',
    sberkot: 'СберКот',
    sunset: 'Оранжевое',
    twilight: 'Сумерки',
    unicorn: 'Нежное',
    valentine: 'Романтичное',
    vk17: 'Праздничное',
    warm_valentine: 'Амурное',
    womens_day: 'Весеннее'
  },

  me_choose_chat_to_write: 'Выберите, кому хотели бы написать',

  modal_cancel_label: 'Отмена',
  modal_send_label: 'Отправить',
  modal_delete_label: 'Удалить',

  captchaModal_title: 'Введите капчу',
  captchaModal_enter_code: 'Введите код',

  confirmAccountDelete_title: 'Удаление аккаунта',
  confirmAccountDelete_confirm: 'Вы действительно хотите удалить аккаунт {0}?',

  app_menu_labels: {
    appMenuTitle: 'VK Desktop',
    about: 'О программе',
    settings: 'Настройки',
    services: 'Сервисы',
    hideApp: 'Скрыть VK Desktop',
    hideOthers: 'Скрыть остальные',
    showAllApps: 'Показать все',
    quit: 'Выйти из VK Desktop',

    editMenuTitle: 'Правка',
    undo: 'Отменить',
    redo: 'Повторить',
    cut: 'Вырезать',
    copy: 'Скопировать',
    paste: 'Вставить',
    selectAll: 'Выбрать все',

    viewMenuTitle: 'Вид',
    reload: 'Перезагрузить',
    resetZoom: 'Сбросить размер',
    zoomIn: 'Увеличить',
    zoomOut: 'Уменьшить',

    windowMenuTitle: 'Окно',
    minimize: 'Свернуть',
    close: 'Закрыть',

    helpMenuTitle: 'Справка',
    vkPage: 'Страница в VK',
    githubPage: 'Страница на GitHub'
  }
} as const
