# Release Scripts

These scripts are kept in `.run` so they are easy to launch from PyCharm or from a terminal.

## Dry Run

Use this first. It prints the release commands without creating tags or pushing anything.

```bash
./.run/release-action-dry-run.sh v1.0.0
```

## Release

This creates and pushes the immutable version tag and updates the floating major tag.

```bash
./.run/release-action.sh v1.0.0
```

For `v1.0.0`, the script pushes:

- `v1.0.0` - exact release tag;
- `v1` - floating major tag used by GitHub Actions users.

After release, users can reference:

```yaml
uses: Artasov/orcestr-repo-notifier@v1
```

The script requires a clean working tree and must be run from `main`.
