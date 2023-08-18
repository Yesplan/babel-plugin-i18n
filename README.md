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
This can be solved by defining the possible messages by using the `i18nDefine` construct.

The following program raises a warning, because the last call to `i18n` is with a non-string literal.
```
// function from a library,... where i18n can't be used.
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
i18nDefine([
  'Smaller than 5!',
  'Greater than 5!'
]);

function messageBasedOnRandom(intl) {
  const message = random();
  return i18n('Result is: ') + i18n(message);
}

```

`i18n` ensures that the strings passed to it are picked up and will show up in the `json` files with the other strings that need to be translated.

### Options
- `gintl` (string, defaults to 'gintl'): name for the global _intl_ 
- `alwaysUseGlobal` (boolean, defaults to false) in which case the existing behavior of preferring local variables is retained, if set to true, the global is always used instead
- `i18nMessageCalls` (one of 'ignore', 'error' or the default 'process') allowing to configure whether ‘i18n’ message calls on an object should be processed, ignored or be treated as a source code error
- `oneBasedTemplateParameters` (boolean, defaults to false) allowing to configure whether for an example like ``i18n`first: ${Math.random()}, second: ${Math.random()}` ``, the message is `first: {0}, second: {1}` (if set to false) or `first: {1}, second: {2}` (if set to true).
- `includeDescription` (boolean, defaults to false) to control if a `description` property is added to the extracted messages, with the filename as value
