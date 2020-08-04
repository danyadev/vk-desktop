import {
  createParser,
  hashtagParser,
  linkParser,
  brParser,
  emojiParser,
  mentionParser
} from 'js/textParser';

function trimLeft(str) {
  return str.split('\n').map((line) => line.trim()).join('\n').trim();
}

describe('createParser', () => {
  const emojiParser = createParser({
    regexp: /:(.+?):/ig,
    parseText: (value) => [{ type: 'text', value }],
    parseElement: (value, match) => [{
      type: 'emoji',
      value: match[1],
      raw: value
    }]
  });

  const MarkdownTitleParser = createParser({
    regexp: /(?<=^|\n)(#{1,6})([^#\n].+|(?=\n))/g,
    parseText: emojiParser,
    parseElement: (value, match) => [{
      type: 'title',
      value: emojiParser(match[2]),
      level: match[1].length
    }]
  });

  test('basic cases', () => {
    expect(emojiParser('')).toEqual([]);

    expect(emojiParser(':wrench: Settings')).toEqual([
      { type: 'emoji', value: 'wrench', raw: ':wrench:' },
      { type: 'text', value: ' Settings' }
    ]);

    expect(emojiParser('You can use `:wrench: Settings` section')).toEqual([
      { type: 'text', value: 'You can use `' },
      { type: 'emoji', value: 'wrench', raw: ':wrench:' },
      { type: 'text', value: ' Settings` section' }
    ]);
  });

  test('parser inside parser', () => {
    expect(MarkdownTitleParser('')).toEqual([]);

    expect(MarkdownTitleParser(':wrench: Settings')).toEqual([
      { type: 'emoji', value: 'wrench', raw: ':wrench:' },
      { type: 'text', value: ' Settings' }
    ]);

    expect(MarkdownTitleParser('You can use `:wrench: Settings` section')).toEqual([
      { type: 'text', value: 'You can use `' },
      { type: 'emoji', value: 'wrench', raw: ':wrench:' },
      { type: 'text', value: ' Settings` section' }
    ]);

    expect(
      MarkdownTitleParser(
        trimLeft(`
          # Level 1
          ## Level 2
          ###### Level 6
          ####### Not level
          ###
          ## :wrench: Settings
          # Level 1 ## Level 2
          not # title ## haha
        `)
      )
    ).toEqual([
      { type: 'title', value: [{ type: 'text', value: ' Level 1' }], level: 1 },
      { type: 'text', value: '\n' },
      { type: 'title', value: [{ type: 'text', value: ' Level 2' }], level: 2 },
      { type: 'text', value: '\n' },
      { type: 'title', value: [{ type: 'text', value: ' Level 6' }], level: 6 },
      { type: 'text', value: '\n####### Not level\n' },
      { type: 'title', value: [], level: 3 },
      { type: 'text', value: '\n' },
      {
        type: 'title',
        value: [
          { type: 'text', value: ' ' },
          { type: 'emoji', value: 'wrench', raw: ':wrench:' },
          { type: 'text', value: ' Settings' }
        ],
        level: 2
      },
      { type: 'text', value: '\n' },
      { type: 'title', value: [{ type: 'text', value: ' Level 1 ## Level 2' }], level: 1 },
      { type: 'text', value: '\nnot # title ## haha' }
    ]);
  });

  test('arguments support', () => {
    const parser = createParser({
      regexp: /test/g,
      parseText: (value, arg1, arg2) => [{ type: 'text', value, arg1, arg2 }],
      parseElement: (value, match, ...args) => [{ type: 'element', args }]
    });

    expect(parser('это не test!', 'arg1', 'arg2')).toEqual([
      { type: 'text', value: 'это не ', arg1: 'arg1', arg2: 'arg2' },
      { type: 'element', args: ['arg1', 'arg2'] },
      { type: 'text', value: '!', arg1: 'arg1', arg2: 'arg2' }
    ]);
  });
});

describe('hashtagParser', () => {
  test('basic cases', () => {
    expect(hashtagParser('')).toEqual([]);

    expect(hashtagParser('#Привёт #world #123 #___ #-12')).toEqual([
      { type: 'hashtag', value: '#Привёт' },
      { type: 'text', value: ' ' },
      { type: 'hashtag', value: '#world' },
      { type: 'text', value: ' ' },
      { type: 'hashtag', value: '#123' },
      { type: 'text', value: ' ' },
      { type: 'hashtag', value: '#___' },
      { type: 'text', value: ' #-12' }
    ]);
  });
});

describe('linkParser', () => {
  test('basic cases', () => {
    expect(
      linkParser(
        trimLeft(`
          простой текст
          #хештег_из_прошлого_парсера
          https://vk.com
          http://vk.com
          vk.com
          vk.com/
          vk.com/danyadev
          vk.com/danyadev#hash
          vk.com/feed?w=wall-32295218_492993
          vk.com/?w=wall
          vk.com?dev
          vk.com:8080
          vk.com:65536
          vk.com/danyadev?очень_длинная_ссылка_которая_должна_быть_сокращена
        `)
      )
    ).toEqual([
      { type: 'text', value: 'простой текст\n' },
      { type: 'hashtag', value: '#хештег_из_прошлого_парсера' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'https://vk.com', link: 'https://vk.com' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'http://vk.com', link: 'http://vk.com' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com', link: 'http://vk.com' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com/', link: 'http://vk.com/' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com/danyadev#hash', link: 'http://vk.com/danyadev#hash' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com/feed?w=wall-32295218_492993', link: 'http://vk.com/feed?w=wall-32295218_492993' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com/?w=wall', link: 'http://vk.com/?w=wall' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.com', link: 'http://vk.com' },
      { type: 'text', value: '?dev\n' },
      { type: 'link', value: 'vk.com:8080', link: 'http://vk.com:8080' },
      { type: 'text', value: '\n' },
      { type: 'text', value: 'vk.com:65536' },
      { type: 'text', value: '\n' },
      {
        type: 'link',
        value: 'vk.com/danyadev?очень_длинная_ссылка_которая_должна_быт..',
        link: 'http://vk.com/danyadev?очень_длинная_ссылка_которая_должна_быть_сокращена'
      }
    ]);
  });

  test('localhost and port support', () => {
    expect(
      linkParser(
        trimLeft(`
          localhost
          http://localhost
          https://localhost
          localhost/path?key=value#hash
          
          localhost:1
          localhost:8080
          localhost:65535
          localhost:65536
          
          alocalhost localhosta
        `)
      )
    ).toEqual([
      { type: 'link', value: 'localhost', link: 'http://localhost' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'http://localhost', link: 'http://localhost' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'https://localhost', link: 'https://localhost' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'localhost/path?key=value#hash', link: 'http://localhost/path?key=value#hash' },
      { type: 'text', value: '\n\n' },
      { type: 'link', value: 'localhost:1', link: 'http://localhost:1' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'localhost:8080', link: 'http://localhost:8080' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'localhost:65535', link: 'http://localhost:65535' },
      { type: 'text', value: '\n' },
      { type: 'text', value: 'localhost:65536' },
      { type: 'text', value: '\n\nalocalhost localhosta' }
    ]);
  });

  test('IP address and port support', () => {
    expect(
      linkParser(
        trimLeft(`
          0.0.0.0
          1.1.1.1
          192.168.0.1
          255.255.255.255
          255.255.256.255
          
          https://0.1.0.1
          0.1.0.1/path?key=value#hash
          
          1.1.1.1:1
          1.1.1.1:8080
          1.1.1.1:65535
          1.1.1.1:65536
        `)
      )
    ).toEqual([
      { type: 'link', value: '0.0.0.0', link: 'http://0.0.0.0' },
      { type: 'text', value: '\n' },
      { type: 'link', value: '1.1.1.1', link: 'http://1.1.1.1' },
      { type: 'text', value: '\n' },
      { type: 'link', value: '192.168.0.1', link: 'http://192.168.0.1' },
      { type: 'text', value: '\n' },
      { type: 'link', value: '255.255.255.255', link: 'http://255.255.255.255' },
      { type: 'text', value: '\n' },
      { type: 'text', value: '255.255.256.255' },
      { type: 'text', value: '\n\n' },
      { type: 'link', value: 'https://0.1.0.1', link: 'https://0.1.0.1' },
      { type: 'text', value: '\n' },
      { type: 'link', value: '0.1.0.1/path?key=value#hash', link: 'http://0.1.0.1/path?key=value#hash' },
      { type: 'text', value: '\n\n' },
      { type: 'link', value: '1.1.1.1:1', link: 'http://1.1.1.1:1' },
      { type: 'text', value: '\n' },
      { type: 'link', value: '1.1.1.1:8080', link: 'http://1.1.1.1:8080' },
      { type: 'text', value: '\n' },
      { type: 'link', value: '1.1.1.1:65535', link: 'http://1.1.1.1:65535' },
      { type: 'text', value: '\n' },
      { type: 'text', value: '1.1.1.1:65536' }
    ]);
  });

  test('only valid domains support', () => {
    expect(
      linkParser(
        trimLeft(`
          vk.com
          vk.xyz
          vk.me
          vk.su
          vk.dev
          vk.onion
          вк.рф
          вк.укр
          vk.jija
          вк.жижа
        `)
      )
    ).toEqual([
      { type: 'link', value: 'vk.com', link: 'http://vk.com' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.xyz', link: 'http://vk.xyz' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.me', link: 'http://vk.me' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.su', link: 'http://vk.su' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.dev', link: 'http://vk.dev' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'vk.onion', link: 'http://vk.onion' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'вк.рф', link: 'http://вк.рф' },
      { type: 'text', value: '\n' },
      { type: 'link', value: 'вк.укр', link: 'http://вк.укр' },
      { type: 'text', value: '\n' },
      { type: 'text', value: 'vk.jija' },
      { type: 'text', value: '\n' },
      { type: 'text', value: 'вк.жижа' }
    ]);
  });

  test('exceptions and features', () => {
    expect(
      linkParser(
        trimLeft(`
          danyadev@mail.ru

          .vk.com/danyadev.
          ,vk.com/danyadev,
          !vk.com/danyadev!
          ?vk.com/danyadev?
          (vk.com/danyadev)
          )vk.com/danyadev(
          "vk.com/danyadev"
          'vk.com/danyadev'
          ;vk.com/danyadev;
          
          https://vk.com/elorucov","payload":"1"}}
          https://www.google.com/search?q=%D1%82%D0%B5%D1%81%D1%82
        `)
      )
    ).toEqual([
      { type: 'text', value: 'danyadev@mail.ru' },
      { type: 'text', value: '\n\n.' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '.\n,' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: ',\n!' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '!\n?' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '?\n(' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: ')\n)' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '(\n"' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '"\n\'' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: '\'\n;' },
      { type: 'link', value: 'vk.com/danyadev', link: 'http://vk.com/danyadev' },
      { type: 'text', value: ';\n\n' },
      { type: 'link', value: 'https://vk.com/elorucov', link: 'https://vk.com/elorucov' },
      { type: 'text', value: '","payload":"1"}}' },
      { type: 'text', value: '\n' },
      {
        type: 'link',
        value: 'https://www.google.com/search?q=тест',
        link: 'https://www.google.com/search?q=%D1%82%D0%B5%D1%81%D1%82'
      }
    ]);
  });
});

describe('brParser', () => {
  test('basic cases', () => {
    expect(
      brParser(
        trimLeft(`
          текст
          #хештег
          vk.com/ссылка
        `).replace(/\n/g, '<br>')
      )
    ).toEqual([
      { type: 'text', value: 'текст' },
      { type: 'br' },
      { type: 'hashtag', value: '#хештег' },
      { type: 'br' },
      { type: 'link', value: 'vk.com/ссылка', link: 'http://vk.com/ссылка' }
    ]);
  });
});

describe('emojiParser', () => {
  test('basic cases', () => {
    expect(
      emojiParser(`😏 текст 😏 #hashtag 😏 vk.com/emoji 😏`)
    ).toEqual([
      { type: 'emoji', value: '😏' },
      { type: 'text', value: ' текст ' },
      { type: 'emoji', value: '😏' },
      { type: 'text', value: ' ' },
      { type: 'hashtag', value: '#hashtag' },
      { type: 'text', value: ' ' },
      { type: 'emoji', value: '😏' },
      { type: 'text', value: ' ' },
      { type: 'link', value: 'vk.com/emoji', link: 'http://vk.com/emoji' },
      { type: 'text', value: ' ' },
      { type: 'emoji', value: '😏' }
    ]);
  });
});

describe('mentionParser', () => {
  test('basic cases', () => {
    expect(
      mentionParser(`[id88262293|@danyadev, vk.com/danyadev, 😏, #danyadev]`)
    ).toEqual([
      {
        type: 'mention',
        id: 88262293,
        raw: '[id88262293|@danyadev, vk.com/danyadev, 😏, #danyadev]',
        value: [
          { type: 'text', value: '@danyadev, ' },
          { type: 'text', value: 'vk.com/danyadev' },
          { type: 'text', value: ', ' },
          { type: 'emoji', value: '😏' },
          { type: 'text', value: ', ' },
          { type: 'text', value: '#danyadev' }
        ]
      }
    ]);
  });
});