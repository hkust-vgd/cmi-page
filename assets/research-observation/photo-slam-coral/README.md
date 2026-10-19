# Photo-SLAM coral scene (baseline)

Gaussian-splat map shown in the Photo-SLAM panel of `research-observation.html`. Visitors can pick either coral and see
it on its own.

| File | Contents |
|---|---|
| `scene.json` | Up axis (seabed normal), whole-scene camera, hint text, the parts in load order, and the objects visitors can pick: each object lists its parts and the camera that frames it. |
| `seabed.ply` | Every splat that belongs to neither coral |
| `coral-1.ply`, `coral-2.ply` | Splats that belong to one coral only |
| `shared-1-2.ply` | 129 splats that both coral files contain; shown with either coral |

Made from the lab's baseline map `coral-guo.ply` (27,086 Gaussians) and its two coral segments `coral-guo-1.ply`
(9,747) and `coral-guo-2.ply` (3,521), which are exact subsets of it. Each splat is stored once, so the whole scene is
the original map, and each coral shown on its own is exactly its segment file. The view-dependent colour terms
(`f_rest_*`) are dropped to keep the download small (1.5 MB in total); the page renders base colours.

The split is made with `split_from_parts.py`, kept with the page generators outside this repository. To update, rerun it
with the new files (bump `VERSION` there and the `?v=` of `SPLAT_SRC` in `observation_page.py`), or point `SPLAT_SRC`
at a single `.ply`, `.splat` or `.ksplat` file.
