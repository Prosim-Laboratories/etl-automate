# etl-automate
A Extract‑Transform‑Load (ETL) framework for CSV‑style data with cron scheduling.


### Configuration

Place a `config.json` next to `main.js` that looks like this:

```json
{
  "cron": [dayOfWeek, hour, minute, second],
  "etl_files": [
    "script1.etl",
    "script2.etl"
  ]
}
````

* **`cron`**: `[D, H, M, S]`

  * `D` = 0…6 (Sunday=0…Saturday=6)
  * `H` = 0…23
  * `M` = 0…59
  * `S` = 0…59
* **`etl_files`**: list of `.etl` scripts to run each cron tick

### ETL Syntax

Each `.etl` file is a line‑based script. Every line must follow:

`
<expression>  ->  <target>
`

* **`<expression>`** can be:

  * **Cell references**: `A1`, `XYZ134`
  * **Numeric literals**: `2`, `3.14`
  * **Ranges**: `E14:E17`, `A1:C1`
  * **Operators**: `+`, `-`, `*`, `/`

* **`<target>`** must be either:

  * A **single cell**, e.g. `A7`
  * A **range** of the same total size as the LHS, e.g. `A7:A10`

### Built‑in Operations

* **Addition** `(E14 + E15) -> A7`
* **Subtraction** `(E14 - E15) -> A7`
* **Multiplication** `(E14 * E15) -> A7`
* **Division** `(E14 / E15) -> A7`

### Row & Column Ranges

* **Column‑wise copy or arithmetic** \
  `(E14:E17)      -> A7:A10     # 1×4 → 1×4` \
  `(E14:E17) + 2  -> G14:G17    # add 2 to each cell in that 1×4 range`

* **Row‑wise copy or arithmetic** \
  `(A1:C1)        -> A2:C2      # 1×3 → 1×3` \
  `(A1:C1) * 3    -> D1:F1      # multiply each in 1×3 by 3`

* **Matrix‑style operations** (ranges must match dimensions): \
`  A3:B3 + C3:D3  -> E3:F4      # both 1×2 → target must be 1×2`

Sheet Seperation
S1(A1) -> S2(A3)
Defaults to sheet 1 if 
(A1) -> (A3)

## Basic Commands
- Run development: `pnpm dev`
- Running tests: `pnpm test`

## Misc
 * This repository uses conventional commits: https://www.conventionalcommits.org/en/v1.0.0/#summary
    - feat: – a new feature is introduced with the changes
    - fix: – a bug fix has occurred
    - chore: – changes that do not relate to a fix or feature and don't modify src or     - test files (for example updating dependencies)
    - refactor: – refactored code that neither fixes a bug nor adds a feature
    - docs: – updates to documentation such as a the README or other markdown files
    - style: – changes that do not affect the meaning of the code, likely related to  - code formatting such as white-space, missing semi-colons, and so on.
    - test: – including new or correcting previous tests
    - perf: – performance improvements
    - ci: – continuous integration related
    - build: – changes that affect the build system or external dependencies
    - revert: – reverts a previous commit
Useful Latex equation formulas: https://blmoistawinde.github.io/ml_equations_latex/#softmax






| flag combination you pass | `runOnce` | `enableCron` after parsing    | what happens at startup                   |
| ------------------------- | --------- | ----------------------------- | ----------------------------------------- |
| *(no flags at all)*       | `false`   | **becomes `true` by default** | **cron schedule only** (no immediate run) |
| `--run`                   | `true`    | `false`                       | **one immediate run**, then exit          |
| `--run --cron`            | `true`    | `true`                        | **one immediate run**, **then cron**      |
| `--cron`                  | `false`   | `true`                        | **cron only** (exactly your scenario)     |

So when you launch with just `--cron` (and a valid `config.json` that contains a `cronExpression` such as `"0 0 * * *"`):

1. The program **does not** call `jobHandler()` immediately because `runOnce` is `false`.
2. It registers the cron job with the supplied pattern.
3. The ETL workflow runs only when that cron trigger fires.

If you also want it to run right away in addition to the schedule, pass `--run --cron`.
