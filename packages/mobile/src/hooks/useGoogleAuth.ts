import { useCallback, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { exchangeCodeAsync } from 'expo-auth-session';
import { getAdapters } from '@knowlex/core/api/runtime';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export function useGoogleAuth(onIdToken: (idToken: string) => Promise<void>) {
  const { env } = getAdapters();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: env.googleClientId,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    if (response?.type !== 'success' || !request) return;

    const code = response.params.code;
    if (!code) return;

    exchangeCodeAsync(
      {
        clientId: env.googleClientId,
        code,
        redirectUri: request.redirectUri,
        extraParams: request.codeVerifier
          ? { code_verifier: request.codeVerifier }
          : undefined,
      },
      { tokenEndpoint: GOOGLE_TOKEN_ENDPOINT },
    ).then((tokenResponse) => {
      if (tokenResponse.idToken) {
        onIdToken(tokenResponse.idToken);
      }
    });
  }, [response, request, env.googleClientId, onIdToken]);

  const signIn = useCallback(() => {
    promptAsync();
  }, [promptAsync]);

  return { signIn, isReady: !!request };
}
