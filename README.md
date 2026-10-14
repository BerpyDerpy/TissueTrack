# TissueTrack

Early-warning monitoring for plant tissue cultures. Project notes are in [docs/](docs/).

## Demo dashboard

`web/` is a phone-first dashboard that runs entirely on simulated data. There is no model or backend yet: a seeded simulation in `web/src/sim/` produces the photos, VOC readings, risk scores and alerts.

```sh
cd web
npm install
npm run dev -- --host   # open the printed LAN address on a phone
npm run test            # simulation engine tests
npm run build           # static build in web/dist
```

The demo opens on Day 3 of a 5-day run. Use the play button to advance time and the sliders button for speed, day jumps, and inoculating a vessel on demand. Add `?tick=150` to the URL to open at a specific capture.

Scripted story:

- **T-04** (bacterial, has GC-IMS): flagged "Check soon" on VOC evidence while its photo still looks clean, then "Likely contaminated".
- **J-02** (fungal, camera only): flagged from image change alone, sooner because it shares a media batch with T-04.
- **T-09**: a one-photo condensation spike on Day 3 that the persistence rule ignores.

Thresholds, fusion weights and timings are demo placeholders in `web/src/sim/config.ts`, not measured values.
