function functionWithIntl(intl) {
  i18n('translation message');
}

function functionWithProps(props) {
  i18n('translation message')
}

function functionWithoutIntlAndProps() {
  i18n('translation message');
}

function functionWithMultipleCalls(intl, arg1, arg2) {
  const msg = i18n('translation message');
  if(arg1 === arg2)
    return msg + i18n('equal arguments');
  else
    return msg + i18n('non-equal arguments');
}


function functionWithDifferentThisScopes(props) {
  i18n('translation message');
  const innerFunction = function(props) {
    this.i18n('translation in this scope');
    i18n('translation in props scope');
  }
}
