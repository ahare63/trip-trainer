# Hosting

## Public copy: GitHub Pages

1. Create a public repository and push these files to the `main` branch.
2. In the repository: Settings, then Pages. Under “Build and deployment,” choose “Deploy from a branch,” branch `main`, folder `/ (root)`.
3. After a minute the site is live at `https://<username>.github.io/<repository>/`.

## Custom subdomain (optional, free)

1. Where the domain’s DNS is managed, add a `CNAME` record: name `trip` (for `trip.example.com`), value `<username>.github.io`.
2. In Settings, then Pages, enter the subdomain under “Custom domain” and save. GitHub adds a `CNAME` file to the repo.
3. When the DNS check passes, tick “Enforce HTTPS.”

## Claude-hosted copy

`node tools/bundle.js` writes `dist/claude.html`, a single self-contained file. Give that file to Claude in a chat and ask it to publish it over the existing artifact. That copy syncs progress to the owner’s Claude account and can use Claude for AI features without an API key. For that, the artifact must be published with the `sample` capability declared alongside the ones it already has (`db` and `user`, for progress sync); without it, “Your trip” says Claude isn’t available.

On GitHub Pages, “Your trip” asks each visitor for their own Anthropic API key. It is stored only in their browser and sent only to `api.anthropic.com`.
