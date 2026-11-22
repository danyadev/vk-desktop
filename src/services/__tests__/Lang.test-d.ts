import type { Lang } from 'services/contracts/ILang'
import type { JSXElement } from 'misc/utils'

declare const lang: Lang
// eslint-disable-next-line @typescript-eslint/no-restricted-types
declare const node: JSX.Element
declare const assertString: (value: string) => void
declare const assertJSX: (value: JSXElement) => void

// Plain strings: keys with and without variables
assertString(lang.use('date_today'))
assertString(lang.use('date_today_at_time', { time: '12:00' }))
assertString(lang.use('date_today_at_time', { time: 12 }))
assertString(lang.use('date_at_time_with_year', {
  date: '22 ноября',
  year: 2026,
  time: '23:00'
}))

// @ts-expect-error Unknown translation key
lang.use('not_a_translation')
// @ts-expect-error The required variables cannot be omitted
lang.use('date_today_at_time')
// @ts-expect-error Plain translations do not accept variables
lang.use('date_today', {})
// @ts-expect-error A required variable is missing
lang.use('date_today_at_time', {})
// @ts-expect-error All named variables must be supplied
lang.use('date_at_time_with_year', { date: '22 ноября', time: '23:00' })
// @ts-expect-error Extra interpolation variable
lang.use('date_today_at_time', { time: '23:00', extra: 'x' })
// @ts-expect-error Wrong interpolation variable type
lang.use('date_today_at_time', { time: true })
// @ts-expect-error Plain string interpolation cannot accept a Vue node
lang.use('date_today_at_time', { time: node })
// @ts-expect-error Extra positional argument
lang.use('date_today', undefined, undefined)
// @ts-expect-error A plural object must be read with usePlural or useRaw
lang.use('me_messages_count', { count: 2 })
// @ts-expect-error A gender object must be read with useGender or useRaw
lang.use('me_service_chat_create', { author: 'Anna', title: 'Chat' })
// @ts-expect-error Arbitrary translation objects must be read with useRaw
lang.use('me_convo_styles')

// JSX strings: same key/variable restrictions, but JSX-capable values.
assertJSX(lang.useJSX('date_today'))
assertJSX(lang.useJSX('date_today_at_time', { time: node }))
assertJSX(lang.useJSX('date_today_at_time', { time: '23:00' }))
assertJSX(lang.useJSX('date_today_at_time', { time: 23 }))
assertJSX(lang.useJSX('date_today_at_time', { time: null }))
assertJSX(lang.useJSX('date_today_at_time', { time: false }))

// @ts-expect-error Unknown translation key
lang.useJSX('not_a_translation')
// @ts-expect-error Required JSX interpolation is missing
lang.useJSX('date_today_at_time')
// @ts-expect-error Plain translations do not accept variables
lang.useJSX('date_today', {})
// @ts-expect-error Missing JSX interpolation variable
lang.useJSX('date_today_at_time', {})
// @ts-expect-error Extra JSX interpolation variable
lang.useJSX('date_today_at_time', { time: node, extra: node })
// @ts-expect-error An arbitrary object is not a JSX element
lang.useJSX('date_today_at_time', { time: {} })
// @ts-expect-error useJSX must not accept plural dictionaries
lang.useJSX('me_messages_count')
// @ts-expect-error useJSX must not accept gender dictionaries with variables
lang.useJSX('me_service_chat_create', { author: node, title: node })
// @ts-expect-error useJSX must not accept arbitrary objects
lang.useJSX('me_convo_styles')

// Plurals: {0} is implicit and does not require named variables.
assertString(lang.usePlural('me_messages_count', 0))
assertString(lang.usePlural('me_messages_count', 1))
assertString(lang.usePlural('me_messages_count', 5))
assertString(lang.usePlural('me_messages_preview', 1)) // Has a `single` form
assertString(lang.usePlural('me_chat_members_count', 3, { count: 3 }))

// @ts-expect-error Unknown translation key
lang.usePlural('not_a_translation', 1)
// @ts-expect-error Plain string is not a plural dictionary
lang.usePlural('date_today', 1)
// @ts-expect-error Gender dictionary is not a plural dictionary
lang.usePlural('me_service_chat_create', 1)
// @ts-expect-error Arbitrary object is not a plural dictionary
lang.usePlural('me_convo_styles', 1)
// @ts-expect-error Number argument is mandatory
lang.usePlural('me_messages_count')
// @ts-expect-error Number argument has the wrong type
lang.usePlural('me_messages_count', '2')
// @ts-expect-error The {0} placeholder must not be passed explicitly
lang.usePlural('me_messages_count', 2, { 0: 2 })
// @ts-expect-error Named interpolation variables are required
lang.usePlural('me_chat_members_count', 3)
// @ts-expect-error Missing named interpolation variable
lang.usePlural('me_chat_members_count', 3, {})
// @ts-expect-error Extra named interpolation variable
lang.usePlural('me_chat_members_count', 3, { count: 3, extra: 'x' })
// @ts-expect-error Invalid interpolation variable type
lang.usePlural('me_chat_members_count', 3, { count: true })
// @ts-expect-error String plurals cannot interpolate Vue nodes
lang.usePlural('me_chat_members_count', 3, { count: node })

// JSX plurals: numeric selection, optional `single`, named JSX variables.
assertJSX(lang.usePluralJSX('me_messages_count', 0))
assertJSX(lang.usePluralJSX('me_messages_preview', 1))
assertJSX(lang.usePluralJSX('me_chat_members_count', 3, { count: node }))
assertJSX(lang.usePluralJSX('me_chat_members_count', 3, { count: 3 }))
assertJSX(lang.usePluralJSX('me_chat_members_count', 3, { count: null }))

// @ts-expect-error Plain string is not a plural dictionary
lang.usePluralJSX('date_today', 1)
// @ts-expect-error Gender dictionary is not a plural dictionary
lang.usePluralJSX('me_service_chat_create', 1)
// @ts-expect-error Arbitrary object is not a plural dictionary
lang.usePluralJSX('me_convo_styles', 1)
// @ts-expect-error Number argument is mandatory
lang.usePluralJSX('me_messages_count')
// @ts-expect-error Named interpolation variables are required
lang.usePluralJSX('me_chat_members_count', 3)
// @ts-expect-error Extra interpolation variable
lang.usePluralJSX('me_chat_members_count', 3, { count: node, extra: node })
// @ts-expect-error A generic object cannot be interpolated as JSX
lang.usePluralJSX('me_chat_members_count', 3, { count: {} })
// @ts-expect-error {0} remains implicit in JSX plurals
lang.usePluralJSX('me_messages_count', 2, { 0: node })

// Gendered strings: unknown falls back to male, but `you` must be defined.
assertString(lang.useGender('me_user_was_online_recently', 'male'))
assertString(lang.useGender('me_user_was_online_recently', 'female'))
assertString(lang.useGender('me_user_was_online_recently', 'unknown'))
assertString(lang.useGender('me_user_was_online_at', 'female', { time: '23:00' }))
assertString(lang.useGender('me_service_chat_create', 'you', {
  author: 'Anna',
  title: 'Chat'
}))
assertString(lang.useGender('me_service_chat_without_owner_all', 'you', {
  author: 'Anna'
}))

// @ts-expect-error Unknown translation key
lang.useGender('not_a_translation', 'male')
// @ts-expect-error Plain string is not a gender dictionary
lang.useGender('date_today', 'male')
// @ts-expect-error Plural dictionary is not a gender dictionary
lang.useGender('me_messages_count', 'male')
// @ts-expect-error Arbitrary object is not a gender dictionary
lang.useGender('me_convo_styles', 'male')
// @ts-expect-error Gender argument is mandatory
lang.useGender('me_user_was_online_recently')
// @ts-expect-error Unsupported gender
lang.useGender('me_user_was_online_recently', 'other')
// @ts-expect-error `you` is only valid when the entry defines it
lang.useGender('me_user_was_online_recently', 'you')
// @ts-expect-error `you` is not defined for this interpolated translation
lang.useGender('me_user_was_online_at', 'you', { time: '23:00' })
// @ts-expect-error Unexpected variables for a translation without placeholders
lang.useGender('me_user_was_online_recently', 'male', {})
// @ts-expect-error Required interpolation variables are missing
lang.useGender('me_service_chat_create', 'male')
// @ts-expect-error One required variable is missing
lang.useGender('me_service_chat_create', 'male', { author: 'Anna' })
// @ts-expect-error Extra interpolation variable
lang.useGender('me_service_chat_create', 'male', { author: 'Anna', title: 'Chat', extra: 2 })
// @ts-expect-error Invalid string interpolation variable type
lang.useGender('me_user_was_online_at', 'male', { time: node })

// Gendered JSX: same key/gender checking, with JSX interpolation values.
assertJSX(lang.useGenderJSX('me_user_was_online_recently', 'unknown'))
assertJSX(lang.useGenderJSX('me_user_was_online_at', 'female', { time: node }))
assertJSX(lang.useGenderJSX('me_service_chat_create', 'you', {
  author: node,
  title: 'Chat'
}))
assertJSX(lang.useGenderJSX('me_service_chat_without_owner_all', 'you', {
  author: node
}))

// @ts-expect-error Plain strings are not gender dictionaries
lang.useGenderJSX('date_today', 'male')
// @ts-expect-error Plural dictionaries are not gender dictionaries
lang.useGenderJSX('me_messages_count', 'male')
// @ts-expect-error Arbitrary objects are not gender dictionaries
lang.useGenderJSX('me_convo_styles', 'male')
// @ts-expect-error Missing interpolation variables
lang.useGenderJSX('me_service_chat_create', 'female')
// @ts-expect-error Extra JSX variable
lang.useGenderJSX('me_service_chat_create', 'female', { author: node, title: node, extra: node })
// @ts-expect-error Unsupported `you` form
lang.useGenderJSX('me_user_was_online_recently', 'you')
// @ts-expect-error Unsupported `you` form on a translation with variables
lang.useGenderJSX('me_user_was_online_at', 'you', { time: node })
// @ts-expect-error Arbitrary object cannot be interpolated as JSX
lang.useGenderJSX('me_service_chat_create', 'male', { author: {}, title: node })

// Raw access: unlike other methods, supports strings and all object shapes.
const rawText: 'сегодня' = lang.useRaw('date_today')
const rawPlural = lang.useRaw('me_messages_count')
const rawGender = lang.useRaw('me_service_chat_create')
const rawObject = lang.useRaw('me_convo_styles')

assertString(rawText)
assertString(rawPlural.one)
assertString(rawGender.male)
assertString(rawGender.you)
assertString(rawObject.default)

// @ts-expect-error Raw access still requires a known dictionary key
lang.useRaw('not_a_translation')
// @ts-expect-error Raw access does not take interpolation variables
lang.useRaw('date_today_at_time', { time: '23:00' })
// @ts-expect-error No `you` variant exists in this dictionary entry
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
lang.useRaw('me_user_was_online_recently').you
// @ts-expect-error A raw object is not a string
assertString(lang.useRaw('me_convo_styles'))
