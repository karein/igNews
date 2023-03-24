import * as q from "faunadb"
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

import { fauna } from '../../../services/fauna';

/* execultado na camada de backend */
export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user'
        }
      }
    }),
  ],
  // jwt: {
  //   signingKey: process.env.SIGNING_KEY
  // },
  callbacks: {
    async signIn({ user, account, profile }) {
      const { email } = user;
      console.log('user', user, 'account', account, 'profile', profile, 'email', email);

      /* inserção no banco */
      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('user_by_email'),
                  q.Casefold(user.email)
                )
              )
            ),
            q.Create(
              q.Collection('users'),
              { data: { email } }
            ),
            q.Get( //else
              q.Match(
                q.Index('user_by_email'), //não se pode buscar info no fauna sem o indice 
                q.Casefold(user.email)
              )
            )
          )
        )

        return true

      } catch {
        return false
      }
    },
  }
});