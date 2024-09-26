import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify, ResourcesConfig } from "aws-amplify";

console.log(import.meta.env);
const amplifyConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID!,
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID!,
      loginWith: {
        username: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
};

Amplify.configure(amplifyConfig);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <Authenticator.Provider>{children}</Authenticator.Provider>;
}
