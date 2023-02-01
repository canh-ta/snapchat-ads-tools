import NextAuth, { AuthOptions } from "next-auth";

const redirectUri = process.env.SNAPCHAT_REDIRECT_URI;
const clientId = process.env.SNAPCHAT_CLIENT_ID;
const clientSecret = process.env.SNAPCHAT_CLIENT_SECRET;

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "snapchat",
      name: "Snapchat",
      type: "oauth",
      clientId,
      clientSecret,
      authorization: {
        url: "https://accounts.snapchat.com/login/oauth2/authorize",
        params: {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: "snapchat-marketing-api",
        },
      },
      token: {
        url: "https://accounts.snapchat.com/login/oauth2/access_token",
      },
      userinfo: "https://adsapi.snapchat.com/v1/me",
      profile(me: any) {
        console.log("Profile", me);
        return {
          id: me.id,
          name: me?.display_name,
          email: me?.email,
          image: me?.bitmoji?.avatar_id,
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
};
export default NextAuth(authOptions);
