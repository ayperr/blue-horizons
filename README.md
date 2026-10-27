# Blue Horizons

A JetBlue-inspired destination explorer and trip planner. Built with Next.js, React, TypeScript, and a real geographic map. No API keys are required to use the first version.

[Open in Vercel](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fayperr%2Fblue-horizons)

## What works

- Explore 12 destinations from four departure airports, with mood and text filters.
- Interactive map using real airport coordinates; route lines appear only for seven sourced JetBlue route examples.
- Published flight-duration examples with source links, effective periods, and the date checked. Missing values are never estimated or inferred.
- Save up to three destinations and compare their editorial highlights.
- Select travel dates and adult count; open destination-aware Airbnb and Booking.com searches.
- Open Hertz, Enterprise, and SIXT to complete a rental-car search.
- Open an Uber airport-to-city-center route or the Lyft rider page. Service is subject to local provider coverage.
- Save a trip locally, share its link, and download a text itinerary.
- Responsive layout, keyboard-accessible controls, native focus-trapping dialogs, and reduced-motion support.

## Run locally

Use Node.js 22 or later and pnpm 11.25:

```sh
corepack enable
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000. Validation commands:

```sh
pnpm typecheck
pnpm test
pnpm build
```

## Deploy on Vercel

Import `ayperr/blue-horizons` as a new Vercel project. Leave the framework set to **Next.js** and the root directory at the repository root. Use the default install/build settings. No environment variables are needed. Click Deploy. Subsequent pushes to `main` can trigger deployments through Vercel's GitHub connection.

## Real data and its limits

Airport data is a checked-in subset of [OurAirports](https://ourairports.com/data/), released into the public domain. Refresh it with `pnpm refresh:airports`. The file records its source and retrieval timestamp.

Map geography uses [World Atlas](https://github.com/topojson/world-atlas), based on public-domain Natural Earth geography. Software dependencies retain their own licenses.

The destination catalogue uses [JetBlue's destination listings](https://www.jetblue.com/en/find-flights) as a reference. It does not imply a nonstop route from every origin.

`lib/routes.ts` contains seven manually reviewed route examples from [FlightMapper](https://info.flightmapper.net/) and [Flight.info](https://www.flight.info/), checked October 27, 2026. Each record retains its source, flight number, duration, and effective period. These are public schedule references, **not live availability for the user's selected dates**. The under-four-hour filter and duration sort use only these records. Unverified route durations are absent. No fares are displayed. Review and update snapshots before relying on them for travel.

Destination prose, suggested trip lengths, and neighborhood ideas are original editorial suggestions. Destination photographs are drawn from the corresponding Wikipedia articles and linked to their original Wikimedia Commons file pages for attribution and licensing. The hero uses editorial ocean imagery from Unsplash. Images are not evidence of current destination conditions or accommodation listings. See the in-app Data & travel notes panel.

Stay links carry the chosen destination, dates, and adult count. Provider websites may change their URL conventions or require sign-in. Rental-car links deliberately open provider homepages; dates and airport must be entered there. Uber's route points to city center, not a hotel, and must be reviewed before requesting a ride. Lyft opens its rider page for manual pickup/destination entry. No ride is requested or scheduled by this site. No affiliate partnership is claimed.

## Optional future live integrations

Server adapters exist for Aviationstack outbound schedules and Booking.com hotel inventory, but the first-version UI uses public reference data and provider links. Both adapters remain disabled by default, return explicit `not_configured` results, and are never automatically called by the interface.

Use `.env.example` as a private configuration guide only after obtaining the correct provider account, plan, and contract. Keys stay on the server and must never use `NEXT_PUBLIC_` variables. Booking.com defaults to its sandbox and test inventory is labeled separately. No account has been purchased or connected.

Before exposing enabled live adapters publicly, apply a persistent shared rate limiter or Vercel WAF rules and provider-side spend limits. The built-in 20-request per-service budget is per process and is not a global spending cap across serverless instances. Verify JetBlue coverage, future schedule range, pagination, Booking.com account permissions, and production API responses with your accounts. The schedule adapter reads one airport-board response and reports incomplete coverage rather than claiming that missing flights do not exist. These adapters have fixture tests; they have not been verified against paid live accounts.

## Privacy

The shortlist and saved trip use browser local storage. Share links include departure airport, destination, dates, adult count, and residence country. Downloaded plans stay on the user's device. External providers receive search details when opened. There are no accounts, payments, passenger details, or analytics in this app.

## Independence

An independent portfolio concept. Not affiliated with JetBlue, Airbnb, Booking.com, Hertz, Enterprise, SIXT, Uber, or Lyft. All transactions happen directly with providers. Nothing is booked by Blue Horizons.
