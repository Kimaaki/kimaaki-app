import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
  }

  // Processar eventos do Stripe
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Atualizar status do pagamento no banco
      try {
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', paymentIntent.id)

        if (error) {
          console.error('Erro ao atualizar pagamento:', error)
        }
      } catch (error) {
        console.error('Erro no webhook:', error)
      }
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      
      try {
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_payment_intent_id', failedPayment.id)

        if (error) {
          console.error('Erro ao atualizar pagamento falhado:', error)
        }
      } catch (error) {
        console.error('Erro no webhook:', error)
      }
      break

    default:
      console.log(`Evento não tratado: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}