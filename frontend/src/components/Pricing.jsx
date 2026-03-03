'use client';

import React, { useState } from 'react';
import './Pricing.css';

const plans = [
  {
    name: 'Free',
    badge: 'free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started with OpenClaw',
    features: [
      { text: 'Basic chat with OpenClaw', included: true },
      { text: 'Up to 3 active skills', included: true },
      { text: '100 messages per day', included: true },
      { text: 'Community support', included: true },
      { text: 'Custom agents', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'API access', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    badge: 'pro',
    price: { monthly: 9, yearly: 90 },
    description: 'For power users who want more control',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited skills', included: true },
      { text: 'Unlimited messages', included: true },
      { text: 'Custom agents', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
      { text: 'White-label options', included: false },
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    badge: 'enterprise',
    price: { monthly: 29, yearly: 290 },
    description: 'For teams and businesses',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'API access', included: true },
      { text: 'White-label options', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Team management', included: true },
      { text: 'Audit logs', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const handleSubscribe = (plan) => {
    if (plan.name === 'Free') {
      window.location.href = '/dashboard';
    } else if (plan.name === 'Enterprise') {
      window.location.href = 'mailto:sales@masterclaw.ai';
    } else {
      // Stripe checkout
      console.log('Subscribe to:', plan.name, isYearly ? 'yearly' : 'monthly');
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        <h1>Simple, Transparent Pricing</h1>
        <p className="pricing-subtitle">
          Start free, upgrade when you need more power
        </p>

        <div className="billing-toggle">
          <span className={!isYearly ? 'active' : ''}>Monthly</span>
          <button 
            className={`toggle-switch ${isYearly ? 'yearly' : ''}`}
            onClick={() => setIsYearly(!isYearly)}
          >
            <span className="toggle-knob" />
          </button>
          <span className={isYearly ? 'active' : ''}>Yearly</span>
          {isYearly && (
            <span className="save-badge">Save 17%</span>
          )}
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`pricing-card ${plan.popular ? 'popular' : ''} ${hoveredPlan === plan.name ? 'hovered' : ''}`}
            onMouseEnter={() => setHoveredPlan(plan.name)}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {plan.popular && (
              <div className="popular-badge">Most Popular</div>
            )}

            <div className="plan-header">
              <span className={`plan-badge mc-badge mc-badge-${plan.badge}`}>
                {plan.name}
              </span>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">
                  {isYearly ? Math.round(plan.price.yearly / 12) : plan.price.monthly}
                </span>
                <span className="period">/mo</span>
              </div>
              {isYearly && plan.price.yearly > 0 && (
                <div className="yearly-price">
                  ${plan.price.yearly}/year
                </div>
              )}
              <p className="plan-description">{plan.description}</p>
            </div>

            <ul className="feature-list">
              {plan.features.map((feature, idx) => (
                <li 
                  key={idx}
                  className={feature.included ? 'included' : 'excluded'}
                >
                  <span className="feature-icon">
                    {feature.included ? '✓' : '×'}
                  </span>
                  {feature.text}
                </li>
              ))}
            </ul>

            <button
              className={`mc-btn ${plan.popular ? 'mc-btn-primary' : 'mc-btn-secondary'}`}
              onClick={() => handleSubscribe(plan)}
              style={{ width: '100%', marginTop: 'auto' }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="pricing-faq">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>Can I cancel anytime?</h3>
            <p>Yes, you can cancel your subscription at any time. You'll keep access until the end of your billing period.</p>
          </div>
          
          <div className="faq-item">
            <h3>What happens when I hit the free limit?</h3>
            <p>You'll get a friendly nudge to upgrade. Your existing conversations remain accessible, but you'll need Pro to send more messages.</p>
          </div>
          
          <div className="faq-item">
            <h3>Do you offer refunds?</h3>
            <p>Yes, we offer a 14-day money-back guarantee if you're not satisfied with Pro or Enterprise.</p>
          </div>
          
          <div className="faq-item">
            <h3>How do I connect my OpenClaw?</h3>
            <p>Click the "Connect OpenClaw" button in the dashboard, download the skill folder, and run it. Your agent will appear automatically!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
