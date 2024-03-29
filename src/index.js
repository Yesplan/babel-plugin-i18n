const Helpers = require("./helpers.js");

const MODULE_NAME = "react-intl";
const FUNCTION_NAMES = ["defineMessages"];

module.exports = function({ types: t }) {

  function processI18nCall(path, options) {
    const firstArg = path.get("arguments")[0];
    const remainingArgs = path.get("arguments").slice(1).map(path => path.node);
    const isStringLiteral = t.isStringLiteral(firstArg.node);
    const messageExp = (isStringLiteral)
        ? Helpers.createIntlMessage(t, t.StringLiteral(firstArg.node.value), options)
        : Helpers.createCallExpression(t, Helpers.createReturnMessageFunction(t), [firstArg.node]);
    path.replaceWith(
        Helpers.createFormatMessageCall(t, path, path.get("callee"), messageExp, remainingArgs, options));
  }

  function processI18nDefineCall(path, options) {
    const firstArgument = path.get("arguments")[0];
    if (t.isArrayExpression(firstArgument)) {
      const elements = firstArgument.get("elements");
      const strings = elements.map((element) => {
        if (t.isStringLiteral(element)) {
          return element.node.value;
        } else {
          throw path.buildCodeFrameError('Argument expression to call of "i18nDefine" must be an array expression containing only string literals')
        }
      });
      path.replaceWith(
          t.FunctionExpression(
              null,
              [t.identifier("intl")],
              t.BlockStatement(
                  strings.map((string) =>
                      t.ExpressionStatement(
                          t.CallExpression(
                              t.MemberExpression(t.identifier("intl"), t.identifier("formatMessage")),
                              [Helpers.createIntlMessage(t, t.StringLiteral(string), options)]))))));
    } else {
      throw path.buildCodeFrameError('Argument expression to call of "i18nDefine" must be an array expression')
    }
  }

  return {
    name: "i18n",
    pre(state) {},
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
            opts: specifiedOptions
          }
      ) {
        const {
          globalIntl: globalIntlIdentifier = "$intl",
          alwaysUseGlobal = false,
          i18nMessageCalls = "process",
          oneBasedTemplateParameters = false,
          includeDescription = false
        } = specifiedOptions;
        const options = { globalIntlIdentifier, alwaysUseGlobal, i18nMessageCalls, oneBasedTemplateParameters, filename, includeDescription };
        programPath.traverse({
          CallExpression: path => {
            const callee = path.get("callee");
            if (callee.isIdentifier() && callee.node.name === "i18nDefine") {
              processI18nDefineCall(path, options);
            }
            /* Search for calls to i18n:
             *   i18n(args)
             *   object.i18n(args)
             *   this.object.i18n(args) */
            if (callee.isIdentifier() && callee.node.name === "i18n") {
              processI18nCall(path, options);
            } else if (Helpers.isI18nMessageCall(callee)) {
              switch(i18nMessageCalls) {
                case "ignore":
                  break;
                case "process":
                  processI18nCall(path, options);
                  break;
                case "error":
                  throw path.buildCodeFrameError('Use of "i18n" as message call while plugin option "i18nMessageCalls" is set to "error"');
                  break;
                default:
                  throw new Error(`Invalid value for option "i18nMessageCalls": ${i18nMessageCalls}`);
              }
            }
          },
          TaggedTemplateExpression: path => {
            const tag = path.get('tag');
            const quasi = path.get('quasi');
            if (tag.isIdentifier() && tag.node.name === "i18n" && quasi.isTemplateLiteral()) {
              const quasis = quasi.get('quasis').map(quasi => {
                const cooked = quasi.node.value.cooked;
                if (cooked === null)
                  throw path.buildCodeFrameError(`Use of unsupported template literal containing: ${quasi.node.value.raw}`);
                return cooked;
              });
              const expressions = quasi.get('expressions').map(exp => exp.node);
              const offset = oneBasedTemplateParameters ? 0 : -1;
              const taggedTemplateTranslationString = quasis.reduce((joined, string, index) => `${joined}{${index + offset}}${string}`);
              path.replaceWith(
                  Helpers.createFormatMessageCallFromTemplateLiteralTag(
                      t,
                      path,
                      tag,
                      Helpers.createIntlMessage(t, t.StringLiteral(taggedTemplateTranslationString), options),
                      (oneBasedTemplateParameters)
                          ? [t.NullLiteral(), ...expressions]
                          : expressions,
                      options)
              );
            }
          }
        });
      }
    },
  };
};
