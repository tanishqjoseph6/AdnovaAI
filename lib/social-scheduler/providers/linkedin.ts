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

function getLinkedInCredentials() {
  const clientId = readSocialOAuthEnv(SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_ID);
  const clientSecret = readSocialOAuthEnv(
    SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_SECRET
  );

  if (!clientId || !clientSecret) {
    throw new Error(`${SOCIAL_OAUTH_ENV.LINKEDIN_CLIENT_ID} is not configured`);
  }

  return { clientId, clientSecret };
}

async function parseLinkedInTokenResponse(
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
      payload.error_description ??
        payload.error ??
        "LinkedIn OAuth token exchange failed"
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

async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  imageUrl: string
): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Unable to fetch image for LinkedIn upload.");
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  const registerResponse = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    }
  );

  const registerPayload = (await registerResponse.json()) as {
    value?: {
      asset?: string;
      uploadMechanism?: {
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"?: {
          uploadUrl?: string;
        };
      };
    };
    message?: string;
  };

  const uploadUrl =
    registerPayload.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl;
  const asset = registerPayload.value?.asset;

  if (!registerResponse.ok || !uploadUrl || !asset) {
    throw new Error(
      registerPayload.message ?? "LinkedIn image registration failed."
    );
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("LinkedIn image upload failed.");
  }

  return asset;
}

export const linkedinProvider: SocialProvider = {
  platform: "linkedin",
  isAvailable: true,
  characterLimit: 3000,
  supportsImages: true,
  oauthScopes: ["openid", "profile", "email", "w_member_social"],

  buildAuthorizeUrl({ state, redirectUri }) {
    const { clientId } = getLinkedInCredentials();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: linkedinProvider.oauthScopes.join(" "),
      state,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  },

  async exchangeCode({ code, redirectUri }) {
    const { clientId, clientSecret } = getLinkedInCredentials();
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    return parseLinkedInTokenResponse(response);
  },

  async refreshAccessToken(refreshToken) {
    const { clientId, clientSecret } = getLinkedInCredentials();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(
      "https://www.linkedin.com/oauth/v2/accessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    return parseLinkedInTokenResponse(response);
  },

  async fetchProfile(accessToken): Promise<SocialProfile> {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = (await response.json()) as {
      sub?: string;
      name?: string;
      preferred_username?: string;
      picture?: string;
      message?: string;
    };

    if (!response.ok || !payload.sub) {
      throw new Error(payload.message ?? "Unable to load LinkedIn profile.");
    }

    return {
      profileId: payload.sub,
      profileUsername: payload.preferred_username ?? null,
      profileName: payload.name ?? null,
      profileImageUrl: payload.picture ?? null,
    };
  },

  async publishPost(input: PublishInput): Promise<PublishResult> {
    if (!input.profileId) {
      throw new Error("LinkedIn author profile is missing.");
    }

    const authorUrn = `urn:li:person:${input.profileId}`;
    let shareMediaCategory: "NONE" | "IMAGE" = "NONE";
    let media: Array<{ status: string; media: string }> | undefined;

    if (input.imageUrl) {
      const asset = await uploadLinkedInImage(
        input.accessToken,
        authorUrn,
        input.imageUrl
      );
      shareMediaCategory = "IMAGE";
      media = [{ status: "READY", media: asset }];
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: input.caption },
            shareMediaCategory,
            ...(media ? { media } : {}),
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      }),
    });

    const payload = (await response.json()) as {
      id?: string;
      message?: string;
      status?: number;
    };

    if (!response.ok || !payload.id) {
      throw new Error(payload.message ?? "Failed to publish to LinkedIn.");
    }

    return {
      externalPostId: payload.id,
      publishedAt: new Date().toISOString(),
    };
  },
};
