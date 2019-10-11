function functionWithIntl(intl) {
  intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
}

function functionWithProps(props) {
  props.intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
}

function functionWithoutIntlAndProps() {
  this.props.intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
}

function functionWithMultipleCalls(intl, arg1, arg2) {
  const msg = intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
  if (arg1 === arg2) return msg + intl.formatMessage({
    id: "equal arguments",
    defaultMessage: "equal arguments"
  });else return msg + intl.formatMessage({
    id: "non-equal arguments",
    defaultMessage: "non-equal arguments"
  });
}

function functionWithDifferentThisScopes(props) {
  props.intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });

  const innerFunction = function (props) {
    this.props.intl.formatMessage({
      id: "translation in this scope",
      defaultMessage: "translation in this scope"
    });
    props.intl.formatMessage({
      id: "translation in props scope",
      defaultMessage: "translation in props scope"
    });
  };
}

function functionWithDifferentScopes2() {
  const intl = this.props.intl;

  const innerFunction = function () {
    intl.formatMessage({
      id: "translation in scope",
      defaultMessage: "translation in scope"
    });
    intl.formatMessage({
      id: "translation in this scope",
      defaultMessage: "translation in this scope"
    });
  };
}
