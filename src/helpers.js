const generate = require("@babel/generator")["default"];

module.exports = {
  processFirstArgumentOfCall: function(path, t) {
    const firstArgument = path.get("arguments")[0];
    if (t.isStringLiteral(firstArgument.node)) {
      return {
        type: "stringLiteral",
        argument: this.createIntlMessage(t, t.StringLiteral(firstArgument.node.value))
      };
    } else if(t.isTemplateLiteral(firstArgument.node)) {
      return {
        type: "templateLiteral",
        argument: this.createIntlMessage(t, t.templateLiteral(firstArgument.node.quasis, firstArgument.node.expressions))
      }
    } else {
      return {
        type: "other",
        original: firstArgument,
        argument: this.createCallExpression(
          t,
          this.createReturnMessageFunction(t),
          [firstArgument.node]
        )
      };
    }
  },

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
  createIntlMessage(t, messageNode) {
    return t.ObjectExpression([
      t.ObjectProperty(t.Identifier("id"), messageNode),
      t.ObjectProperty(t.Identifier("defaultMessage"), messageNode)
    ]);
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
  createFormatMessageCall(t, path, firstArgument) {
    let memberExpression;
    let callArguments = [];
    const callee = path.get("callee");
    const object = callee.isMemberExpression() && callee.get("object");

    /* We search for intl and props in the scope.
      If intl is in scope, the call is of the form intl.formatMessage,
      if props is in scope, the call is of the form props.intl.formatMessage,
      otherwise this.props.intl is used.
     */
    if (path.scope.hasBinding("intl")) {
      memberExpression = t.MemberExpression(
        t.identifier("intl"),
        t.identifier("formatMessage")
      );
    } else if (
      path.scope.hasBinding("props") &&
      !(object && t.isThisExpression(object))
    ) {
      memberExpression = t.MemberExpression(
        t.MemberExpression(t.identifier("props"), t.identifier("intl")),
        t.identifier("formatMessage")
      );
    } else {
      memberExpression = t.MemberExpression(
        t.MemberExpression(
          t.MemberExpression(t.ThisExpression(), t.identifier("props")),
          t.identifier("intl")
        ),
        t.identifier("formatMessage")
      );
    }
    if (firstArgument) {
      callArguments = [
        firstArgument,
        ...path
          .get("arguments")
          .slice(1)
          .map(function(path) {
            return path.node;
          })
      ];
    } else {
      callArguments = path.get("arguments").map(function(path) {
        return path.node;
      });
    }
    return t.CallExpression(memberExpression, callArguments);
  }
};
