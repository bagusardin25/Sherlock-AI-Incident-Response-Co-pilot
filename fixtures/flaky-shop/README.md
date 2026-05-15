# flaky-shop

A simple e-commerce checkout service built with TypeScript and Express.

## Setup

```bash
npm install
npm run dev
```

## Architecture

```
src/
├── cart/
│   └── checkout.ts    # Checkout flow & inventory management
└── inventory/
    └── service.ts     # Inventory data layer
```

## Known Issues

- Intermittent `TypeError: Cannot read property 'quantity' of undefined` during high-traffic checkout
- Occurs randomly under concurrent requests
- First reported after async refactor (commit 8f3ab21)
