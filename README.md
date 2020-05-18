# sentry-expo-updates

This is a fork of [sentry-expo](https://github.com/expo/sentry-expo) with modifications to work with [expo-updates](https://www.npmjs.com/package/expo-updates) on a bare workflow.

## Installation

- Setup [expo-updates](https://github.com/expo/expo/blob/master/packages/expo-updates/README.md)
- Install [@sentry/react-native](https://github.com/getsentry/sentry-react-native#installation-and-usage)

`npm install @sentry/integrations sentry-expo-updates`

Instead of `Sentry.init` use `configureWithExpoUpdates`

```
import { configureWithExpoUpdates } from 'sentry-expo-updates';

...
configureWithExpoUpdates({
  dsn: `https://${Config.SENTRY_CLIENT_KEY}@sentry.io/${Config.SENTRY_PROJECT_ID}`,
  enabled: ...
});
```

## Sourcemaps support

```
{
  ...
  "expo": {
    ...
    "hooks": {
      ...
      "postPublish": [
        {
          "file": "sentry-expo-updates/upload-sourcemaps",
          "config": {
            "organization": "...",
            "project": "..",
            "authToken": "..."
          }
        }
      ]
    }
  }
}
```

## Limitations

- This library is not tested with the new [*no-publish workflow*](https://github.com/expo/expo/blob/master/packages/expo-updates/README.md#upgrading) of `expo-updates`.
- Native crash is not tagged with `expo-updates` revision id.

## Some Links

[Sentry Website](https://sentry.io/welcome/)

[sentry-react-native repo](https://github.com/getsentry/sentry-react-native)
