import * as q from "faunadb";
import { getSession } from "next-auth/react";
import { NextApiRequest, NextApiResponse } from "next";

import { stripe } from "../../services/stripe";
import { fauna } from "../../services/fauna";

type User = {
  ref: {
    id: string
  },
  data: {
    stripe_costumer_id: string
  }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") { //aceita apenas requisições do tipo post
    const session = await getSession({ req }) //cookies podem ser acessados tando do lado do cliente quanto servidor

    const user = await fauna.query<User>(
      q.Get(
        q.Match(
          q.Index('user_by_email'),
          q.Casefold(session.user.email)
        )
      )
    )

    let costumerId = user.data.stripe_costumer_id;

    if (!costumerId) {
      const stripeCostumer = await stripe.customers.create({
        email: session.user.email,
        // metadata:
      })

      await fauna.query(
        q.Update(
          q.Ref(q.Collection('Users'), user.ref.id),
          {
            data: {
              stripe_costumer_id: stripeCostumer.id
            }
          }
        )
      )

      costumerId = stripeCostumer.id
    }


    const stripeCheckoutSession = await stripe.checkout.sessions.create({
      customer: costumerId, // id do user NO STRIPE, não do banco de dados do fauna
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        { price: 'price_1MW0TICrJoALHQgffiX3sXJB', quantity: 1 }
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL
    })

    return res.status(200).json({ sessionId: stripeCheckoutSession.id })
  } else {
    res.setHeader('Allow', 'POST') //retorna para o front que o método que a requisição aceita é o post
    res.status(405).end('Method Not Allowed')
  }
}