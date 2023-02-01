import { Profile } from "@/models/User";
import NextAuth, { AuthOptions } from "next-auth";

const authRedirectUri = process.env.NEXTAUTH_REDIRECT_URI;
const authClientId = process.env.NEXTAUTH_CLIENT_ID;
const authSecret = process.env.NEXTAUTH_SECRET;

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "snapchat",
      name: "Snapchat",
      type: "oauth",
      clientId: authClientId,
      clientSecret: authSecret,
      checks: "state",
      authorization: {
        url: "https://accounts.snapchat.com/login/oauth2/authorize",
        params: {
          client_id: authClientId,
          redirect_uri: authRedirectUri,
          response_type: "code",
          scope: "snapchat-marketing-api",
        },
      },
      token: {
        url: "https://accounts.snapchat.com/login/oauth2/access_token",
      },
      userinfo: "https://adsapi.snapchat.com/v1/me",
      profile(response: Profile) {
        return {
          id: response.me.id || "",
          name: response.me.display_name || "",
          email: response.me.email || "",
        };
      },
      style: {
        logo: "https://accounts.snapchat.com/accounts/static/images/ghost/snapchat-app-icon.svg",
        logoDark:
          "https://accounts.snapchat.com/accounts/static/images/ghost/snapchat-app-icon.svg",
        bg: "#fffc00",
        text: "#16191c",
        bgDark: "#fffc00",
        textDark: "#16191c",
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token && account?.refresh_token) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
      }
      return token;
    },
  },
};
export default NextAuth(authOptions);
