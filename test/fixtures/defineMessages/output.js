import { defineMessages } from 'react-intl';
const messages = defineMessages({
  "translation message1": {
    id: "translation message1",
    defaultMessage: "translation message1"
  },
  "translation message2": {
    id: "translation message2",
    defaultMessage: "translation message2"
  }
});

function getMessage() {
  if (Math.random() > 1) return "translation message1";
  return "translation message2";
}

function functionThatTranslates(intl) {
  const message = getMessage();
  return intl.formatMessage(function (m) {
    return {
      id: m,
      defaultMessage: m
    };
  }(message));
}

function functionThatTranslates2(intl) {
  const options = ["translation message1", "translation message2"];
  const random = Math.floor(Math.random());
  return intl.formatMessage(function (m) {
    return {
      id: m,
      defaultMessage: m
    };
  }(options[random % 2]));
}

