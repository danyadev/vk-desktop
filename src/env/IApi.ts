import { CommonParams, Methods } from 'model/api-types'
import { NonEmptyArray, Truthy } from 'misc/utils'

export type Result<T> =
  | { response: T }
  | { error: ResultError }
  | { execute_errors: ResultExecuteErrors }
type ResultError = {
  error_code: number
  error_msg: string
  captcha_sid?: string
  captcha_img?: string
  request_params: RequestParams
}
type ResultExecuteErrors = ResultExecuteError[]
type ResultExecuteError = {
  method: string
  error_code: number
  error_msg: string
  captcha_sid?: string
  captcha_img?: string
}
type RequestParams = Array<{ key: string, value: string }>

export type MethodParams<Method extends keyof Methods> = Methods[Method]['params'] & CommonParams

export type FetchManyRequestMethod<Method extends keyof Methods = keyof Methods> = [
  Method,
  MethodParams<Method>
] | false | null | undefined
export type FetchManyResponseMethod<RequestMethod extends FetchManyRequestMethod> =
  RequestMethod extends Truthy<RequestMethod>
    ? Methods[RequestMethod[0]]['response']
    : null

export type FetchOptions = {
  messengerToken?: boolean
  retries?: number
  timeout?: number
  headers?: Record<string, string>
}

export class FetchError extends Error {
  constructor(public kind: 'ServerError' | 'NetworkError', public reason: unknown) {
    super(`[API] Fetch error: ${kind}`, { cause: reason })
  }
}

export class MethodError extends Error {
  public code: number

  constructor(public method: string, public apiError: ResultError) {
    super(`[API] ${method} error: ${apiError.error_code} ${apiError.error_msg}`)
    this.code = apiError.error_code
  }
}

export class ExecuteError extends Error {
  constructor(public errors: NonEmptyArray<ResultExecuteError>) {
    const methodsList = errors.map(({ method }) => method).join(', ')
    super(`[API] Execute error with methods: ${methodsList}`)
  }
}

export interface Api {
  fetch<Method extends keyof Methods>(
    method: Method,
    params: MethodParams<Method>,
    fetchOptions?: FetchOptions
  ): Promise<Methods[Method]['response']>

  fetchMany<CurrentMethodsList extends FetchManyRequestMethod[]>(
    methods: [...CurrentMethodsList],
    fetchOptions?: FetchOptions
  ): Promise<{
    [Index in keyof CurrentMethodsList]: FetchManyResponseMethod<CurrentMethodsList[Index]>
  }>

  fetchParallel<CurrentMethodsList extends FetchManyRequestMethod[]>(
    methods: [...CurrentMethodsList],
    fetchOptions?: FetchOptions
  ): Promise<{
    [Index in keyof CurrentMethodsList]: FetchManyResponseMethod<CurrentMethodsList[Index]>
  }>

  buildMethod<Method extends keyof Methods>(
    method: Method,
    params?: MethodParams<Method>
  ): [Method, MethodParams<Method>]
}
