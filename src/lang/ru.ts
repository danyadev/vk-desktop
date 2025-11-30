export type RuPluralRules = 'one' | 'few' | 'many'

export const ru = {
  vk_desktop_label: 'VK Desktop',

  date_today: 'сегодня',
  date_yesterday: 'вчера',
  date_today_at_time: 'сегодня в {time}',
  date_yesterday_at_time: 'вчера в {time}',

  date_at_time: '{date} в {time}',
  date_at_time_with_year: '{date} {year} в {time}',
  date_a_moment_ago: 'только что',

  date_minutes_ago: {
    single: 'минуту назад',
    one: '{0} минуту назад',
    few: '{0} минуты назад',
    many: '{0} минут назад'
  },

  date_hours_ago: {
    single: 'час назад',
    one: '{0} час назад',
    few: '{0} часа назад',
    many: '{0} часов назад'
  },

  date_days_ago: {
    single: 'день назад',
    one: '{0} день назад',
    few: '{0} дня назад',
    many: '{0} дней назад'
  },

  select_not_selected: 'Не выбрано',
  load_error: 'Ошибка загрузки',
  retry_loading: 'Повторить',

  auth_login_placeholder: 'Телефон или почта',
  auth_password_placeholder: 'Пароль',
  auth_submit: 'Войти',
  auth_cancel: 'Отмена',
  auth_show_password: 'Показать пароль',
  auth_hide_password: 'Скрыть пароль',
  auth_by_qr_code: 'Войти по QR-коду',
  auth_by_qr_code_title: 'Вход по QR-коду',
  auth_by_qr_code_description: 'Отсканируйте QR-код, либо перейдите по ссылке с мобильного устройства',
  auth_register: 'Зарегистрироваться',
  auth_forgot_password: 'Забыли пароль?',
  auth_account_delete: 'Удалить',
  auth_error_modal_title: 'Ошибка авторизации',

  auth_confirm_login: 'Подтвердите вход',
  auth_sms_with_code_sent: 'SMS с кодом отправлен на номер {phone}',
  auth_enter_incoming_call_digits: 'Введите последние 4 цифры из входящего звонка',
  auth_enter_code_from_code_gen_app: 'Введите код из приложения генератора кодов',
  auth_enter_code: 'Введите код',
  auth_sms_is_sending: 'SMS отправляется',
  auth_resend_sms_at: 'Повторить через {time}',
  auth_resend_sms: 'Повторить отправку SMS',
  auth_send_sms: 'Отправить SMS',

  auth_profile_with_hanging_signup: 'Завершите регистрацию на сайте и повторите попытку',
  auth_incorrect_profile_type: 'Невозможно авторизовать профиль с таким типом ({type})',
  auth_get_app_token_error: 'Ошибка получения токена приложения: {description}',
  auth_user_load_error: 'Ошибка получения данных о пользователе',
  auth_network_error: 'Ошибка сети',
  auth_unknown_error: 'Неизвестная ошибка',
  auth_qr_code_declined: 'Запрос на авторизацию отклонен',
  auth_qr_code_expired: 'Время действия QR-кода истекло',

  me_convo_list_author: '{author}:',
  me_convo_list_author_you: 'Вы',
  me_convo_list_date_mins: '{mins}м',
  me_convo_list_date_hours: '{hours}ч',
  me_convo_list_date_days: '{days}д',
  me_convo_list_date_weeks: '{weeks}н',
  me_convo_list_empty_convo: 'Пустой диалог',
  me_convo_list_empty: 'Список сообщений пуст',
  me_convo_disable_notifications: 'Отключить уведомления',
  me_convo_enable_notifications: 'Включить уведомления',

  me_messages_disappeared: {
    single: 'Сообщение исчезло',
    one: '{0} сообщение исчезло',
    few: '{0} сообщения исчезло',
    many: '{0} сообщений исчезло'
  },
  me_message_attaches: {
    one: '{0} вложение',
    few: '{0} вложения',
    many: '{0} вложений'
  },
  me_messages: {
    single: 'Сообщение',
    one: '{0} сообщение',
    few: '{0} сообщения',
    many: '{0} сообщений'
  },
  me_in_reply_to_message: 'В ответ на сообщение',
  me_empty_message: 'Пустое сообщение',
  me_unknown_attach: 'Неизвестное вложение',
  me_unsupported_service_message: 'Сервисное сообщение не поддерживается',
  me_convo_composer_placeholder: 'Напишите сообщение...',
  me_choose_chat_to_write: 'Выберите, кому хотели бы написать',
  me_convo_empty_placeholder: 'История переписки пуста',
  me_convo_unread_messages: 'Новые сообщения',
  me_edited_label: 'ред.',
  me_user_online: 'online',
  me_user_was_online_a_long_time_ago: 'заходил давно',
  me_attach_wall_empty: 'Пустая запись',
  me_attach_wall_open_button: 'Открыть запись',
  me_chat_leaved_status: 'Вы вышли из чата',
  me_chat_kicked_status: 'Вы были исключены из чата',

  me_voice_transcription_error: 'Ошибка составления транскрипции',
  me_voice_transcription_in_progress: 'Расшифровка...',
  me_voice_transcript_empty: 'Слова не распознаны',

  me_chat_members_count: {
    one: '{count} участник',
    few: '{count} участника',
    many: '{count} участников'
  },
  me_group_members_count: {
    one: '{count} подписчик',
    few: '{count} подписчика',
    many: '{count} подписчиков'
  },

  me_convo_typing_text: {
    one: 'печатает',
    few: 'печатают',
    many: 'печатают'
  },
  me_convo_typing_voice: {
    one: 'записывает аудио',
    few: 'записывают аудио',
    many: 'записывают аудио'
  },
  me_convo_typing_photo: {
    one: 'отправляет фото',
    few: 'отправляют фото',
    many: 'отправляют фото'
  },
  me_convo_typing_video: {
    one: 'отправляет видео',
    few: 'отправляют видео',
    many: 'отправляют видео'
  },
  me_convo_typing_file: {
    one: 'отправляет файл',
    few: 'отправляют файл',
    many: 'отправляют файл'
  },
  me_convo_typing_videomessage: {
    one: 'записывает видеосообщение',
    few: 'записывают видеосообщение',
    many: 'записывают видеосообщение'
  },
  me_convo_typing_names_separator: ', ',
  me_convo_typing_last_name_separator: ' и ',
  me_convo_typing_rest_count: 'еще {count}',

  // region service messages
  me_service_chat_create: {
    male: '{author} создал чат «{title}»',
    female: '{author} создала чат «{title}»'
  },
  me_service_chat_title_update: {
    male: '{author} изменил название чата с «{oldTitle}» на «{title}»',
    female: '{author} изменила название чата с «{oldTitle}» на «{title}»'
  },
  me_service_chat_photo_update: {
    male: '{author} обновил фотографию чата',
    female: '{author} обновила фотографию чата'
  },
  me_service_chat_photo_remove: {
    male: '{author} удалил фотографию чата',
    female: '{author} удалила фотографию чата'
  },
  me_service_chat_kick_don: 'Вы исключены из чата, так как перестали поддерживать сообщество через VK Donut',
  me_service_call_transcription_failed: 'Не удалось создать расшифровку звонка',
  me_service_chat_invite_user_by_link: {
    male: '{author} присоединился к чату по ссылке',
    female: '{author} присоединилась к чату по ссылке'
  },
  me_service_chat_screenshot: {
    male: '{author} сделал скриншот чата',
    female: '{author} сделала скриншот чата'
  },
  me_service_chat_group_call_started: {
    male: '{author} начал групповой звонок',
    female: '{author} начала групповой звонок'
  },
  me_service_chat_invite_user_by_call_join_link: {
    male: '{author} присоединился к звонку по ссылке',
    female: '{author} присоединилась к звонку по ссылке'
  },
  me_service_chat_invite_user: {
    male: '{author} пригласил {target}',
    female: '{author} пригласила {target}'
  },
  me_service_chat_invite_user_self: {
    male: '{author} вернулся в чат',
    female: '{author} вернулась в чат'
  },
  me_service_chat_kick_user: {
    male: '{author} исключил {target}',
    female: '{author} исключила {target}'
  },
  me_service_chat_kick_user_self: {
    male: '{author} вышел из чата',
    female: '{author} вышла из чата'
  },
  me_service_accepted_message_request: 'Это {target} из вашего списка контактов',
  me_service_chat_invite_user_by_message_request: {
    male: '{author} пригласил {target} в чат',
    female: '{author} пригласила {target} в чат'
  },
  me_service_chat_invite_user_by_call: {
    male: '{author} пригласил {target} в звонок',
    female: '{author} пригласила {target} в звонок'
  },
  me_service_chat_kick_user_call_block: {
    male: '{target} исключён из чата',
    female: '{target} исключена из чата'
  },
  me_service_chat_pin_message: {
    male: '{author} закрепил сообщение «{message}»',
    female: '{author} закрепила сообщение «{message}»'
  },
  me_service_chat_unpin_message: {
    male: '{author} открепил сообщение «{message}»',
    female: '{author} открепила сообщение «{message}»'
  },
  me_service_conversation_style_update: {
    male: '{author} изменил оформление чата на «{style}»',
    female: '{author} изменила оформление чата на «{style}»'
  },
  me_service_conversation_style_reset: {
    male: '{author} сбросил оформление чата',
    female: '{author} сбросила оформление чата'
  },
  // endregion

  // region message attaches
  me_message_attach_photo: {
    single: 'Фотография',
    one: '{0} фотография',
    few: '{0} фотографии',
    many: '{0} фотографий'
  },
  me_message_attach_audio: {
    single: 'Аудиозапись',
    one: '{0} аудиозапись',
    few: '{0} аудиозаписи',
    many: '{0} аудиозаписей'
  },
  me_message_attach_video: {
    single: 'Видео',
    one: '{0} видео',
    few: '{0} видео',
    many: '{0} видео'
  },
  me_message_attach_doc: {
    single: 'Файл',
    one: '{0} файл',
    few: '{0} файла',
    many: '{0} файлов'
  },
  me_message_attach_link: {
    single: 'Ссылка',
    one: '{0} ссылка',
    few: '{0} ссылки',
    many: '{0} ссылок'
  },
  me_message_attach_gift: 'Подарок',
  me_message_attach_sticker: 'Стикер',
  me_message_attach_ugc_sticker: 'Стикер',
  me_message_attach_wall: 'Запись',
  me_message_attach_wall_reply: 'Комментарий',
  me_message_attach_event: 'Мероприятие',
  me_message_attach_voice: 'Аудиосообщение',
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
  me_message_attach_story_reaction: 'Реакция на историю',
  // endregion

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

  modal_cancel_label: 'Отмена',
  modal_close_label: 'Закрыть',
  modal_send_label: 'Отправить',
  modal_delete_label: 'Удалить',

  captchaModal_title: 'Введите капчу',
  captchaModal_enter_code: 'Введите код',

  initErrorModal_title: 'Ошибка инициализации',
  initErrorModal_text: 'Не удалось загрузить начальные данные для старта приложения',
  initErrorModal_retry: 'Повторить попытку',

  engineFailModal_title: 'Ошибка движка',
  engineFailModal_reload: 'Перезагрузить',
  engineFailModal_description_retrieve_key: 'Произошла ошибка при обновлении ключа.',
  engineFailModal_description_resync: 'Произошла ошибка во время синхронизации.',
  engineFailModal_description_invalidate_cache: 'При синхронизации пришел запрос на сброс кеша.',
  engineFailModal_description_other: 'Произошла ошибка в работе движка.',
  engineFailModal_reload_note: 'Чтобы получать новые сообщения в реальном времени нужно перезагрузить приложение',

  confirmAccountDelete_title: 'Удаление аккаунта',
  confirmAccountDelete_confirm: 'Вы действительно хотите удалить аккаунт {userName}?',

  settings_title: 'Настройки',
  settings_theme_description: 'Тема:',
  settings_theme_system: 'Системная',
  settings_theme_light: 'Светлая',
  settings_theme_dark: 'Темная',
  settings_alwaysOnTop_description: 'Показывать окно поверх остальных окон',
  settings_useCustomTitlebar_description: 'Отключить рамку окна и заменить заголовок окна',

  settings_changeWindowSetting_title: 'Изменение настройки окна',
  settings_changeWindowSetting_description: 'Изменение вступит в силу после перезагрузки приложения',

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
