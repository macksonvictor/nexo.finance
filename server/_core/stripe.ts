import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
});

/**
 * Plan pricing configuration
 */
export const PLAN_PRICES = {
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    amount: 1990,
    currency: 'brl',
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    amount: 4990,
    currency: 'brl',
  },
  elite: {
    name: 'Elite',
    priceId: process.env.STRIPE_ELITE_PRICE_ID || 'price_elite',
    amount: 9990,
    currency: 'brl',
  },
};

/**
 * Create a checkout session for plan upgrade
 */
export async function createCheckoutSession(
  customerId: string,
  planTier: 'premium' | 'pro' | 'elite',
  returnUrl: string
) {
  const plan = PLAN_PRICES[planTier];

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      locale: 'pt-BR',
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create or retrieve a Stripe customer
 */
export async function getOrCreateCustomer(email: string, name?: string) {
  try {
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    return stripe.customers.create({
      email,
      name: name || email,
    });
  } catch (error) {
    console.error('Error getting or creating customer:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  try {
    return stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Get portal session for customer to manage subscription
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  try {
    return stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
) {
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw error;
  }
}
