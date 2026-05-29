export interface MessagesCounters {
  /** Количество непрочитанных чатов */
  messages?: number
  /** Количество непрочитанных незамьюченных чатов */
  messages_unread_unmuted?: number
  /** Количество чатов в архиве */
  messages_archive?: number
  /** Количество непрочитанных чатов в архиве */
  messages_archive_unread?: number
  /** Количество непрочитанных незамьюченных чатов в архиве */
  messages_archive_unread_unmuted?: number
  /** Количество чатов с упоминаниями в архиве */
  messages_archive_mentions_count?: number
  /** Счетчики у папок */
  messages_folders?: Array<{
    folder_id: number
    total_count: number
    unmuted_count: number
  }>
  /** Количество запросов на переписку */
  message_requests?: number
  /** Количество непросмотренных звонков */
  calls?: number
  /** Количество непрочитанных бизнес-уведомлений */
  business_notify?: number
  /** Количество бизнес-уведомлений */
  business_notify_all?: number
  /** Счетчики каналов */
  channels?: {
    total_count: number
    unmuted_count: number
    archived_count: number
  }
  /** Счетчики управляемых сообществ */
  groups_folder?: {
    total_count: number
  }
}
