# LE Baby Repo

Sileo-compatible APT repository hosted with GitHub Pages.

## Add a package

1. Put one or more `.deb` files in `debs/`.
2. Commit and push to `main`.
3. GitHub Actions validates the packages, rebuilds `Packages*` and `Release`, and deploys the repository to GitHub Pages.

Repository URL: `https://le-baby.github.io/`

## First deployment

In the GitHub repository, open **Settings > Pages** and select **GitHub Actions** as the source. Then run the **Build and deploy Sileo repo** workflow, or push another commit.

## Local build

```sh
bash scripts/build-repo.sh
```
