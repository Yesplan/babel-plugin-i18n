const someone = 'Einstein';
const subject = 'relativity';

function functionWithIntl(intl) {
  intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
  intl.formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  }, []);
  intl.formatMessage({
    id: "translation message from {someone} about {subject}",
    defaultMessage: "translation message from {someone} about {subject}"
  }, {
    someone,
    subject
  });
  intl.formatMessage({
    id: "translation message from {0} about {1}",
    defaultMessage: "translation message from {0} about {1}"
  }, [someone, subject]);
}

function functionWithProps(props) {
  (props.intl ? props.intl : gintl).formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
  (props.intl ? props.intl : gintl).formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  }, []);
  (props.intl ? props.intl : gintl).formatMessage({
    id: "translation message from {someone} about {subject}",
    defaultMessage: "translation message from {someone} about {subject}"
  }, {
    someone,
    subject
  });
  (props.intl ? props.intl : gintl).formatMessage({
    id: "translation message from {0} about {1}",
    defaultMessage: "translation message from {0} about {1}"
  }, [someone, subject]);
}

function functionWithoutIntlAndProps() {
  (this && this.props && this.props.intl ? this.props.intl : gintl).formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });
  (this && this.props && this.props.intl ? this.props.intl : gintl).formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  }, []);
  (this && this.props && this.props.intl ? this.props.intl : gintl).formatMessage({
    id: "translation message from {someone} about {subject}",
    defaultMessage: "translation message from {someone} about {subject}"
  }, {
    someone,
    subject
  });
  (this && this.props && this.props.intl ? this.props.intl : gintl).formatMessage({
    id: "translation message from {0} about {1}",
    defaultMessage: "translation message from {0} about {1}"
  }, [someone, subject]);
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
  (props.intl ? props.intl : gintl).formatMessage({
    id: "translation message",
    defaultMessage: "translation message"
  });

  const innerFunction = function (props) {
    (this && this.props && this.props.intl ? this.props.intl : gintl).formatMessage({
      id: "translation in this scope",
      defaultMessage: "translation in this scope"
    });
    (props.intl ? props.intl : gintl).formatMessage({
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
