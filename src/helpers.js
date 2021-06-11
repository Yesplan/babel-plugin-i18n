const generate = require("@babel/generator")["default"];

module.exports = {
  warnAboutNonStringLiteralArguments: function(nonStringLiterals, filename) {
    const argString = nonStringLiterals.map(arg => {
      const loc = arg.node.loc;
      let lineNr = "//";
      if (loc) lineNr = loc.start.line.toString();
      const code = generate(arg.parent).code;
      return `\t- line ${lineNr}: ${code}\n`;
    });
    console.warn(
        `\nWARNING i18n called with non-string literal in ${filename}: \n ${argString}` +
        ` ==> Use defineMessages from the react-intl package to make sure these translations are picked up.`
    );
  },

  isI18nMessageCall: function(callee) {
    if (!callee.isMemberExpression()) return false;
    const object = callee.get("object");
    const property = callee.get("property");

    return (
        property.isIdentifier() &&
        property.node.name === "i18n" &&
        /* this.i18n(...) */
        (object.isThisExpression() ||
            /* props.i18n(...) */
            (object.isIdentifier() ||
                /* this.props.i18n(...) */
                object.isMemberExpression()))
    );
  },

  referencesImport: function(path, moduleName, importedNames) {
    if (!(path.isIdentifier() || path.isJSXIdentifier())) return false;
    return importedNames.some(name => path.referencesImport(moduleName, name));
  },

  /* AST nodes */
  createIntlMessage(t, messageNode, options) {
    const properties = [t.ObjectProperty(t.Identifier("id"), messageNode),
      t.ObjectProperty(t.Identifier("defaultMessage"), messageNode)]
    if (options.includeDescription) {
      const descriptionNode = t.StringLiteral(options.filename.slice(options.filename.lastIndexOf('/') + 1));
      properties.push(t.ObjectProperty(t.Identifier("description"), descriptionNode))
    }
    return t.ObjectExpression(properties);
  },
  /* function(m) {return {id: m, defaultMessage: m}; } */
  createReturnMessageFunction(t) {
    return t.FunctionExpression(
        null,
        [t.Identifier("m")],
        t.BlockStatement([
          t.returnStatement(
              t.ObjectExpression([
                t.ObjectProperty(t.Identifier("id"), t.Identifier("m")),
                t.ObjectProperty(t.Identifier("defaultMessage"), t.Identifier("m"))
              ])
          )
        ])
    );
  },
  createCallExpression(t, functionToCall, callArguments) {
    return t.callExpression(functionToCall, callArguments);
  },
  createFormatMessageCall(t, path, callee, firstArgument, otherArguments, { globalIntlIdentifier, alwaysUseGlobal }) {
    let memberExpression;
    let callArguments = [];
    const object = callee.isMemberExpression() && callee.get("object");

    /* Unless alwaysUseGlobal is true, we search for intl and props in the scope.
      If intl is in scope, the call is of the form intl.formatMessage,
      if props is in scope, the call is of the form props.intl.formatMessage,
      otherwise this.props.intl is used.
     */
    if (alwaysUseGlobal) {
      memberExpression = t.MemberExpression(
          t.MemberExpression(
              t.ObjectExpression([ t.ObjectProperty(t.identifier("intl"), t.identifier(globalIntlIdentifier)) ]),
              t.identifier("intl")),
          t.identifier("formatMessage"));
    } else if (path.scope.hasBinding("intl")) {
      memberExpression = t.MemberExpression(
          t.identifier("intl"),
          t.identifier("formatMessage")
      );
    } else if (
        path.scope.hasBinding("props") &&
        !(object && t.isThisExpression(object))
    ) {
      const conditionExpression = t.MemberExpression(t.identifier("props"), t.identifier("intl"));
      const intlObjectExpression = t.ObjectExpression([ t.ObjectProperty(t.identifier("intl"), t.identifier(globalIntlIdentifier)) ]);
      memberExpression = t.MemberExpression(
          t.MemberExpression(
              t.conditionalExpression(conditionExpression, t.identifier("props"), intlObjectExpression),
              t.identifier("intl")),
          t.identifier("formatMessage"));
    } else {
      const conditionExpression = t.LogicalExpression("&&",
          t.ThisExpression(),
          t.LogicalExpression("&&",
              t.MemberExpression(t.ThisExpression(), t.identifier("props")),
              t.MemberExpression(
                  t.MemberExpression(t.ThisExpression(), t.identifier("props")),
                  t.identifier("intl"))));
      const thisPropsExpression = t.MemberExpression(t.ThisExpression(), t.identifier("props"));
      const intlObjectExpression = t.ObjectExpression([ t.ObjectProperty(t.identifier("intl"), t.identifier(globalIntlIdentifier)) ]);
      memberExpression = t.MemberExpression(
          t.MemberExpression(
              t.conditionalExpression(conditionExpression, thisPropsExpression, intlObjectExpression),
              t.identifier("intl")),
          t.identifier("formatMessage"));
    }
    if (firstArgument) {
      callArguments = [
        firstArgument,
        ...otherArguments
      ];
    } else {
      callArguments = otherArguments;
    }
    return t.CallExpression(memberExpression, callArguments);
  },
  createFormatMessageCallFromTemplateLiteralTag(t, path, callee, firstArgument, otherArguments, options) {
    const expressions = [t.ArrayExpression(otherArguments)];
    return this.createFormatMessageCall(t, path, callee, firstArgument, expressions, options);

  }
};
