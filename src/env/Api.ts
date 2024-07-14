import * as IApi from 'env/IApi'
import { Methods } from 'model/api-types'
import { useSettingsStore } from 'store/settings'
import { useViewerStore } from 'store/viewer'
import { useGlobalModal } from 'hooks'
import { isNonEmptyArray, random, sleep, toUrlParams } from 'misc/utils'
import { appUserAgent } from 'misc/constants'
import { Semaphore } from 'misc/Semaphore'

export const API_VERSION = '5.200'

const API_DEFAULT_FETCH_TIMEOUT = 10000
const API_MIN_RETRY_DELAY = 500
const API_RATE_LIMIT_WINDOW = 1000

export class Api implements IApi.Api {
  private semaphore = new Semaphore(3, API_RATE_LIMIT_WINDOW)

  public async fetch<Method extends keyof Methods>(
    method: Method,
    params: IApi.MethodParams<Method>,
    fetchOptions: IApi.FetchOptions = {}
  ): Promise<Methods[Method]['response']> {
    const { retries = 0 } = fetchOptions
    let takenAttempts = 0

    while (true) {
      takenAttempts++

      try {
        return await this.doFetch(method, params, fetchOptions)
      } catch (err) {
        if (!this.isApiError(err)) {
          throw err
        }

        let skipBackoff = false

        switch (err.type) {
          case 'FetchError':
            // Никак дополнительно не обрабатываем ошибку сети
            break

          case 'MethodError':
          case 'ExecuteError': {
            const { resetAttempts, needSkipBackoff } = await this.handleErrors(err, params)

            if (resetAttempts) {
              takenAttempts = 0
            }
            if (needSkipBackoff) {
              skipBackoff = true
            }
            break
          }
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
    const methodsCalls = methods.map((methodInfo) => {
      if (!methodInfo) {
        return 'null'
      }

      const [method, params] = methodInfo
      return `API.${method}(${JSON.stringify(params)})`
    })

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

  public isApiError(error: unknown): error is IApi.Error {
    return (
      !!error &&
      typeof error === 'object' &&
      'type' in error &&
      typeof error.type === 'string' &&
      ['FetchError', 'MethodError', 'ExecuteError'].includes(error.type)
    )
  }

  private async handleErrors<Method extends keyof Methods>(
    apiError: IApi.MethodError | IApi.ExecuteError,
    params: IApi.MethodParams<Method> = {}
  ): Promise<{ resetAttempts: boolean, needSkipBackoff: boolean }> {
    const error = apiError.type === 'MethodError' ? apiError : apiError.errors[0]

    switch (error.code) {
      // TODO: 5 (Сессия завершена)
      // TODO: 9 (Слишком много однотипных действий)
      // TODO: 10 (Internal server error)
      // TODO: 29 (Rate limit reached, может означать "метод отключен из-за сильной нагрузки")
      // TODO: 43 (раздел отключен, когда вк упал)

      // Слишком много запросов в секунду
      case 6: {
        await sleep(API_RATE_LIMIT_WINDOW)
        return { resetAttempts: true, needSkipBackoff: true }
      }

      // Капча
      case 14: {
        const isResponded = await new Promise<boolean>((resolve) => {
          if (!error.captchaSid || !error.captchaImg) {
            resolve(false)
            return
          }

          const { captchaModal } = useGlobalModal()

          captchaModal.open({
            captchaImg: error.captchaImg,
            onClose(captchaKey) {
              if (captchaKey) {
                params.captcha_sid = error.captchaSid
                params.captcha_key = captchaKey
              }

              resolve(!!captchaKey)
            }
          })
        })

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

    try {
      const abortController = new AbortController()
      const abortTimeoutId = window.setTimeout(
        () => abortController.abort(),
        fetchOptions.timeout ?? API_DEFAULT_FETCH_TIMEOUT
      )

      const fullParams: IApi.MethodParams<Method> = {
        access_token: fetchOptions.messengerToken ? viewer?.messengerToken : viewer?.accessToken,
        v: API_VERSION,
        lang,
        ...params
      }

      const result = await fetch(`https://api.vk.com/method/${method}`, {
        method: 'POST',
        body: toUrlParams(fullParams),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-User-Agent': appUserAgent,
          ...fetchOptions.headers
        },
        signal: abortController.signal
      }).then<IApi.Result<Methods[Method]['response']>>((response) => {
        window.clearTimeout(abortTimeoutId)

        if (!response.ok) {
          return Promise.reject({
            type: 'FetchError',
            kind: 'ServerError',
            payload: response.status
          })
        }

        return response.json()
      })

      if ('error' in result) {
        const error: IApi.MethodError = {
          type: 'MethodError',
          code: result.error.error_code,
          message: result.error.error_msg,
          ...(result.error.captcha_sid && result.error.captcha_img && {
            captchaSid: result.error.captcha_sid,
            captchaImg: result.error.captcha_img
          }),
          requestParams: result.error.request_params
        }
        return Promise.reject(error)
      }

      if ('execute_errors' in result) {
        const errors = result.execute_errors.map((error) => ({
          method: error.method,
          code: error.error_code,
          message: error.error_msg,
          ...(error.captcha_sid && error.captcha_img && {
            captchaSid: error.captcha_sid,
            captchaImg: error.captcha_img
          })
        }))

        if (!isNonEmptyArray(errors)) {
          const error: IApi.FetchError = {
            type: 'FetchError',
            kind: 'ServerError',
            payload: 'empty execute_errors'
          }
          return Promise.reject(error)
        }

        const error: IApi.ExecuteError = {
          type: 'ExecuteError',
          errors
        }
        return Promise.reject(error)
      }

      return result.response
    } catch (error) {
      console.warn(error)

      const networkError: IApi.FetchError = {
        type: 'FetchError',
        kind: 'NetworkError',
        payload: error
      }
      return Promise.reject(networkError)
    } finally {
      this.semaphore.release()
    }
  }
}
