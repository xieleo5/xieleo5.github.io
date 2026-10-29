# Yuqi Xie homepage

Homepage: https://xieleo5.github.io/ . `master` holds this source and the ready-to-serve `dist/`; GitHub Pages serves the `gh-pages` branch. The former Gatsby homepage is preserved on `legacy-homepage-2026-10-27`. Local preview: `python3 -m http.server 4173 --directory dist`.

The core page is static HTML and CSS; optional Pokémon interactions use `dist/pokemon.js`. All 14 papers and all 234 author entries are visible without JavaScript, filtering, truncation, or expansion controls.

Edit `homepage.template.html` for the profile and page structure, `dist/publications.json` for paper records, and `dist/style.css` for layout. Run `python3 render-homepage.py` after editing the template or records. Author metadata was checked against the official arXiv and PMLR pages; original metadata is in `paper-metadata.json`. Figures and fonts are documented in `asset-sources.json`.

Typography follows the supplied Haoru Xue reference: Inter name and section headings, Lato 17.6px body, titles, author lists, and venue/link rows. Publication imagery occupies 38% of the desktop row. Author lists remain complete on narrow screens.

The Pokémon cabinet and arcade are optional. `pokemon-roster.json` is the canonical 60-Pokémon bilingual roster; `dist/pokemon.js` renders the cabinet and official Pokémon Center search links and preserves the existing `yuqi-field-notes-v2` localStorage progress. The matching roster fixture is `pokemon-roster.json`. The Poké Ball opens Guess who?, Great Ball opens Pick & place, and Master Ball opens Pokémon battle. Three Poké Balls form a divider between the introduction and Publications; each opens its game in a modal. Opening any game reveals a compact cabinet above Publications, with silhouettes for uncollected Pokémon. That visibility preference is saved as `yuqi-arcade-shelf-visible`.

The inline shelf's Collapse / Expand button keeps its heading and collection count visible while hiding the cabinet and introduction. It remembers the choice in `yuqi-arcade-shelf-collapsed`, separately from collection progress and shelf visibility; opening a game does not override that choice.

`dist/arcade.js` provides three freely selectable games: Franka pick and place, Pokémon Showdown National Dex battles, and a silhouette quiz. The quiz accepts Chinese and case-insensitive English names, whitespace, and configured aliases. Each unresolved question has a 10-second deadline, then automatically advances without awarding a collectible. Correct answers stop the clock and collect the Pokémon. Only the original 24 Pokémon (through Scizor) appear in the quiz deck and physics bin; uncollected starters are prioritized. Each has `acquisition: "starter"`; all other/new entries default to `"challenge"`. `dist/collection-rules.mjs` also guards awards by game mode. Existing saved collections are preserved. All modes share the existing collection progress.

`dist/pick-place.js` lazy-loads local Three.js 0.180.0 and the official single-threaded **MuJoCo 3.17.0 WASM** build only when opening the 3D game. The loading overlay uses one monotonic overall progress bar: engine download 0–65%, engine startup 65–70%, robot model 70–90%, images 90–97%, scene setup 98–100%. Downloads use received bytes within their allocated range; unknown lengths hold the current percentage until completion. Status text changes beneath the bar without resetting it. Controls enable only after setup; in-flight and completed downloads are shared when reopening the game. The WASM binary is about 10 MB; the single-threaded build works on GitHub Pages without cross-origin-isolation headers. `dist/pick-place-world.mjs` simulates 18 free rigid blocks and the articulated Panda arm at a fixed 500 Hz, using implicit integration, Newton contact solving and elliptic friction cones. The model includes the Menagerie arm inertias, joint/actuator force limits, full-arm collision meshes, finger meshes and fingertip pads. The IK controller supplies bounded joint targets; finite-force joint servos and contacts determine the actual motion. Rendered links, fingers, blocks and the wrist camera all follow that simulated state.

Grasps are physical bilateral finger contacts with friction: there is no grab constraint, magnetic attachment, object pose write or collision-mask exception on release. The UI reports bilateral contact, which does not guarantee a secure grasp if the fingers only catch an edge. Block spacing accommodates the full-size fingers; the bin still contains two stacked layers. A reward requires a released/unheld block to settle on the destination floor for 0.65 seconds. This remains a rigid-body gameplay model, not a calibrated digital twin: soft contact penetration and slip are possible, and it does not simulate deformable plushes, tactile sensing or hardware control. The bench, bins and blocks use exact box collision geometry; robot mesh collisions use the upstream convex approximations.

The side view and wrist camera render simultaneously. Arrow keys move in the horizontal plane, W/S raise/lower, A/D rotate, and Space opens/closes the gripper. The scene accepts no mouse steering. On-screen press-and-hold controls provide a mobile D-pad, height and rotation buttons, and a gripper toggle. Releasing a button, losing pointer capture, blur or hiding the page clears motion. New bin rebuilds the simulation and frees the old WASM model/data without resetting collection progress.

Run `npm ci` then `python3 build-assets/prepare-mujoco.py` to rebuild the vendored engine and physics assets. The script pins MuJoCo 3.17.0 and Menagerie commit `71f066ad0be9cd271f7ed58c030243ef157af9f4`; the manifest records the collision assets. `build-assets/prepare-franka.py` packs the corresponding visual meshes. Apache-2.0 licenses and attribution are included under `dist/assets/franka/` and `dist/vendor/mujoco/`.

Run `npm run test:physics` for gravity/floor support, no remote grabs, friction-only lift/transfer/release at 30/60/120 Hz, 90-degree rotation with a 15-second stationary hold, friction-zero slip, visual/collision pose alignment, wall/floor blocking, reward uniqueness, continuous/reversed rotation, joint bounds, and 18-body contact stress. The end-to-end test also drives the same controller as the keyboard to pick a block from the real pile, turn, transfer and release it. Tests bound robot/obstacle penetration below 1 mm in the tested blocked-motion cases and transient block/drop impact penetration below 4 mm; these are regression bounds, not universal guarantees.

Run `node arcade-checks.mjs` for all 60 bilingual answers. No external CDN is required to run the checked-in page. After changing battle sources, run `npm ci` and `npm run build:battle`; the simulator loads only when a battle starts.

The former website remains on the legacy branch. Only the chosen profile photo is included; local reference photos and QA screenshots are not published.

Pokémon decorations have been removed from the profile, portrait, publication heading, and paper link rows. Only the game divider and game collection features remain.

All 60 Pokémon use non-pixel artwork from PokéAPI: Champions menu icons where available, followed by Scarlet/Violet or Brilliant Diamond/Shining Pearl icons. Vanillite and Ferrothorn use full-body HOME artwork; Spheal retains its Legends: Arceus icon and shiny Rayquaza its Legends: Z-A menu portrait. Ponyta uses a full-body Brilliant Diamond/Shining Pearl icon. Exact sources are documented in asset-sources.json. Original source PNGs are retained unchanged under dist/assets/menu-icons/. Collection alignment uses each image’s alpha bounds; the 3D block textures use smooth filtering.


## National Dex battle game

`dist/showdown-game.js` supplies the battle UI; `battle-src/engine.mjs` uses the real `@pkmn/sim` 0.10.11 Showdown simulator in a lazy-loaded Web Worker. `build-assets/build-battle.mjs` bundles it with esbuild (keepNames is required by Showdown serialization). `battle-presets.json` contains a curated set for every one of the 60 species. Level adjustment is 50, including Pokémon whose legal acquisition level is higher. The National Dex validator checks moves, abilities, EVs, items and combinations. Cosmog has only Splash and Teleport; Ditto has Transform plus Imposter. Mega Evolution and Primal Reversion are supported; Tera and Dynamax are disabled for this custom shelf format.

Tier data is pinned to the upstream Pokémon Showdown commit recorded in `dist/battle-roster.json`, resolved from the preset's actual Mega/Primal/Crowned form. Same-tier and higher opponents only; AG currently includes Mega Rayquaza and Koraidon. LC and NFE are treated as introductory ranks below usage tiers, rather than claiming they form an official linear ladder. The Dondozo/Tatsugiri combination is an explicit game-only OU override; original species tiers are retained in `sourceTier`.

Either Commander species triggers doubles and provides the other as a temporary partner. If the enemy is the duo, the player's second partner comes from their shelf (a mirror is the fallback if they own only one Pokémon). Other enemy partners must meet the same tier floor; the player’s second partner cannot exceed their selected partner’s tier. Tatsugiri's Curly, Droopy and Stretchy forms can be chosen for either side and produce the engine's Attack/Defense/Speed Order Up boosts. All three display forms become available after collecting Tatsugiri; the cabinet stores the selected form in `yuqi-tatsugiri-form` without changing the original collection keys/count. The battle lobby also allows choosing the player's Tatsugiri form.

The bot scores simulated candidate turns against several opposing replies, weighting mean and worst-case outcomes. It plans before receiving the player's move and runs independent RNG samples in isolated serialized copies. It is a bounded heuristic opponent, not a trained competitive agent. The game has no online ladder or Showdown account connection. Only victories collect opponents; loss, draw, closing the modal and exiting to partner selection do not. A 100-turn cap ends long stalls as a draw.

`node battle-checks.mjs` validates every preset, tier/ownership restrictions, three Commander forms and Order Up boosts, non-mutating AI search, 60 full battles, HP bounds and victory-only reward IDs. `node battle-bundle-checks.mjs` smoke-tests the actual minified worker artifact. MIT engine attribution is in `dist/vendor/showdown-LICENSE.txt`; tier/engine source links are also available in the game.


## Adding a Pokémon

Copy `pokemon-additions/espeon.json` and edit its species/name, Chinese name, aliases and preset. Then run:

```sh
npm run pokemon:add -- pokemon-additions/your-pokemon.json
```

That single command validates the set, forces level 50, downloads an available non-pixel PokéAPI menu icon, updates the canonical roster and presets, calculates transparent-padding offsets, renders the homepage, rebuilds National Dex data and the worker, runs gameplay checks, and prepares front/back battle media. Reusing an ID updates it without duplicating the cabinet slot. For a regional form, specify `assetId` with its PokéAPI form ID; for a Mega/Primal preset, include `preset.form` and `preset.mega` when applicable. `preset.plan` explains the set. The tool never publishes or resets localStorage.

To edit existing data manually, change `pokemon-roster.json` and `battle-presets.json`, then run `npm run pokemon:sync`, `npm run build:battle`, and `npm run test:battle`. Do not edit the generated roster inside `dist/pokemon.js` or the generated `battle-src/presets.mjs`.

The battle view now embeds the actual Showdown battle renderer in the isolated local `dist/ps-window/index.html` frame. `battle-src/ps-window.mjs` adapts its data/media to our local engine and PokéAPI front/back GIFs; the official statbars, positioning and battle log are reused. Sound is off and turn playback jumps to the resolved state (animated Pokémon sprites still play). This is a local opponent, with no PS login, public server or online matchmaking. The displayed window is not an iframe of the public Showdown server. Opponents remain silhouettes in the cabinet picker and throughout battle, with mystery names; winning reveals them. The collection cabinet provides a Challenge button that preselects its slot in the battle lobby. Source modules retain their MIT/CC0 notices; battle CSS retains GPLv2 attribution. The adapter and modified CSS are included as source in this project.


## Choose a challenge and edit builds

The battle lobby offers every eligible opponent explicitly, including a Tatsugiri-form selector for the Commander encounter. The tier floor uses the player's saved set and its actual Mega-capable, Primal or Crowned form. `battle-src/sets.mjs` validates moves, ability, item, nature, EVs and IVs through Showdown and recomputes the tier. Player sets always run at level 50 and are stored separately in `yuqi-battle-sets-v1`. The editor supports 1–4 distinct legal moves, EVs up to 252 per stat / 510 total, and IVs 0–31. It preserves the shelf species, including Teal Mask Ogerpon, and Commander for the duo. Z-Moves, Tera and Dynamax are outside this game's supported controls.

AI picks a complete fixed build before the match: `battle-ai-presets.json` currently has 119 variants (two per species except Cosmog). `dist/battle-ai-sets.json` includes provenance from September 2026 Smogon National Dex OU, Ubers, UU, doubles and AG usage. Usage reports individual move/item/ability/spread frequencies rather than observed joint sets; variants are curated coherent duel builds. Low-evidence variants are explicitly marked as curated fallbacks. The compact source evidence is in `build-assets/stats/shelf-usage-2026-09.json`.

`npm run build:battle` rebuilds the editor catalog, runtime AI variants, tier data and worker offline. Refresh usage evidence with `node build-assets/build-ai-sets.mjs --refresh 2026-09`; changing the month does not automatically invent new sets. New Pokémon default to challenge-only and use their canonical preset if no AI variant is supplied. Add extra full variants to `battle-ai-presets.json[id]`, preserving the opponent's form/tier. Existing starter acquisition is preserved when updating a species with the add command; use an explicit `acquisition` field to change it intentionally.

`node challenge-checks.mjs` checks starter-only rewards, every directed opponent, custom tier changes, invalid configurations, applied player/AI loadouts, Commander invariants and ally-targeted moves. `npm run test:battle` includes these checks plus complete engine battles and bundled worker smoke tests.

The current homepage portrait uses the supplied `52362.JPG` as `dist/assets/portrait-with-cat.jpg`. CSS applies a square crop at `object-position: 50% 60%`, retaining both the person and cat heads without changing the source pixels.

The arcade menu and tabs follow Guess who? → Pick & place → Battle. Both the collection-cabinet shortcut and the battle lobby select the target silhouette first, then show only available collected partners based on their saved build tiers. No partner is auto-selected. Editing a build recalculates availability and disables battle if it exceeds the target tier, without changing the chosen target.

## Publish to GitHub Pages

After validating and committing your changes on `master`, run `git push origin master` and `python3 tools/publish-pages.py`. The publisher makes a fast-forward commit on `gh-pages` containing exactly the committed `dist/` tree. It never force-pushes. GitHub Pages builds automatically from the existing `gh-pages` source. Collection progress stays in each visitor’s browser and is separate from localhost progress.


## Home cats

Yuqi's real cats live beside the Pokémon, not inside the roster: `homeCats` in `dist/pokemon.js` keeps them out of battle presets, the 60-Pokémon count and `tools/sync-pokemon.mjs`. Each cat has `acquisition: "home"`, which `dist/collection-rules.mjs` only rewards in Guess who?. They share the `yuqi-field-notes-v2` progress key, appear on their own "Home cats" shelf row, and have their own count: Eevee (blue golden shaded) and Elu (chocolate golden point).

`dist/home-cats.js` draws the cats walking along the bottom of the viewport. Each cat picks weighted activities from its personality: wander, sit, groom, loaf, sleep, play with a yarn ball. Elu is quick and fearless: zoomies, chasing Eevee (sometimes ending in a short scuffle), and walking over when the pointer lingers near the bottom of the page. Eevee is slower, sleeps more, backs away from a nearby pointer and often curls up next to a sleeping Elu. Clicking a cat wakes it up or makes it hop with a heart; Eevee sometimes startles and runs off instead. On touch screens the cats ignore taps so they never block content. With reduced motion they stay loafing in place. The cats play on their own floor: a fixed strip at the bottom of the viewport that fades into the page, with matching page padding so text softly disappears behind them instead of overlapping. The footer’s "Hide my cats" toggle removes the floor too and is saved as `yuqi-home-cats-hidden`.

Generated source art lives in `output/imagegen/` and is not published. Run `python3 build-assets/prepare-home-cats.py` (requires Pillow) to rebuild `dist/assets/menu-icons/cat-*.png` and `dist/assets/home-cats/`. Poses are scaled to a common head size, anchored at the eye, and baseline-aligned.

