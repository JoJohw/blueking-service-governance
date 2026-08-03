# devmode assets bash tests

## Layout

- `docker/`: pinned linux test image for running bash tooling consistently
- `helpers/`: shared bats helper functions
- `unit/`: unit test suites, organized by asset type (`trpc` / `taf`)

## Commands

Run from `pkg/extension/component/devmode/assets`:

```bash
just lint
just test
just test tests/unit/trpc/find_binary_in_dir.bats
```
