import { Methods } from 'services/contracts/api'
import * as IApi from 'services/contracts/IApi'
import { useSettingsStore } from 'store/settings'
import { logout, useViewerStore } from 'store/viewer'
import { useGlobalModal } from 'hooks'
import { isNonEmptyArray, random, sleep, toUrlParams } from 'misc/utils'
import { appUserAgent } from 'misc/constants'
import { Semaphore } from 'misc/Semaphore'

const API_DEFAULT_FETCH_TIMEOUT = 20000
const API_MIN_RETRY_DELAY = 500
const API_RATE_LIMIT_WINDOW = 1000

const METHODS_TO_BE_FETCHED_WITH_OFFICIAL_TOKEN: Array<keyof Methods> = [
  'messages.getConversations',
  'messages.getDiffContent',
  'messages.getDiff'
]

export class Api implements IApi.Api {
  // TODO: сделать Map<AccessToken, Semaphore>
  private semaphore = new Semaphore(3, API_RATE_LIMIT_WINDOW)
  private globalErrorHandler?: Promise<unknown>

  constructor(private refreshMessengerToken: (exchangeToken: string) => Promise<string>) {}

  public async fetch<Method extends keyof Methods>(
    method: Method,
    params: IApi.MethodParams<Method>,
    fetchOptions: IApi.FetchOptions = {}
  ): Promise<Methods[Method]['response']> {
    const { retries = 0 } = fetchOptions
    let takenAttempts = 0

    fetchOptions.messengerToken ??= METHODS_TO_BE_FETCHED_WITH_OFFICIAL_TOKEN.includes(method)

    while (true) {
      takenAttempts++

      try {
        return await this.doFetch(method, params, fetchOptions)
      } catch (err) {
        let skipBackoff = false

        switch (true) {
          case err instanceof IApi.FetchError:
            // Никак дополнительно не обрабатываем ошибку сети
            break

          case err instanceof IApi.MethodError:
          case err instanceof IApi.ExecuteError: {
            const {
              resetAttempts,
              needSkipBackoff
            } = await this.handleErrors(err, params, fetchOptions)

            if (resetAttempts) {
              takenAttempts = 0
            }
            if (needSkipBackoff) {
              skipBackoff = true
            }
            break
          }

          default:
            throw err
        }

        if (takenAttempts === retries + 1) {
          throw err
        }

        if (!skipBackoff) {
          // https://aws.amazon.com/ru/blogs/architecture/exponential-backoff-and-jitter
          const exponentialBackoff = API_MIN_RETRY_DELAY * (2 ** Math.min(takenAttempts - 1, 5))
          const equalJitterBackoff = (exponentialBackoff / 2) + random(0, exponentialBackoff / 2)
          await sleep(equalJitterBackoff)
        }
      }
    }
  }

  /**
   * Последовательно с помощью execute выполняет переданные методы
   *
   * Использование:
   * ```ts
   * const [users, groups] = await api.fetchMany([
   *   api.buildMethod('users.get', { user_ids: 1 }),
   *   groupId !== 0 && api.buildMethod('groups.get', { group_ids: groupId })
   * ])
   * ```
   */
  public fetchMany<CurrentMethodsList extends IApi.FetchManyRequestMethod[]>(
    methods: [...CurrentMethodsList],
    fetchOptions: IApi.FetchOptions = {}
  ): Promise<{
    [Index in keyof CurrentMethodsList]: IApi.FetchManyResponseMethod<CurrentMethodsList[Index]>
  }> {
    if (!methods.some(Boolean)) {
      return Promise.resolve(methods.map(() => null)) as Promise<never>
    }

    const methodsCalls = methods.map((methodInfo) => {
      if (!methodInfo) {
        return 'null'
      }

      const [method, params] = methodInfo
      return `API.${method}(${JSON.stringify(params)})`
    })

    fetchOptions.messengerToken ??= methods.some((method) => (
      method && METHODS_TO_BE_FETCHED_WITH_OFFICIAL_TOKEN.includes(method[0])
    ))

    return this.fetch('execute', {
      code: [
        'return [',
        methodsCalls.join(',\n'),
        '];'
      ].join('\n')
    }, fetchOptions) as Promise<never>
  }

  /**
   * Параллельно с помощью execute выполняет переданные методы
   *
   * Использование:
   * ```ts
   * const [users, groups] = await api.fetchParallel([
   *   api.buildMethod('users.get', { user_ids: 1 }),
   *   groupId !== 0 && api.buildMethod('groups.get', { group_ids: groupId })
   * ])
   * ```
   */
  public fetchParallel<CurrentMethodsList extends IApi.FetchManyRequestMethod[]>(
    methods: [...CurrentMethodsList],
    fetchOptions: IApi.FetchOptions = {}
  ): Promise<{
    [Index in keyof CurrentMethodsList]: IApi.FetchManyResponseMethod<CurrentMethodsList[Index]>
  }> {
    if (!methods.some(Boolean)) {
      return Promise.resolve(methods.map(() => null)) as Promise<never>
    }

    const forkDeclarations = methods.map((methodInfo, index) => {
      if (!methodInfo) {
        return ''
      }

      const [method, params] = methodInfo
      return `var m${index} = fork(API.${method}(${JSON.stringify(params)}));`
    })
    const waitExpressions = methods.map((methodInfo, index) => {
      return methodInfo ? `wait(m${index})` : 'null'
    })

    fetchOptions.messengerToken ??= methods.some((method) => (
      method && METHODS_TO_BE_FETCHED_WITH_OFFICIAL_TOKEN.includes(method[0])
    ))

    return this.fetch('execute', {
      code: [
        forkDeclarations.join('\n'),
        'return [',
        waitExpressions.join(',\n'),
        '];'
      ].join('\n')
    }, fetchOptions) as Promise<never>
  }

  public buildMethod<Method extends keyof Methods>(
    method: Method,
    params: IApi.MethodParams<Method> = {}
  ): [Method, IApi.MethodParams<Method>] {
    return [method, params]
  }

  private async handleErrors<Method extends keyof Methods>(
    apiError: IApi.MethodError | IApi.ExecuteError,
    params: IApi.MethodParams<Method>,
    fetchOptions: IApi.FetchOptions
  ): Promise<{ resetAttempts: boolean, needSkipBackoff: boolean }> {
    if (this.globalErrorHandler) {
      try {
        await this.globalErrorHandler
        return { resetAttempts: true, needSkipBackoff: true }
      } catch {
        throw apiError
      }
    }

    const error = apiError instanceof IApi.MethodError ? apiError.apiError : apiError.errors[0]

    switch (error.error_code) {
      // TODO: 9 (Слишком много однотипных действий)
      // TODO: 10 (Internal server error)
      // TODO: 29 (Rate limit reached, может означать "метод отключен из-за сильной нагрузки")
      // TODO: 43 (раздел отключен, когда вк упал)

      // Сессия завершена или токен истек
      case 5: {
        const { viewer } = useViewerStore()
        if (!viewer || params.access_token) {
          throw apiError
        }

        if (!fetchOptions.messengerToken) {
          logout()
          throw apiError
        }

        const refreshTokenPromise = this.refreshMessengerToken(viewer.messengerExchangeToken)
        this.globalErrorHandler = refreshTokenPromise

        try {
          viewer.messengerToken = await refreshTokenPromise
          return { resetAttempts: true, needSkipBackoff: true }
        } catch {
          logout()
          throw apiError
        } finally {
          this.globalErrorHandler = undefined
        }
      }

      // Слишком много запросов в секунду
      case 6: {
        await sleep(API_RATE_LIMIT_WINDOW)
        return { resetAttempts: true, needSkipBackoff: true }
      }

      // Капча
      case 14: {
        const captchaPromise = new Promise<boolean>((resolve) => {
          if (!error.captcha_img || !error.captcha_sid) {
            resolve(false)
            return
          }

          const { captchaModal } = useGlobalModal()

          captchaModal.open({
            captchaImg: error.captcha_img,
            onClose(captchaKey) {
              if (captchaKey) {
                params.captcha_sid = error.captcha_sid
                params.captcha_key = captchaKey
              }

              resolve(!!captchaKey)
            }
          })
        })

        this.globalErrorHandler = new Promise<void>((resolve, reject) => {
          captchaPromise.then((isResponded) => {
            if (isResponded) {
              resolve()
            } else {
              reject()
            }
          })
        })

        const isResponded = await captchaPromise
        this.globalErrorHandler = undefined

        if (!isResponded) {
          throw apiError
        }

        return { resetAttempts: true, needSkipBackoff: true }
      }

      default:
        throw apiError
    }
  }

  private async doFetch<Method extends keyof Methods>(
    method: Method,
    params: IApi.MethodParams<Method> = {},
    fetchOptions: IApi.FetchOptions = {}
  ): Promise<Methods[Method]['response']> {
    await this.semaphore.lock()

    const { lang } = useSettingsStore()
    const { viewer } = useViewerStore()

    const abortController = new AbortController()
    const abortTimeoutId = window.setTimeout(
      () => abortController.abort('timeout'),
      fetchOptions.timeout ?? API_DEFAULT_FETCH_TIMEOUT
    )

    const abortBySignal = () => abortController.abort(fetchOptions.signal?.reason)
    fetchOptions.signal?.addEventListener('abort', abortBySignal, { once: true })

    try {
      fetchOptions.signal?.throwIfAborted()

      const fullParams: IApi.MethodParams<Method> = {
        access_token: fetchOptions.messengerToken ? viewer?.messengerToken : viewer?.accessToken,
        v: IApi.VERSION,
        lang,
        ...params
      }

      const response = await fetch(`https://api.vk.com/method/${method}`, {
        method: 'POST',
        body: toUrlParams(fullParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-User-Agent': appUserAgent,
          ...fetchOptions.headers
        },
        signal: abortController.signal
      })

      if (!response.ok) {
        const errorReason = `api responded with status ${response.status}`
        return Promise.reject(new IApi.FetchError('ServerError', errorReason))
      }

      const result = await response.json() as IApi.Result<Methods[Method]['response']>

      if ('error' in result) {
        return Promise.reject(new IApi.MethodError(method, result.error))
      }

      if ('execute_errors' in result) {
        if (!isNonEmptyArray(result.execute_errors)) {
          const errorReason = 'api responded with empty execute_errors'
          return Promise.reject(new IApi.FetchError('ServerError', errorReason))
        }

        return Promise.reject(new IApi.ExecuteError(result.execute_errors))
      }

      return result.response
    } catch (error) {
      console.warn('[Api]', error)

      if (fetchOptions.signal?.aborted) {
        throw new IApi.AbortError(fetchOptions.signal.reason)
      }

      throw new IApi.FetchError('NetworkError', String(error))
    } finally {
      fetchOptions.signal?.removeEventListener('abort', abortBySignal)
      window.clearTimeout(abortTimeoutId)
      this.semaphore.release()
    }
  }
}
