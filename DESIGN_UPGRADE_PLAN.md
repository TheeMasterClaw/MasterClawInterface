# MasterClawInterface Design Upgrade & SaaS Plan

## Current State
- Dashboard with 70+ components
- Dark cyberpunk theme with grid animations
- AgentConnect component exists but needs refinement
- No clear free/paid tier distinction

## Upgrade Goals

### 1. Design System Overhaul
**Current:** Dark gradient with grid animation
**New:** Clean, modern SaaS dashboard
- Professional dark mode (not cyberpunk)
- Consistent spacing and typography
- Smooth micro-interactions
- Responsive design

### 2. OpenClaw Connection Flow
**Add to repo:** `skill/` folder with complete skill code
**UI Components:**
- Connection status indicator (always visible)
- One-click skill download
- QR code for mobile setup
- Connection wizard

### 3. Subscription Tiers

#### Free Tier
- Basic chat with OpenClaw
- 3 active skills
- 100 messages/day
- Community support

#### Pro Tier ($9/month)
- Unlimited skills
- Unlimited messages
- Custom agents
- Priority support
- Advanced analytics

#### Enterprise ($29/month)
- Everything in Pro
- White-label options
- API access
- Dedicated support
- SLA guarantee

### 4. New Components to Add

```
src/
├── components/
│   ├── pricing/
│   │   ├── PricingCard.jsx
│   │   ├── PricingToggle.jsx
│   │   └── FeatureList.jsx
│   ├── connection/
│   │   ├── ConnectionStatus.jsx (always visible)
│   │   ├── ConnectWizard.jsx
│   │   ├── SkillDownload.jsx
│   │   └── QRCodeSetup.jsx
│   └── upgrade/
│       ├── UpgradeBanner.jsx
│       ├── FeatureGate.jsx
│       └── UsageMeter.jsx
├── skill/                    ← NEW: Complete skill code
│   ├── index.js
│   ├── package.json
│   ├── skill.json
│   └── README.md
└── hooks/
    ├── useSubscription.js
    ├── useConnection.js
    └── useUsage.js
```

### 5. Key UI Changes

#### Header Bar
- Logo + "MasterClaw" branding
- Connection status (green/red dot)
- Usage meter (messages used today)
- Upgrade button (if on free tier)
- User avatar/menu

#### Sidebar
- Collapsible sections
- Free vs Pro feature indicators
- Locked features with upgrade prompts

#### Main Content
- Welcome banner (new users)
- Quick connect CTA
- Recent conversations
- Feature showcase

#### Chat Area
- Full-screen chat mode
- Message history
- Agent typing indicator
- File upload (Pro feature)

### 6. Technical Implementation

#### New Dependencies
```json
{
  "stripe": "^14.0.0",
  "qrcode.react": "^3.1.0",
  "react-confetti": "^6.1.0",
  "framer-motion": "^11.0.0"
}
```

#### Backend Additions
- Subscription endpoints
- Usage tracking
- Payment webhooks (Stripe)
- Feature flags

## Implementation Order

1. ✅ Move skill code into repo
2. 🎨 Create new design system (CSS variables)
3. 🔌 Build ConnectionStatus component
4. 💳 Create Pricing page
5. 🔒 Add feature gating
6. 📊 Add usage tracking
7. 🧪 Test complete flow

## Color Palette

```css
:root {
  /* Primary */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  
  /* Background */
  --color-bg: #0f172a;
  --color-bg-elevated: #1e293b;
  --color-bg-card: #334155;
  
  /* Text */
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-text-subtle: #64748b;
  
  /* Accents */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Tiers */
  --color-free: #64748b;
  --color-pro: #8b5cf6;
  --color-enterprise: #f59e0b;
}
```
