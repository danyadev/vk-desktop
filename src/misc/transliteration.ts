type Rule = readonly [from: string, to: string]

const parseRules = (s: string): Rule[] => (
  s.trim().split(/\s+/).map(pair => pair.split(':') as [string, string])
)

export const RULES_EN_RU = parseRules(`
  a:а b:б c:к ch:ч d:д e:е ei:ей ey:ей f:ф g:г h:х
  i:и ia:ия iy:ий j:й jo:ё ju:ю ja:я k:к kh:х l:л m:м
  n:н o:о p:п q:к r:р s:с sh:ш shch:щ sch:щ t:т ts:ц
  u:у v:в w:в x:кс y:и yo:ё yu:ю ya:я z:з zh:ж
`)

export const RULES_RU_EN = parseRules(`
  а:a б:b в:v г:g д:d е:e ё:yo ж:zh з:z и:i ий:y ия:ia
  й:y к:k кс:x л:l м:m н:n о:o п:p р:r с:s т:t у:u ф:f
  х:kh ц:ts ч:ch ш:sh щ:shch ъ: ы:y ь: э:e ю:yu я:ya
`)

export function translitPrefixes(word: string, rules: Rule[]): string[] {
  const result = new Set<string>()
  let pos = 0
  let prefix = ''

  while (pos < word.length) {
    const char = String.fromCodePoint(word.codePointAt(pos)!)
    const candidates = rules.filter(([from]) => from.startsWith(char))

    // Characters absent from this directional table pass through
    if (!candidates.length) candidates.push([char, char])

    let nextPos = pos + char.length
    let nextPrefix = prefix

    for (const [from, to] of candidates) {
      // Reject leading ь/ъ in the RU→EN conversion
      if (pos === 0 && to === '') return [...result]

      const remaining = word.slice(pos, pos + from.length)
      if (!from.startsWith(remaining)) continue

      nextPos = pos + remaining.length
      nextPrefix = prefix + to

      // Includes unfinished final sequences: "sh" can complete "shch"
      if (nextPos === word.length) result.add(nextPrefix)
    }

    pos = nextPos
    prefix = nextPrefix
  }

  return [...result]
}
