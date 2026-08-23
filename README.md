# Fourth Down Fantasy Draft Lab

A model-driven fantasy football draft assistant that combines player projections, positional value, live market pricing, roster construction, depth charts, injury context, and historical validation.

**Live demo:** https://fourth-down-draft-lab.pranav-tandra123.chatgpt.site/

![Fourth Down Fantasy Draft Lab](public/og.png)

## What it does

- Produces an overall draft board for QB, RB, WR, and TE
- Compares model prices with live multi-market ADP
- Adjusts rankings for league size, scoring, superflex, starters, flex spots, bench depth, and TE premium
- Estimates whether a player is likely to remain available at your next pick
- Tracks available, taken, and queued players during a draft
- Analyzes complete rosters and suggests position-aware trade or buy-low targets
- Models player floor, ceiling, confidence, injury risk, depth-chart competition, and high-value usage
- Gives rookies and backups separate priors when a reliable NFL sample is unavailable
- Explains which factors raise or lower every player projection
- Shows player news, historical updates, depth charts, and week-by-week injury-report records
- Backtests the ranking method with leakage-safe walk-forward validation

## Model overview

The ranking engine starts with a confidence-calibrated weekly projection and then converts raw points into **value over replacement**. That prevents high-scoring but replaceable positions—especially quarterback in one-QB leagues and the flat middle tight-end tier—from being drafted too early.

Major inputs include:

- Targets, carries, receptions, routes, and passing volume
- Red-zone and other high-value opportunities
- Target share, air-yard share, WOPR, first-down rate, explosive-play rate, EPA, and CPOE
- Floor, ceiling, role certainty, and projection confidence
- Injury history, missed time, recurrence signals, and current injury designation
- Offensive environment, quarterback context, and depth-chart position
- Positional supply, nearby tier gaps, and league-specific replacement levels
- Live ADP from multiple market sources

Market ADP is a secondary price anchor. The underlying role and value model remains the primary ranking signal.

## Validation

Historical validation uses season-by-season ridge regression:

1. Train coefficients only on an earlier season transition.
2. Freeze those coefficients.
3. Predict the following season.
4. Compare predicted and actual value-over-replacement ranks.

The included validation dataset currently contains 246 out-of-sample player seasons across two test years. The app reports rank correlation, mean absolute rank error, position-specific results, and tight-end calibration. This is a research project—not a guarantee of future performance.

## Data sources

The project uses free or publicly accessible data from:

- [nflverse](https://github.com/nflverse/nflverse-data) for weekly statistics and injury-report history
- [Sleeper](https://docs.sleeper.com/) for player metadata and depth-chart context
- [Fantasy Football Calculator](https://fantasyfootballcalculator.com/) for redraft ADP
- [FantasyCalc](https://fantasycalc.com/) for current redraft market rankings
- ESPN, Google News, Bing News, RotoWire, and other public feeds for player updates when available

Every external feed has a fallback path. Missing data is labeled rather than fabricated.

## Run locally

### Requirements

- Node.js 22.13 or newer
- npm or pnpm

### Setup

```bash
git clone https://github.com/pranavtandra/fourth_down_fantasy.git
cd fourth_down_fantasy
npm install
npm run dev
```

Open the local URL printed in the terminal.

### Production build

```bash
npm run build
```

### Rebuild historical validation

```bash
node scripts/generate-backtest.cjs
```

### Run the tight-end calibration guard

```bash
node scripts/audit-te-ranks.cjs
```

## Optional environment variable

Recent X/Twitter matching can use a read-only X API bearer token:

```bash
X_BEARER_TOKEN=
```

Copy `.env.example` to a local `.env` file and add the token there. Never commit a real token. The rest of the news system continues to work through free public sources when this variable is absent.

## Project structure

```text
app/
  DraftLab.tsx             Main interface and ranking engine
  api/                     Market, news, injury, depth-chart, and model endpoints
  data/backtest.json       Precomputed historical validation results
scripts/
  generate-backtest.cjs    Rebuilds walk-forward validation data
  audit-te-ranks.cjs       Guards against TE positional overvaluation
public/                    Static assets and social preview
worker/                    Cloudflare-compatible worker entry point
```

## Important limitations

- Fantasy projections are probabilistic and can change quickly.
- Injury risk is an availability signal, not medical advice.
- Depth charts and news feeds can be delayed or incomplete.
- ADP varies by platform, contest type, and draft date.
- Rookie and backup projections are less certain because their NFL samples are limited.
- Historical validation does not eliminate overfitting or guarantee future accuracy.

## Disclaimer

This project is for fantasy-football research and entertainment. Use the model as one decision aid, not as certainty or financial advice.
