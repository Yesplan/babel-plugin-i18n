const Helpers = require("./helpers.js");

const MODULE_NAME = "react-intl";
const FUNCTION_NAMES = ["defineMessages"];

module.exports = function({ types: t }) {
  let defineMessages = [];
  let nonStringLiterals = [];
  let options = {};

  function processI18nCall(path) {
    const transformedFirstArg = Helpers.processFirstArgumentOfCall(path, t);
    if (transformedFirstArg.type === "stringLiteral") {
      path.replaceWith(
        Helpers.createFormatMessageCall(t, path, transformedFirstArg.argument)
      );
    } else if (transformedFirstArg.type === "other") {
      /* Called with non-string literal, add to nonStringLiterals collection to be checked at the end of the program */
      nonStringLiterals.push(transformedFirstArg.original);
      path.replaceWith(
        Helpers.createFormatMessageCall(t, path, transformedFirstArg.argument)
      );
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
        the messages, we declare the visitor on the Program leven instead of CallExpression.
        This can possibly be changed once plugin ordering in babel is finalized. */
    visitor: {
      Program(
        programPath,
        {
          file: {
            opts: { filename }
          }
        }
      ) {
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
              processI18nCall(path);
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
          }
        });
        if (nonStringLiterals.length > 0)
          Helpers.warnAboutNonStringLiteralArguments(
            nonStringLiterals,
            filename
          );
      }
    }
  };
};
