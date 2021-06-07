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

pluginTester({
  plugin,
  pluginOptions: {
    i18nMessageCalls: "ignore"
  },
  tests: {
    "Option i18nMessageCalls: ignore" : {
      code: `
        function f() {
          i18n("Translation message");
          this.i18n("Translation message");
        }`,
      output: `
        function f() {
          (this && this.props && this.props.intl ? this.props : {
            intl: $intl
          }).intl.formatMessage({
            id: "Translation message",
            defaultMessage: "Translation message"
          });
          this.i18n("Translation message");
        }`
    }
  }
});

pluginTester({
  plugin,
  pluginOptions: {
    i18nMessageCalls: "error"
  },
  tests: {
    "Option i18nMessageCalls: error" : {
      code: `
        function f() {
          i18n("Translation message");
          this.i18n("Translation message");
        }`,
      error: 'Use of "i18n" as message call while plugin option "i18nMessageCalls" is set to "error"'
    }
  }
});

pluginTester({
  plugin,
  tests: {
    "i18nDefine" : {
      code: 'i18nDefine(["Translation message", "Translation message {1}"]);',
      output: `
        (function (intl) {
          intl.formatMessage({
            id: "Translation message",
            defaultMessage: "Translation message"
          });
          intl.formatMessage({
            id: "Translation message {1}",
            defaultMessage: "Translation message {1}"
          });
        });
      `
    }
  }
});

pluginTester({
  plugin,
  title: 'Calls of ‘i18n’ where the first argument expression is not a literal string',
  tests: [
    {
      code: "i18n('Translation message (' + Math.random() + ')')",
      output: `
        (this && this.props && this.props.intl ? this.props : {
          intl: $intl
        }).intl.formatMessage(function (m) {
          return {
            id: m,
            defaultMessage: m
          };
        }('Translation message (' + Math.random() + ')'));`
    },
    {
      code: 'i18n(`Translation message template`)',
      output: `
        (this && this.props && this.props.intl ? this.props : {
          intl: $intl
        }).intl.formatMessage(function (m) {
          return {
            id: m,
            defaultMessage: m
          };
        }(\`Translation message template\`));`
    },
    {
      code: 'i18n(tagFunction`Tagged translation message template`)',
      output: `
        (this && this.props && this.props.intl ? this.props : {
          intl: $intl
        }).intl.formatMessage(function (m) {
          return {
            id: m,
            defaultMessage: m
          };
        }(tagFunction\`Tagged translation message template\`));`
    },
    {
      code: 'i18n(`Translation message template (${Math.random()})`)',
      output: `
        (this && this.props && this.props.intl ? this.props : {
          intl: $intl
        }).intl.formatMessage(function (m) {
          return {
            id: m,
            defaultMessage: m
          };
        }(\`Translation message template (\${Math.random()})\`));`
    }
  ]
});
