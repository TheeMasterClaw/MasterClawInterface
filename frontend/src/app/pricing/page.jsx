'use client';

import { useState, useEffect } from 'react';

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with your AI familiar',
    price: { monthly: 0, yearly: 0 },
    features: [
      '50 messages per day',
      '1 calendar connection',
      'Basic avatar',
      'Task management',
      'Community support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Unlock unlimited conversations',
    price: { monthly: 5, yearly: 49 },
    features: [
      'Unlimited messages',
      'Up to 5 calendars',
      'Voice conversations',
      'Custom avatars',
      'Priority responses',
      'Export conversations',
      'Advanced analytics',
      'Email support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and professionals',
    price: { monthly: 19, yearly: 179 },
    features: [
      'Everything in Premium',
      'Unlimited calendars',
      'Team collaboration (5 members)',
      'API access',
      'White-label option',
      'Custom integrations',
      'Dedicated support',
      'Early access to features',
    ],
    cta: 'Go Pro',
    popular: false,
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('free');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch current subscription status
    fetch('/api/billing/status')
      .then(res => res.json())
      .then(data => setCurrentTier(data.tier))
      .catch(console.error);
  }, []);

  const handleSubscribe = async (planId) => {
    if (planId === 'free') {
      window.location.href = '/signup';
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: planId,
          billingPeriod,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const savings = (plan) => {
    if (billingPeriod === 'yearly') {
      const monthlyCost = plan.price.monthly * 12;
      const yearlyCost = plan.price.yearly;
      const saved = monthlyCost - yearlyCost;
      const percent = Math.round((saved / monthlyCost) * 100);
      return { saved, percent };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            Start free and upgrade when you need more power. 
            Your AI familiar grows with you.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="bg-slate-800 rounded-full p-1 flex items-center">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-full transition-all duration-200 ${
                  billingPeriod === 'monthly'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-full transition-all duration-200 flex items-center gap-2 ${
                  billingPeriod === 'yearly'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                  Save 18%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentTier === plan.id;
            const planSavings = savings(plan);
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-2 border-indigo-400 shadow-2xl shadow-indigo-500/25'
                    : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/30">
                      Current Plan
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">
                      ${plan.price[billingPeriod]}
                    </span>
                    <span className="text-slate-400">
                      /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {planSavings && (
                    <p className="text-green-400 text-sm mt-2">
                      Save ${planSavings.saved}/year ({planSavings.percent}% off)
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || isCurrentPlan}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    isCurrentPlan
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-white text-indigo-600 hover:bg-slate-100 shadow-lg'
                      : 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                  } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {loading ? 'Loading...' : isCurrentPlan ? 'Current Plan' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ / Trust Signals */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure SSL encryption
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
