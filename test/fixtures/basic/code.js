const someone = 'Einstein';
const subject = 'relativity'

function functionWithIntl(intl) {
  i18n('translation message');
  i18n`translation message`;
  i18n('translation message from {someone} about {subject}', { someone, subject });
  i18n`translation message from ${someone} about ${subject}`;
}

function functionWithProps(props) {
  i18n('translation message');
  i18n`translation message`;
  i18n('translation message from {someone} about {subject}', { someone, subject });
  i18n`translation message from ${someone} about ${subject}`;
}

function functionWithoutIntlAndProps() {
  i18n('translation message');
  i18n`translation message`;
  i18n('translation message from {someone} about {subject}', { someone, subject });
  i18n`translation message from ${someone} about ${subject}`;
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

function functionWithDifferentScopes2() {
  const intl = this.props.intl;
  const innerFunction = function() {
    i18n('translation in scope');
    this.i18n('translation in this scope');
  }
}
