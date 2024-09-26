import { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier";
import { Hono } from "hono";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { JwtPayload } from "aws-jwt-verify/jwt-model";
import OpenAI from "openai";
export type ApplicationEnv = {
    Variables: {
        jwtVerifier: CognitoJwtVerifierSingleUserPool<{
            userPoolId: string;
            region: string;
            tokenUse: "id";
            clientId: string;
        }>
        jwtPayload: JwtPayload
        openAI: OpenAI
    }
    Bindings: {
        COGNITO_USER_POOL_ID: string
        COGNITO_REGION: string
        COGNITO_CLIENT_ID: string
        OPENAI_API_KEY: string
    }
}

export const createHono = () => {
    const app = new Hono<ApplicationEnv>()
    app.use(async (c, next) => {
        const verifier = CognitoJwtVerifier.create({
            userPoolId: c.env.COGNITO_USER_POOL_ID,
            region: c.env.COGNITO_REGION,
            tokenUse: "id",
            clientId: c.env.COGNITO_CLIENT_ID,
        });
        c.set('jwtVerifier', verifier)
        c.set('openAI', new OpenAI({
            apiKey: c.env.OPENAI_API_KEY
        }))
        await next()
    })
    return app
}
