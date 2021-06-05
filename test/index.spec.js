const pluginTester = require('babel-plugin-tester');

const plugin =  require('../src');

const path = require('path');

pluginTester({
  plugin,
  fixtures: path.join(__dirname, 'fixtures')
});

pluginTester({
  plugin,
  pluginOptions: {
    globalIntl: "gintl"
  },
  tests: {
    "Option globalIntl" : {
      code: 'i18n("Translation message")',
      output: `
        (this && this.props && this.props.intl ? this.props : {
          intl: gintl
        }).intl.formatMessage({
          id: "Translation message",
          defaultMessage: "Translation message"
        });
      `
    }
  }
});

pluginTester({
  plugin,
  pluginOptions: {
    alwaysUseGlobal: true
  },
  tests: {
    "Option alwaysUseGlobal" : {
      code: `
        function f(intl) {
          i18n("Translation message")
        }`,
      output: `
        function f(intl) {
          ({
            intl: $intl
          }).intl.formatMessage({
            id: "Translation message",
            defaultMessage: "Translation message"
          });
        }`
    }
  }
});
