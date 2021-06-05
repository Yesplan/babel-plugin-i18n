const Helpers = require("./helpers.js");

const MODULE_NAME = "react-intl";
const FUNCTION_NAMES = ["defineMessages"];

module.exports = function({ types: t }) {
  let defineMessages = [];
  let nonStringLiterals = [];
  let options = {};

  function processI18nCall(path, globalIntlIdentifier) {
    const transformedFirstArg = Helpers.processFirstArgumentOfCall(path, t);
    const remainingArgs = path.get("arguments").slice(1).map(path => path.node);
    if (transformedFirstArg.type === "stringLiteral" || transformedFirstArg.type === "templateLiteral") {
      path.replaceWith(
          Helpers.createFormatMessageCall(t, path, path.get("callee"), transformedFirstArg.argument, remainingArgs, globalIntlIdentifier));
    } else if (transformedFirstArg.type === "other") {
      /* Called with non-string literal, add to nonStringLiterals collection to be checked at the end of the program */
      nonStringLiterals.push(transformedFirstArg.original);
      path.replaceWith(
          Helpers.createFormatMessageCall(t, path, path.get("callee"), transformedFirstArg.argument, remainingArgs, globalIntlIdentifier));
    }
  }

  return {
    name: "i18n",
    pre(state) {
      defineMessages = [];
      nonStringLiterals = [];
      options = state.options;
    },
    /*  To make sure that are transformations take place before the babel-plugin-react-intl picks up
        the messages, we declare the visitor on the Program level instead of CallExpression.
        This can possibly be changed once plugin ordering in babel is finalized. */
    visitor: {
      Program(
          programPath,
          {
            file: {
              opts: { filename }
            },
            opts
          }
      ) {
        const globalIntlIdentifier = opts.globalIntl || "$intl";
        programPath.traverse({
          CallExpression: path => {
            const callee = path.get("callee");
            /* Search for calls to i18n:
             *   i18n(args)
             *   object.i18n(args)
             *   this.object.i18n(args) */
            if (
                (callee.isIdentifier() && callee.node.name === "i18n") ||
                Helpers.isI18nMessageCall(callee)
            )
              processI18nCall(path, globalIntlIdentifier);
            else if (
                Helpers.referencesImport(callee, MODULE_NAME, FUNCTION_NAMES)
            ) {
              const messagesObj = path.get("arguments")[0];
              if (messagesObj.isObjectExpression()) {
                messagesObj
                    .get("properties")
                    .map(prop => prop.get("value"))
                    .forEach(prop => {
                      const message = prop.node.properties.filter(
                          keyValue => keyValue.key.name === "defaultMessage"
                      );
                      if (
                          message &&
                          message[0].value &&
                          t.isStringLiteral(message[0].value)
                      )
                        defineMessages.push(message[0].value.value);
                    });
              }
            }
          },
          TaggedTemplateExpression: path => {
            const tag = path.get('tag');
            const quasi = path.get('quasi');
            if (tag.isIdentifier() && tag.node.name === "i18n" && quasi.isTemplateLiteral()) {
              const quasis = quasi.get('quasis').map(quasi => quasi.node.value.raw);
              const expressions = quasi.get('expressions').map(exp => exp.node);
              const taggedTemplateTranslationString = quasis.reduce((joined, string, index) => `${joined}{${index - 1}}${string}`);
              path.replaceWith(
                  Helpers.createFormatMessageCallFromTemplateLiteralTag(
                      t,
                      path,
                      tag,
                      Helpers.createIntlMessage(t, t.StringLiteral(taggedTemplateTranslationString)),
                      expressions,
                      globalIntlIdentifier)
              );
            }
          }
        });
        if (nonStringLiterals.length > 0)
          Helpers.warnAboutNonStringLiteralArguments(
              nonStringLiterals,
              filename
          );
      }
    },
  };
};
