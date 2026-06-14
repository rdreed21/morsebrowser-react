Complete Steps — Final Working Version
Download the latest setup.sh above before starting. It has all fixes baked in.

Phase 0 — Scaffold
bashcd ~/Documents/GitHub     # or wherever you keep projects
chmod +x setup.sh
./setup.sh
cd morsebrowser-react

Phase 1 — Install root workspace
bashnpm install
No errors. Mobile is excluded from the workspace intentionally.

Phase 2 — Verify core works
bashcd packages/core
npm install
npx jest
Expected: Tests: 17 passed. If green, the timing engine is correct. Then go back to root:
bashcd ../..

Phase 3 — Install mobile
Mobile uses file: references for local packages and its own .npmrc to stay isolated. Run these in order — all three steps matter:
bashcd apps/mobile

# Step 1 — bootstrap expo so SDK version is known
npm install expo@~56.0.0 --legacy-peer-deps

# Step 2 — let expo install all compatible versions
npx expo install

cd ../..
If npx expo install hits peer dep errors, add the flag through:
bashnpx expo install -- --legacy-peer-deps

Phase 4 — Audit Agent (runs alone, others wait on this)
Check out your fork locally and open Claude Code there:
bashcd ~/path/to/morsebrowser_dev
git checkout develop
claude
Paste the Agent 1 prompt from AGENT_PROMPTS.md. It reads your KO source and produces COMPONENT_MAP.md. When done, copy that file into morsebrowser-react/ at the root.

Phase 5 — Three agents in parallel
Open three terminal tabs after COMPONENT_MAP.md exists:
bash# Tab 1 — Core Engine
cd morsebrowser-react/packages/core
claude    # paste Agent 2 prompt

# Tab 2 — Web UI  (or open this folder in Cursor)
cd morsebrowser-react/apps/web
claude    # paste Agent 3 prompt

# Tab 3 — Mobile (start after web is stable)
cd morsebrowser-react/apps/mobile
claude    # paste Agent 4 prompt

Phase 6 — Web dev server
bashcd morsebrowser-react
npx turbo dev --filter=web
# Opens at http://localhost:5173

Phase 7 — Visual diff loop (Agent 3 runs after each component)
bash# Terminal A — serve your KO fork locally
cd ~/path/to/morsebrowser_dev
npx serve dist -p 3001

# Terminal B — run the diff
cd morsebrowser-react
npm install -D playwright pixelmatch pngjs
npx playwright install chromium
node tools/visual-diff.mjs
Green = keep building. Red = fix before next component.

Phase 8 — Mobile real device test
bashcd morsebrowser-react/apps/mobile
eas build --platform ios --profile preview
Install on your iPhone. Lock the screen mid-sequence. Audio must keep playing. Do not use Simulator — background audio does not work there.

Quick Command Reference
WhatCommandWeb dev servernpx turbo dev --filter=webCore testscd packages/core && npx jestType check allnpx turbo typecheckVisual diffnode tools/visual-diff.mjsMobile buildcd apps/mobile && eas build --platform ios --profile previewMobile dev startcd apps/mobile && npx expo start --ios