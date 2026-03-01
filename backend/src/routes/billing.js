import { Router } from 'express';
import Stripe from 'stripe';
import { getDb, updateDb, genId } from '../db.js';

const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRICE_IDS = {
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
};

/**
 * Get user's subscription status
 * GET /api/billing/status
 */
router.get('/status', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.user?.id || 'anonymous';
    
    // Get or create user record
    if (!db.users) db.users = {};
    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        tier: 'free',
        createdAt: new Date().toISOString(),
        dailyMessageCount: 0,
        lastMessageReset: new Date().toISOString().split('T')[0],
      };
      updateDb();
    }
    
    const user = db.users[userId];
    const limits = getTierLimits(user.tier);
    
    // Reset daily counter if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (user.lastMessageReset !== today) {
      user.dailyMessageCount = 0;
      user.lastMessageReset = today;
      updateDb();
    }
    
    res.json({
      tier: user.tier,
      status: user.subscriptionStatus || 'inactive',
      expiresAt: user.subscriptionExpiresAt,
      usage: {
        messages: {
          used: user.dailyMessageCount || 0,
          limit: limits.dailyMessages,
          remaining: Math.max(0, limits.dailyMessages - (user.dailyMessageCount || 0)),
        },
      },
      features: limits.features,
      limits: {
        calendars: limits.calendars,
        storage: limits.storage,
        apiCalls: limits.apiCalls,
      },
    });
  } catch (error) {
    console.error('Billing status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * Create checkout session for subscription
 * POST /api/billing/checkout
 */
router.post('/checkout', async (req, res) => {
  try {
    const { tier, billingPeriod } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    if (!tier || !['premium', 'pro'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier. Choose premium or pro.' });
    }
    
    if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'Invalid billing period. Choose monthly or yearly.' });
    }
    
    const priceId = PRICE_IDS[tier][billingPeriod];
    if (!priceId) {
      return res.status(400).json({ error: 'Price not configured for this tier/period' });
    }
    
    const db = getDb();
    if (!db.users) db.users = {};
    if (!db.users[userId]) {
      db.users[userId] = {
        id: userId,
        tier: 'free',
        createdAt: new Date().toISOString(),
      };
    }
    
    const user = db.users[userId];
    
    // Create or retrieve Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      updateDb();
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
      subscription_data: {
        metadata: { userId, tier },
      },
    });
    
    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Create customer portal session
 * POST /api/billing/portal
 */
router.post('/portal', async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const db = getDb();
    const user = db.users?.[userId];
    
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: 'No subscription found' });
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/settings/billing`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

/**
 * Stripe webhook handler
 * POST /api/billing/webhook
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
  }
  
  res.json({ received: true });
});

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  
  if (!userId || !tier) return;
  
  const db = getDb();
  if (!db.users) db.users = {};
  if (!db.users[userId]) {
    db.users[userId] = { id: userId };
  }
  
  const user = db.users[userId];
  user.tier = tier;
  user.subscriptionStatus = 'active';
  user.stripeCustomerId = session.customer;
  user.stripeSubscriptionId = session.subscription;
  user.subscriptionStartedAt = new Date().toISOString();
  
  updateDb();
  console.log(`[Billing] User ${userId} upgraded to ${tier}`);
}

async function handlePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  const db = getDb();
  const user = Object.values(db.users || {}).find(
    u => u.stripeSubscriptionId === subscriptionId
  );
  
  if (user) {
    user.lastPaymentAt = new Date().toISOString();
    user.subscriptionStatus = 'active';
    
    // Set expiration to period end
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    user.subscriptionExpiresAt = new Date(subscription.current_period_end * 1000).toISOString();
    
    updateDb();
  }
}

async function handlePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;
  
  const db = getDb();
  const user = Object.values(db.users || {}).find(
    u => u.stripeSubscriptionId === subscriptionId
  );
  
  if (user) {
    user.subscriptionStatus = 'past_due';
    user.lastPaymentFailedAt = new Date().toISOString();
    updateDb();
    
    // TODO: Send notification to user
    console.log(`[Billing] Payment failed for user ${user.id}`);
  }
}

async function handleSubscriptionCancelled(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  
  const db = getDb();
  const user = db.users?.[userId];
  
  if (user) {
    user.tier = 'free';
    user.subscriptionStatus = 'cancelled';
    user.subscriptionCancelledAt = new Date().toISOString();
    user.stripeSubscriptionId = null;
    updateDb();
    
    console.log(`[Billing] User ${userId} cancelled subscription`);
  }
}

async function handleSubscriptionUpdated(subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  
  const db = getDb();
  const user = db.users?.[userId];
  
  if (user) {
    user.subscriptionExpiresAt = new Date(subscription.current_period_end * 1000).toISOString();
    user.subscriptionStatus = subscription.status;
    updateDb();
  }
}

/**
 * Middleware to check subscription tier
 */
export function requireTier(tier) {
  return async (req, res, next) => {
    const userId = req.user?.id || 'anonymous';
    const db = getDb();
    const user = db.users?.[userId];
    
    const tiers = ['free', 'premium', 'pro'];
    const userTierIndex = tiers.indexOf(user?.tier || 'free');
    const requiredTierIndex = tiers.indexOf(tier);
    
    if (userTierIndex < requiredTierIndex) {
      return res.status(403).json({
        error: 'This feature requires a paid subscription',
        requiredTier: tier,
        currentTier: user?.tier || 'free',
        upgradeUrl: '/billing/upgrade',
      });
    }
    
    next();
  };
}

/**
 * Middleware to check message limits for free tier
 */
export async function checkMessageLimit(req, res, next) {
  const userId = req.user?.id || 'anonymous';
  const db = getDb();
  
  if (!db.users) db.users = {};
  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      tier: 'free',
      dailyMessageCount: 0,
      lastMessageReset: new Date().toISOString().split('T')[0],
    };
  }
  
  const user = db.users[userId];
  
  // Premium/Pro users have unlimited messages
  if (user.tier === 'premium' || user.tier === 'pro') {
    return next();
  }
  
  // Reset counter if it's a new day
  const today = new Date().toISOString().split('T')[0];
  if (user.lastMessageReset !== today) {
    user.dailyMessageCount = 0;
    user.lastMessageReset = today;
    updateDb();
  }
  
  // Check free tier limit (50 messages/day)
  if (user.dailyMessageCount >= 50) {
    return res.status(429).json({
      error: 'Daily message limit reached',
      limit: 50,
      used: user.dailyMessageCount,
      resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      upgradeUrl: '/billing/upgrade',
    });
  }
  
  // Increment counter
  user.dailyMessageCount++;
  updateDb();
  
  next();
}

/**
 * Get tier limits and features
 */
function getTierLimits(tier) {
  const limits = {
    free: {
      dailyMessages: 50,
      calendars: 1,
      storage: '100MB',
      apiCalls: 100,
      features: [
        'chat',
        'tasks',
        'basic_avatar',
        'calendar_1',
      ],
    },
    premium: {
      dailyMessages: Infinity,
      calendars: 5,
      storage: '1GB',
      apiCalls: 1000,
      features: [
        'chat',
        'tasks',
        'calendar_multiple',
        'voice',
        'custom_avatar',
        'priority_support',
        'export',
        'advanced_analytics',
      ],
    },
    pro: {
      dailyMessages: Infinity,
      calendars: Infinity,
      storage: '10GB',
      apiCalls: 10000,
      features: [
        'chat',
        'tasks',
        'calendar_multiple',
        'voice',
        'custom_avatar',
        'priority_support',
        'export',
        'advanced_analytics',
        'api_access',
        'team_collaboration',
        'white_label',
        'dedicated_support',
      ],
    },
  };
  
  return limits[tier] || limits.free;
}

export default router;
