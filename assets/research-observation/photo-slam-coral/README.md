# Photo-SLAM coral scene (baseline)

Gaussian-splat map shown in the Photo-SLAM panel of `research-observation.html`, split into parts so visitors can
show the coral or the rock on its own.

| File | Contents |
|---|---|
| `scene.json` | Up axis (seabed normal), whole-scene camera, hint text, and the parts in load order. Parts with `"select": true` get a button and can be clicked in the view; their `target`/`camera` frame them when selected. |
| `seabed.ply` | Everything that is not selectable (sand, rubble) |
| `coral.ply`, `rock.ply` | The selectable objects |

Made from `coral-guo.ply` (27,086 Gaussians) with the preprocessing scripts kept alongside the page generators,
outside this repository: `features.py` fits the seabed plane, `segment.py` separates the raised objects (plus one
manual fix-up), `split_scene.py` writes these files. The view-dependent colour terms (`f_rest_*`) are dropped to keep the download small (1.5 MB in total).

To show a new map, either replace these files (same `scene.json` format) or point `SPLAT_SRC` in
`observation_page.py` at a single `.ply`, `.splat` or `.ksplat` file.
