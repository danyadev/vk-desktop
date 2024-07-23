import { Dictionary } from 'env/Lang'

/**
 * Средствами тайпскрипта достаем из всех переводов использование {таких} переменных,
 * собираем для каждого перевода список переменных и указываем им определенный тип:
 * string | number, либо же JSXElement, в зависимости от потребности
 *
 * Отдельно игнорируем переменные {0}, так как они используются для plural групп переводов
 */

type ExtractVariables<Str extends string, Vars extends string[] = []> =
  Str extends `${string}{${infer Var extends string}}${infer End extends string}`
    ? ExtractVariables<End, Var extends '0' ? Vars : [...Vars, Var]>
    : Vars

type ExtractFromArrayEntry<Arr extends string[], Vars extends string[]> =
  Arr extends [infer Current extends string, ...infer Rest extends string[]]
    ? ExtractFromArrayEntry<Rest, [...Vars, ...ExtractVariables<Current>]>
    : Vars

type ExtractFromEntry<
  T extends string | ReadonlyArray<string> | Record<string, string>,
  Vars extends string[] = []
> =
  T extends string
    ? [...Vars, ...ExtractVariables<T>]
    : T extends ReadonlyArray<string>
      ? [...Vars, ...ExtractFromArrayEntry<[...T], Vars>]
      : Vars

export type VariablesTypings<Variables = string | number> = {
  [Key in keyof Dictionary as ExtractFromEntry<Dictionary[Key]> extends [] ? never : Key]: {
    [K in ExtractFromEntry<Dictionary[Key]>[number]]: Variables
  }
}
