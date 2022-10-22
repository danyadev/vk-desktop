import { CommonParams, Methods } from 'model/api-types'
import { timer, toUrlParams } from 'misc/utils'
import { Semaphore } from 'misc/Semaphore'
import { useSettingsStore } from 'store/settings'

/**
 * В случае повышения версии необходимо описать, какое поле понадобилось из новой версии
 */
const version = '5.131'

const API_DEFAULT_FETCH_TIMEOUT = 10 * 1000
const API_MIN_RETRY_DELAY = 1000

type FetchOptions = {
  retries?: number
  timeout?: number
}

type ApiRequestParams = Array<{ key: string, value: string }>
type ApiResultError = {
  error_code: number
  error_msg: string
  request_params: ApiRequestParams
}
type ApiResultExecuteErrors = Array<{
  method: string
  error_code: number
  error_msg: string
}>
type ApiResult<T> =
  | { response: T }
  | { error: ApiResultError }
  | { execute_errors: ApiResultExecuteErrors }

type ApiFetchError = {
  type: 'FetchError'
  kind: 'ServerError' | 'NetworkError'
}
type ApiMethodError = {
  type: 'MethodError'
  code: number
  message: string
  requestParams: ApiRequestParams
}
type ApiExecuteError = {
  type: 'ExecuteError'
  errors: Array<{ method: string, code: number, message: string }>
}
type ApiError = ApiFetchError | ApiMethodError | ApiExecuteError

function isApiError(error: unknown): error is ApiError {
  return !!error && 'type' in error
}

type MethodParams<Method extends keyof Methods> = Methods[Method]['params'] & CommonParams

export class Api {
  private semaphore = new Semaphore(3, 1000)

  async fetch<Method extends keyof Methods>(
    method: Method,
    params: MethodParams<Method> = {},
    fetchOptions: FetchOptions = {}
  ): Promise<Methods[Method]['response']> {
    const { retries = 0 } = fetchOptions
    let attempts = 0
    let availableAttempts = 1 + retries

    while (availableAttempts--) {
      attempts++

      try {
        return await this.doFetch(method, params, fetchOptions)
      } catch (err) {
        if (!isApiError(err)) {
          throw err
        }

        if (err.type === 'MethodError' || err.type === 'ExecuteError') {
          this.handleErrors(err)
        }

        if (!availableAttempts) {
          throw err
        }

        await timer(API_MIN_RETRY_DELAY * 2 ** Math.min(attempts, 4))
      }
    }
  }

  buildMethod<Method extends keyof Methods>(
    method: Method,
    params: MethodParams<Method> = {}
  ): [Method, MethodParams<Method>] {
    return [method, params]
  }

  fetchMany<
    CurrentMethodsList extends {
      readonly [Index in keyof AllMethodsList]: [
        AllMethodsList[Index],
        MethodParams<AllMethodsList[Index]>
      ]
    },
    AllMethodsList extends Array<keyof Methods>
  >(methods: CurrentMethodsList, fetchOptions: FetchOptions = {}): Promise<{
    [Index in keyof CurrentMethodsList]: Methods[CurrentMethodsList[Index][0]]['response']
  }> {
    const methodsCalls = methods.map(([method, params]) => {
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

  fetchParallel<
    CurrentMethodsList extends {
      readonly [Index in keyof AllMethodsList]: [
        AllMethodsList[Index],
        MethodParams<AllMethodsList[Index]>
      ]
    },
    AllMethodsList extends Array<keyof Methods>
  >(methods: CurrentMethodsList, fetchOptions: FetchOptions = {}): Promise<{
    [Index in keyof CurrentMethodsList]: Methods[CurrentMethodsList[Index][0]]['response']
  }> {
    const forkDeclarations = methods.map(([method, params], index) => {
      return `var m_${index} = fork(API.${method}(${JSON.stringify(params)}));`
    })
    const waitExpressions = methods.map((data, index) => {
      return `wait(m_${index})`
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

  private handleErrors(apiError: ApiMethodError | ApiExecuteError) {
    const error = apiError.type === 'MethodError' ? apiError : apiError.errors[0]

    switch (error.code) {
      // TODO: 5 (Сессия завершена)
      // TODO: 6/9 (Слишком много запросов в секунду / однотипных действий)
      // TODO: 10 (Internal server error)
      // TODO: 14 (Капча)
      default:
        throw apiError
    }
  }

  private async doFetch<Method extends keyof Methods>(
    method: Method,
    params: Methods[Method]['params'] & CommonParams = {},
    fetchOptions: FetchOptions = {}
  ): Promise<Methods[Method]['response']> {
    if (!this.semaphore.lock()) {
      return new Promise((resolve, reject) => {
        this.semaphore.addToQueue(() => {
          this.doFetch(method, params, fetchOptions)
            .then(resolve)
            .catch(reject)
        })
      })
    }

    const { lang } = useSettingsStore()

    params = {
      v: version,
      lang,
      ...params
    }

    try {
      const abortController = new AbortController()
      const abortTimeoutId = window.setTimeout(
        () => abortController.abort(),
        fetchOptions.timeout || API_DEFAULT_FETCH_TIMEOUT
      )

      const result = await fetch(`https://api.vk.com/method/${method}`, {
        method: 'POST',
        body: toUrlParams(params),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        signal: abortController.signal
      }).then<ApiResult<Methods[Method]['response']>>((res) => {
        clearTimeout(abortTimeoutId)

        if (!res.ok) {
          return Promise.reject({
            type: 'FetchError',
            kind: 'ServerError'
          })
        }

        return res.json()
      })

      if ('error' in result) {
        return Promise.reject({
          type: 'MethodError',
          code: result.error.error_code,
          message: result.error.error_msg,
          requestParams: result.error.request_params
        })
      }

      if ('execute_errors' in result) {
        return Promise.reject({
          type: 'ExecuteError',
          executeErrors: result.execute_errors
        })
      }

      return result.response
    } catch (error) {
      return Promise.reject({
        type: 'FetchError',
        kind: 'NetworkError'
      })
    } finally {
      this.semaphore.release()
    }
  }
}
