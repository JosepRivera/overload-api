---
title: Analytics
description: Volume, personal records, 1RM estimation and progression — computed from your logged sets on every request.
---

Analytics is what separates this API from a training notebook. Every value here is derived from the sets you logged, computed at the moment you ask for it.

**Base path:** `/analytics`
**Authentication:** required on every endpoint

:::note[Nothing here is stored]
No metric is persisted. Ask twice and it is calculated twice. That means correcting a wrong set immediately corrects every number derived from it — there is no cache to invalidate and no stale total to reconcile.
:::

:::caution[Warmup sets are excluded everywhere]
Every endpoint on this page ignores sets flagged `is_warmup: true`. A warmup that was not flagged will inflate your volume and can produce a false personal record.
:::

---

## Personal records

```
GET /analytics/exercises/:exerciseId/prs
```

Returns two records for the exercise, both computed over non-warmup sets:

```json
{
  "data": {
    "weight_pr": 120,
    "volume_pr": 800
  }
}
```

| Field       | Meaning                                                            |
| ----------- | ------------------------------------------------------------------ |
| `weight_pr` | The heaviest single set, regardless of reps                        |
| `volume_pr` | The highest `weight × reps` produced by any one set                 |

Both are `null` when the exercise has no eligible sets yet.

The two answer different questions. `weight_pr` is your strength ceiling. `volume_pr` is your best single working set — `100 kg × 8` beats `120 kg × 1` on volume while losing on weight.

| Status | When                            |
| ------ | ------------------------------- |
| `200`  | Success                         |
| `404`  | Exercise not found or not yours |

---

## Estimated 1RM

```
GET /analytics/exercises/:exerciseId/1rm
```

Estimates the maximum weight you could lift for a single repetition, using the **Epley formula**:

```
1RM = weight × (1 + reps / 30)
```

```json
{
  "data": {
    "exercise_id": "9a1b7d34-…",
    "estimated_1rm": 112.5,
    "based_on": { "weight": 100, "reps": 3 }
  }
}
```

| Field           | Meaning                                                   |
| --------------- | --------------------------------------------------------- |
| `estimated_1rm` | The estimate, rounded to one decimal. `null` if none       |
| `based_on`      | The set that produced it. `null` if none                   |

**Only sets with `reps <= 10` are considered.** Beyond ten repetitions the Epley formula drifts badly, so including those sets would make the estimate worse, not better.

The API picks the set that yields the **highest estimate**, not the heaviest set — those are often different:

| Set          | Estimate |
| ------------ | -------- |
| `90 kg × 3`  | `99.0`   |
| `80 kg × 8`  | `101.3`  |

The second set is lighter but the better predictor, so it wins.

If no set qualifies, `estimated_1rm` and `based_on` are both `null` and the status is still `200`.

| Status | When                            |
| ------ | ------------------------------- |
| `200`  | Success                         |
| `404`  | Exercise not found or not yours |

---

## Progression

```
GET /analytics/exercises/:exerciseId/progression?limit=20
```

Returns one entry per workout session in which the exercise was trained, most recent first.

**Query parameters**

| Parameter | Type    | Default | Range   |
| --------- | ------- | ------- | ------- |
| `limit`   | integer | `20`    | `1`–`100` |

```json
{
  "data": [
    {
      "workout_id": "0e5f2c1a-…",
      "date": "2026-07-31T18:00:00.000Z",
      "total_volume": 1500,
      "avg_weight": 100,
      "avg_reps": 5
    }
  ]
}
```

| Field          | Meaning                                              |
| -------------- | ---------------------------------------------------- |
| `total_volume` | Sum of `weight × reps` for that exercise that session |
| `avg_weight`   | Mean weight across that session's working sets        |
| `avg_reps`     | Mean repetitions across that session's working sets   |
| `date`         | The session's `started_at`                            |

This is the endpoint to plot. Rising `total_volume` at a stable `avg_weight` means more work at the same load; rising `avg_weight` at stable volume means the load itself went up. Both are progressive overload — they just look different on a chart.

| Status | When                            |
| ------ | ------------------------------- |
| `200`  | Success                         |
| `404`  | Exercise not found or not yours |

---

## Workout volume

```
GET /analytics/workouts/:workoutId/volume
```

Total work performed in one session, across every exercise in it:

```json
{
  "data": {
    "workout_id": "0e5f2c1a-…",
    "total_volume": 4820
  }
}
```

`total_volume` is the sum of `weight × reps` over all non-warmup sets in the workout. A workout with no working sets returns `0`, not `null`.

| Status | When                           |
| ------ | ------------------------------ |
| `200`  | Success                        |
| `404`  | Workout not found or not yours |

---

## Related

- [Track a workout](/guides/track-a-workout/) — producing the data these endpoints read
- [Sets](/api/sets/) — the raw records everything is computed from
- [Glossary](/reference/glossary/) — volume, PR, 1RM and RPE explained
