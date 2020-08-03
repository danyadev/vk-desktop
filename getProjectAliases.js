const path = require('path');

module.exports = (type) => (
  ['assets', 'components', 'css', 'js', 'lang'].reduce((aliases, name) => {
    if (type === 'webpack') {
      aliases[name] = path.resolve(__dirname, 'src/' + name);
    }

    if (type === 'jest') {
      aliases[`^${name}$`] = '<rootDir>/src/' + name;
    }

    return aliases;
  }, {})
);
