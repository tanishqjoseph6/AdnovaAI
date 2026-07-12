import type {
  OAuthTokens,
  PublishInput,
  PublishResult,
  SocialProfile,
  SocialProvider,
} from "@/lib/social-scheduler/providers/types";
import {
  readSocialOAuthEnv,
  SOCIAL_OAUTH_ENV,
} from "@/lib/social-scheduler/env-vars";

function getXCredentials() {
  const clientId = readSocialOAuthEnv(SOCIAL_OAUTH_ENV.X_CLIENT_ID);
  const clientSecret = readSocialOAuthEnv(SOCIAL_OAUTH_ENV.X_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    throw new Error(`${SOCIAL_OAUTH_ENV.X_CLIENT_ID} is not configured`);
  }

  return { clientId, clientSecret };
}

async function parseTokenResponse(
  response: Response
): Promise<OAuthTokens> {
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ?? payload.error ?? "OAuth token exchange failed"
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresAt:
      typeof payload.expires_in === "number"
        ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
        : null,
    scopes: payload.scope?.split(" ") ?? [],
  };
}

async function uploadXMedia(
  accessToken: string,
  imageUrl: string
): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Unable to fetch image for X upload.");
  }

  const contentType =
    imageResponse.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  const form = new FormData();
  form.append("media_category", "tweet_image");
  form.append(
    "media",
    new Blob([buffer], { type: contentType }),
    "upload.jpg"
  );

  const uploadResponse = await fetch(
    "https://upload.twitter.com/1.1/media/upload.json",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  const uploadPayload = (await uploadResponse.json()) as {
    media_id_string?: string;
    error?: string;
  };

  if (!uploadResponse.ok || !uploadPayload.media_id_string) {
    throw new Error(
      uploadPayload.error ?? "X media upload failed."
    );
  }

  return uploadPayload.media_id_string;
}

export const xProvider: SocialProvider = {
  platform: "x",
  isAvailable: true,
  characterLimit: 280,
  supportsImages: true,
  oauthScopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],

  buildAuthorizeUrl({ state, codeChallenge, redirectUri }) {
    const { clientId } = getXCredentials();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: xProvider.oauthScopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  },

  async exchangeCode({ code, codeVerifier, redirectUri }) {
    const { clientId, clientSecret } = getXCredentials();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    return parseTokenResponse(response);
  },

  async refreshAccessToken(refreshToken) {
    const { clientId, clientSecret } = getXCredentials();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    });

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body,
    });

    return parseTokenResponse(response);
  },

  async fetchProfile(accessToken): Promise<SocialProfile> {
    const response = await fetch(
      "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const payload = (await response.json()) as {
      data?: {
        id?: string;
        username?: string;
        name?: string;
        profile_image_url?: string;
      };
      detail?: string;
      title?: string;
    };

    if (!response.ok || !payload.data?.id) {
      throw new Error(payload.detail ?? payload.title ?? "Unable to load X profile.");
    }

    return {
      profileId: payload.data.id,
      profileUsername: payload.data.username ?? null,
      profileName: payload.data.name ?? null,
      profileImageUrl: payload.data.profile_image_url ?? null,
    };
  },

  async publishPost(input: PublishInput): Promise<PublishResult> {
    const body: Record<string, unknown> = { text: input.caption };

    if (input.imageUrl) {
      const mediaId = await uploadXMedia(input.accessToken, input.imageUrl);
      body.media = { media_ids: [mediaId] };
    }

    const response = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      data?: { id?: string };
      detail?: string;
      title?: string;
    };

    if (!response.ok || !payload.data?.id) {
      throw new Error(
        payload.detail ?? payload.title ?? "Failed to publish to X."
      );
    }

    return {
      externalPostId: payload.data.id,
      publishedAt: new Date().toISOString(),
    };
  },
};
