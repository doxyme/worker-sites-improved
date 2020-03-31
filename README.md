# Cloudflare Worker Sites: Improved

This repository wraps up a bunch of logic useful for Cloudflare Worker Sites, 

  - Configuration-based Path redirects and aliases
  - Configuration-based cache control
  - Etagging
  - Configuration-based CORS
  - Sentry-based logging
  - Rewriting for sub-path deployments
  
Almost everything is controllable by configuration placed within `wrangler.toml`. All additions are optional. Here's a sample:

```
name = "your-worker-site"
workers_dev = true
type = "webpack"
account_id = "your-account-id"
zone_id = "your-zone"

# Automatically generates aliases for /dir/paths/  => /dir/paths/index.html
directoryIndexes = "index.html"

# Bypass caching
vars.DEBUG = 1
vars.ENV = "development"
vars.SENTRY_PROJECT_ID = "your-project-id"
vars.SENTRY_KEY = "your-key"
# Maps 404s to this path with a 200 status
vars.SPA_FALLBACK = "/index.html"

[site]
bucket = "./dist"

[aliases]
# Matches paths and maps key => val
'(.+)\.html$' = "$1"
"/about" = "/about.html"

[cache-control]
# Matches paths and maps to Cache-Control header
'\.(html|js|json)$' = "no-cache"
'^/static/' = "max-age=3600"
'^/(.+\.ico|.+\.png|fonts/)' = "public, max-age=31536000"

[cors]
# Adds various cors headers
origin = "*"
methods = ["GET", "OPTIONS", "HEAD"]
headers = ["Content-Type", "Origin", "Dokbot-Token", "Dokbot-Metrics", "Dokbot-Developer"]
maxAge = 31536000

[env.staging]
name = "your-staging"
zone_id = "your-other-zone"
routes = ["you.com/some-subpath*"]

vars.BASEPATH = "/some-subpath"
vars.ENV = "staging"
```
