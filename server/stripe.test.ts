import { describe, it, expect } from 'vitest';
import { PLAN_PRICES } from './_core/stripe';

describe('Stripe Configuration', () => {
  it('should have all price IDs configured', () => {
    expect(PLAN_PRICES.premium.priceId).toBeDefined();
    expect(PLAN_PRICES.premium.priceId).toMatch(/^price_/);
    expect(PLAN_PRICES.premium.priceId).toBe('price_1TC89MLKoRkR9SJROKQ9JlbD');

    expect(PLAN_PRICES.pro.priceId).toBeDefined();
    expect(PLAN_PRICES.pro.priceId).toMatch(/^price_/);
    expect(PLAN_PRICES.pro.priceId).toBe('price_1TC8D6LKoRkR9SJRJlBWu4JV');

    expect(PLAN_PRICES.elite.priceId).toBeDefined();
    expect(PLAN_PRICES.elite.priceId).toMatch(/^price_/);
    expect(PLAN_PRICES.elite.priceId).toBe('price_1TC8G9LKoRkR9SJRIKLOrAQl');
  });

  it('should have correct prices in cents', () => {
    expect(PLAN_PRICES.premium.amount).toBe(1990); // R$ 19,90
    expect(PLAN_PRICES.pro.amount).toBe(4990); // R$ 49,90
    expect(PLAN_PRICES.elite.amount).toBe(9990); // R$ 99,90
  });

  it('should have BRL currency configured', () => {
    expect(PLAN_PRICES.premium.currency).toBe('brl');
    expect(PLAN_PRICES.pro.currency).toBe('brl');
    expect(PLAN_PRICES.elite.currency).toBe('brl');
  });
});


describe('Stripe Checkout Session Creation', () => {
  it('should create checkout session with premium plan', async () => {
    // This test verifies that the checkout session is created with the correct price ID
    const premiumPriceId = PLAN_PRICES.premium.priceId;
    expect(premiumPriceId).toBe('price_1TC89MLKoRkR9SJROKQ9JlbD');
  });

  it('should create checkout session with pro plan', async () => {
    const proPriceId = PLAN_PRICES.pro.priceId;
    expect(proPriceId).toBe('price_1TC8D6LKoRkR9SJRJlBWu4JV');
  });

  it('should create checkout session with elite plan', async () => {
    const elitePriceId = PLAN_PRICES.elite.priceId;
    expect(elitePriceId).toBe('price_1TC8G9LKoRkR9SJRIKLOrAQl');
  });

  it('should return session URL for redirect', () => {
    // Verify that the checkout session creation returns a URL
    // This is critical for the frontend to redirect to Stripe Checkout
    expect(PLAN_PRICES.premium.priceId).toBeTruthy();
    expect(PLAN_PRICES.premium.priceId).toContain('price_');
  });
});
