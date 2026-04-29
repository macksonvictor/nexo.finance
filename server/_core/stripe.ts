import Stripe from 'stripe';

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-03-25.dahlia';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient: Stripe | null = null;
type PaidPlanTier = 'premium' | 'pro' | 'elite';

const DEFAULT_PLAN_PRICE_IDS: Record<PaidPlanTier, string> = {
  premium: 'price_1TC89MLKoRkR9SJROKQ9JlbD',
  pro: 'price_1TC8D6LKoRkR9SJRJlBWu4JV',
  elite: 'price_1TC8G9LKoRkR9SJRIKLOrAQl',
};

function getStripeClient() {
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  return stripeClient;
}

/**
 * Plan pricing configuration
 */
export const PLAN_PRICES = {
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID?.trim() || DEFAULT_PLAN_PRICE_IDS.premium,
    productId: process.env.STRIPE_PREMIUM_PRODUCT_ID?.trim(),
    amount: 1990,
    currency: 'brl',
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID?.trim() || DEFAULT_PLAN_PRICE_IDS.pro,
    productId: process.env.STRIPE_PRO_PRODUCT_ID?.trim(),
    amount: 4990,
    currency: 'brl',
  },
  elite: {
    name: 'Elite',
    priceId: process.env.STRIPE_ELITE_PRICE_ID?.trim() || DEFAULT_PLAN_PRICE_IDS.elite,
    productId: process.env.STRIPE_ELITE_PRODUCT_ID?.trim(),
    amount: 9990,
    currency: 'brl',
  },
};

const PLAN_PAYMENT_LINK_ENV_KEYS: Record<PaidPlanTier, string[]> = {
  premium: ['STRIPE_PREMIUM_PAYMENT_LINK', 'VITE_STRIPE_PREMIUM_PAYMENT_LINK'],
  pro: ['STRIPE_PRO_PAYMENT_LINK', 'VITE_STRIPE_PRO_PAYMENT_LINK'],
  elite: ['STRIPE_ELITE_PAYMENT_LINK', 'VITE_STRIPE_ELITE_PAYMENT_LINK'],
};

export function getConfiguredPaymentLink(planTier: PaidPlanTier) {
  const rawLink = PLAN_PAYMENT_LINK_ENV_KEYS[planTier]
    .map((key) => process.env[key]?.trim())
    .find((value): value is string => Boolean(value));

  if (!rawLink) {
    return null;
  }

  try {
    const url = new URL(rawLink);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('invalid protocol');
    }
    return url.toString();
  } catch {
    throw new Error(`STRIPE_SETUP_REQUIRED: invalid payment link for ${planTier}`);
  }
}

function withCheckoutParams(
  returnUrl: string,
  params: Record<string, string>
) {
  const url = new URL(returnUrl);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

/**
 * Create a checkout session for plan upgrade
 */
export async function createCheckoutSession(
  customerId: string,
  planTier: PaidPlanTier,
  returnUrl: string
) {
  const plan = PLAN_PRICES[planTier];
  const stripe = getStripeClient();

  try {
    const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
      currency: plan.currency,
      unit_amount: plan.amount,
      recurring: {
        interval: 'month',
      },
      ...(plan.productId
        ? { product: plan.productId }
        : {
            product_data: {
              name: `NEXO ${plan.name}`,
            },
          }),
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        plan.priceId
          ? {
              price: plan.priceId,
              quantity: 1,
            }
          : {
              price_data: priceData,
              quantity: 1,
            },
      ],
      mode: 'subscription',
      success_url: withCheckoutParams(returnUrl, {
        checkout: 'success',
        session_id: '{CHECKOUT_SESSION_ID}',
      }),
      cancel_url: withCheckoutParams(returnUrl, {
        checkout: 'canceled',
      }),
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
  const stripe = getStripeClient();

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
  const stripe = getStripeClient();

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
  const stripe = getStripeClient();

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
  const stripe = getStripeClient();

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
  const stripe = getStripeClient();

  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw error;
  }
}
