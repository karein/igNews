import { Client } from 'faunadb'

export const fauna = new Client({
  secret: process.env.FAUNADB_KEY
})

//http://localhost:3000/api/auth/callback