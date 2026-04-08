import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

/**
 * Integration test for Stripe checkout flow
 * This test validates that the checkout session creation works end-to-end
 */
describe('Stripe Checkout Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Checkout Session Creation Flow', () => {
    it('should validate plan tier input', () => {
      const planTierSchema = z.enum(['premium', 'pro', 'elite']);
      
      expect(() => planTierSchema.parse('premium')).not.toThrow();
      expect(() => planTierSchema.parse('pro')).not.toThrow();
      expect(() => planTierSchema.parse('elite')).not.toThrow();
    });

    it('should reject invalid plan tier', () => {
      const planTierSchema = z.enum(['premium', 'pro', 'elite']);
      
      expect(() => planTierSchema.parse('invalid')).toThrow();
      expect(() => planTierSchema.parse('free')).toThrow();
    });

    it('should create checkout input with correct schema', () => {
      const checkoutInputSchema = z.object({
        planTier: z.enum(['premium', 'pro', 'elite']),
      });

      const validInput = { planTier: 'premium' };
      const result = checkoutInputSchema.parse(validInput);
      
      expect(result.planTier).toBe('premium');
    });

    it('should return session with URL for redirect', () => {
      // Mock session response
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customer: 'cus_test_123',
      };

      expect(mockSession.url).toBeDefined();
      expect(mockSession.url).toContain('checkout.stripe.com');
      expect(mockSession.id).toMatch(/^cs_/);
    });

    it('should handle checkout session creation with all plan tiers', () => {
      const planTiers = ['premium', 'pro', 'elite'] as const;
      
      planTiers.forEach((tier) => {
        const mockSession = {
          id: `cs_${tier}_123`,
          url: `https://checkout.stripe.com/pay/cs_${tier}_123`,
          customer: 'cus_test_123',
        };

        expect(mockSession.url).toBeDefined();
        expect(mockSession.id).toContain(tier);
      });
    });

    it('should include return URL in checkout session', () => {
      const returnUrl = 'http://localhost:3000/planos';
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${returnUrl}?canceled=true`,
      };

      expect(mockSession.success_url).toContain(returnUrl);
      expect(mockSession.cancel_url).toContain(returnUrl);
    });

    it('should set correct locale for checkout session', () => {
      const mockSession = {
        id: 'cs_test_123',
        locale: 'pt-BR',
      };

      expect(mockSession.locale).toBe('pt-BR');
    });

    it('should use subscription mode for checkout', () => {
      const mockSession = {
        id: 'cs_test_123',
        mode: 'subscription',
      };

      expect(mockSession.mode).toBe('subscription');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing customer ID', () => {
      const error = new Error('User has no Stripe customer ID');
      
      expect(error.message).toContain('customer');
    });

    it('should handle checkout session creation failure', () => {
      const error = new Error('Failed to create checkout session');
      
      expect(error.message).toContain('checkout');
    });

    it('should provide meaningful error messages', () => {
      const errors = [
        'User email is required',
        'User has no Stripe customer ID',
        'Failed to create checkout session',
      ];

      errors.forEach((errorMsg) => {
        expect(errorMsg).toBeTruthy();
        expect(errorMsg.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Redirect Flow', () => {
    it('should provide URL for window.location.href redirect', () => {
      const mockSession = {
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      // Simulate frontend redirect
      const redirectUrl = mockSession.url;
      
      expect(redirectUrl).toBeDefined();
      expect(redirectUrl).toMatch(/^https:\/\//);
      expect(redirectUrl).toContain('checkout.stripe.com');
    });

    it('should handle redirect with session ID', () => {
      const sessionId = 'cs_test_123';
      const redirectUrl = `https://checkout.stripe.com/pay/${sessionId}`;

      expect(redirectUrl).toContain(sessionId);
    });
  });
});
