// conexão com o servidor stripe
//essa lib do stipe é um sdk, uma biblioteca para lidar diretamente com a api do stripe, sem precisar fazer todas as requisições atravez de hhtp

import Stripe from "stripe";
import { version } from '../../package.json'

export const stripe = new Stripe(
  process.env.STRIPE_API_KEY,
  {
    apiVersion: '2022-11-15',
    appInfo: {
      name: 'Ignews',
      version
    },
  }
)