## Rationale

This babel plugin transforms all calls to `i18n(string)` or the tagged template ``i18n`templateLiteral``` to its equivalent of the [React Intl](https://github.com/formatjs/react-intl) library.
For example:

```
render(props) {
  const from = 'this babel plugin';
  return (
    <p>
        {i18n('Hello there')}
        {i18n` from ${from}!`}
    </p>);
}
```

becomes

```
render(props) {
  return (
    <p>
      {props.intl.formatMessage({
        id: 'Hello there',
        defaultMessage: 'Hello there'
        })
      }
      {props.intl.formatMessage({
        id: 'from ${0}',
        defaultMessage: 'from ${0}'
      ), [ from ]}
    </p>);
}
```
Together with the use of [React Intl babel plugin](https://github.com/formatjs/formatjs/tree/master/packages/babel-plugin-react-intl) these calls will be picked up
and the `.json` files with the messages are generated automatically.

## Usage

Add this plugin to the babel config:

```
"plugins": ["i18n"]
```

It's best to add the `i18n` function as a global function to your linter as well.

### React components
Depending on the context where or how the `i18n` function is called, the transformation will be different:
1. Called as `this.i18n`: always transformed to `this.props.intl.formatMessage(...)`. This can be useful when e.g. a nested render function has `props` as an argument where `props.intl` does not exists, but the surrounding `this` scope has `this.props.intl` defined.
1. With `intl` in scope: `intl.formatMessage(...)`
2. With `props` in scope: `props.intl.formatMessage(...)`
3. Without `props` in scope: `this.props.intl.formatMessage(...)`

This means that you *have to* pass the `intl` object from the React Intl library to as a property to all components that use the `i18n` function.

### Special cases
The plugin gives a warning when the `i18n` function is called with anything else than a String Literal as a first argument.
This can be solved by defining the possible messages by using the `defineMessages` construct from the React Intl library.

The following program raises a warning, because the last call to `i18n` is with a non-string literal.
```
function random() {
  if (Math.random() * 10 > 5) return 'Smaller than 5!';
  return 'Greater than 5!';
}

function messageBasedOnRandom(intl) {
  const message = random();
  return i18n('Result is: ') + i18n(message);
}
```
To solve this:
```
import { defineMessages } from 'react-intl';
const messages = defineMessages({
  'Smaller than 5!': {
    'id': 'Smaller than 5!',
    'defaultMessage': 'Smaller than 5!')
  },
  'Greater than 5!': {
    'id': 'Greater than 5!',
    'defaultMessage': 'Greater than 5!'
  }
});

function messageBasedOnRandom(intl) {
  const message = random();
  return i18n('Result is: ') + i18n(messages[message]);
}

```

The last call is transformed then transformed to `intl.formatMessage(messages[message])`.
