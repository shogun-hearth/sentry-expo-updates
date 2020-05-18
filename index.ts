// based on https://github.com/expo/sentry-expo/blob/master/index.js

import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { RewriteFrames } from '@sentry/integrations';
import { Constants } from 'react-native-unimodules';
import * as Updates from 'expo-updates';

function isPublishedExpoUrl(url: string) {
  return url.includes('.expo-internal');
}

function normalizeUrl(url: string) {
  if (isPublishedExpoUrl(url)) {
    return `app:///main.${Platform.OS}.bundle`;
  }
  return url;
}

class ExpoIntegration {
  static id = 'ExpoIntegration';

  name = ExpoIntegration.id;

  /* eslint-disable class-methods-use-this */
  setupOnce() {
    Sentry.setExtras({
      manifest: Updates.manifest,
      deviceYearClass: Constants.deviceYearClass,
      linkingUri: Constants.linkingUri,
    });

    Sentry.setTags({
      deviceId: Constants.installationId,
      appOwnership: Constants.appOwnership,
    });

    if (Updates.manifest) {
      const manifest = Updates.manifest as Updates.Manifest;
      if (manifest.releaseChannel) {
        Sentry.setTag('expoReleaseChannel', manifest.releaseChannel);
      }
      if (manifest.version) {
        Sentry.setTag('expoAppVersion', manifest.version);
      }
      if (manifest.publishedTime) {
        Sentry.setTag('expoAppPublishedTime', manifest.publishedTime);
      }
    }

    const defaultHandler =
      (ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler());

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      Sentry.getCurrentHub().withScope((scope) => {
        if (isFatal) {
          scope.setLevel(Sentry.Severity.Fatal);
        }
        Sentry.getCurrentHub().captureException(error, {
          originalException: error,
        });
      });

      const client = Sentry.getCurrentHub().getClient();
      // If in dev, we call the default handler anyway and hope the error will be sent
      // Just for a better dev experience
      if (client && !__DEV__) {
        client
          .flush(2000)
          .then(() => {
            defaultHandler(error, isFatal);
          }, (e) => {
            // eslint-disable-next-line no-console
            console.error(e);
          });
      } else {
        // If there is no client something is fishy, anyway we call the default handler
        defaultHandler(error, isFatal);
      }
    });

    Sentry.addGlobalEventProcessor((event) => {
      const that = Sentry.getCurrentHub().getIntegration(ExpoIntegration);

      if (that) {
        let additionalDeviceInformation = {};

        if (Platform.OS === 'ios') {
          additionalDeviceInformation = {
            model: Constants.platform?.ios?.model,
          };
        } else {
          additionalDeviceInformation = {
            model: 'n/a',
          };
        }

        // eslint-disable-next-line no-param-reassign
        event.contexts = {
          ...(event.contexts || {}),
          device: {
            simulator: !Constants.isDevice,
            ...additionalDeviceInformation,
          },
          os: {
            name: Platform.OS === 'ios' ? 'iOS' : 'Android',
            version: `${Platform.Version}`,
          },
        };
      }

      return event;
    });
  }
}

// eslint-disable-next-line import/prefer-default-export
export const configureWithExpoUpdates = (opts: Sentry.ReactNativeOptions) => {
  Sentry.init({
    integrations: [
      new Sentry.Integrations.ReactNativeErrorHandlers({
        onerror: false,
        onunhandledrejection: true,
      }),
      new ExpoIntegration(),
      new RewriteFrames({
        iteratee: (frame) => {
          if (frame.filename) {
            // eslint-disable-next-line no-param-reassign
            frame.filename = normalizeUrl(frame.filename);
          }
          return frame;
        },
      }),
    ],
    ...opts,
  });

  const { revisionId } = Updates.manifest as Updates.Manifest;

  Sentry.setRelease(revisionId || 'UNVERSIONED');
  Sentry.setDist('release');
};
