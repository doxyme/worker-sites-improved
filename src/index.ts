import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import Sentry from './sentry'

type Config = {
  debug: boolean,
  manifest: any,
  basepath: string,
  spaFallback: string,
  app: string,
  env: string,
  sentryKey: string,
  sentryProjectId: string,
}

const genEtag = (hash: string) => `W/"${hash}"`
const normalizePath = (pathname: string) => ('/' + pathname).replace(/\/+/g, '/')
const resolvePath = (pathname: string, basepath: string) => {
  if (basepath) {
    // Remove mount point prefixes. Note, mount points basically must be a "directory".
    // If somebody concocts a scenario where this is not the case, let Heath know.
    // FIXME: With prefix /prefix, /prefixing => /ing
    return normalizePath(pathname).replace(new RegExp(`^${basepath}`), '')
  }

  return pathname
}

function init(config : Config) {
  // Note, mount points basically must be a "directory".
  // If somebody concocts a scenario where this is not the case, let Heath know.
  config = { ...config, basepath: normalizePath(config.basepath).replace(/\/$/g, '') }

  return {
    handlerHandler: handlerHandler.bind(null, config),
    addOptionsEventListener: addOptionsEventListener.bind(null, config),
    addRequestEventListener: addRequestEventListener.bind(null, config),
  }
}

function addOptionsEventListener(config: Config) {
  addEventListener('fetch', (event: FetchEvent) => {
    if (event.request.method === 'OPTIONS') {
      event.respondWith(handlerHandler(config, event, handleOptionsRequest))
    }
  })  
}

function addRequestEventListener(config : Config) {
  addEventListener('fetch', (event: FetchEvent) => {
    event.respondWith(handlerHandler(config, event, handleEvent))
  })
}

async function handlerHandler(config: Config, event: FetchEvent, fn: Function, ...args: any[]) {
  try {
    return await fn(config, event, ...args)
  } catch (e) {
    event.waitUntil(Sentry.captureException(config, e, event.request))
    const message = config.debug ? e.message || e.toString() : 'Internal Error'

    return new Response(message, { status: 500 })
  }
}

function handleOptionsRequest(config : Config, event: FetchEvent) {
  const request = event.request
  const cors = config.manifest.cors
  const headers = new Headers()

  if (
    cors &&
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    if (cors.origin) {
      headers.set('Access-Control-Allow-Origin', cors.origin)
      headers.set('Vary', 'Origin')
    }
    if (cors.methods) {
      headers.set('Access-Control-Allow-Methods', cors.methods.join(', '))
    }
    if (cors.headers) {
      headers.set('Access-Control-Allow-Headers', cors.headers.join(', '))
    }
    if (cors.maxAge) {
      headers.set('Access-Control-Max-Age', cors.maxAge)
    }
  } else {
    // Handle standard OPTIONS request
    headers.set('Allow', 'GET, HEAD, OPTIONS')
  }

  return new Response(null, { headers })
}

async function handleEvent(config : Config, event: FetchEvent) {
  let response = await handleRequest(config, event)

  if (response.status === 404 && config.spaFallback) {
    const parsedUrl = new URL(event.request.url)
    const pathname = resolvePath(parsedUrl.pathname, config.basepath)

    if (pathname === config.spaFallback) {
      throw new Error(`Unrecognized SPA fallback: ${config.spaFallback}`)
    }

    config.manifest.aliases[pathname] = config.spaFallback

    response = await handleRequest(config, event)
  }

  if (config.manifest.cors && config.manifest.cors.origin) {
    response.headers.set('Access-Control-Allow-Origin', config.manifest.cors.origin)
    response.headers.set('Vary', 'Origin')
  }

  return response
}

function handleRedirect(pathname: string) {
  const response = new Response('Found', {
    status: 302,
    headers: { Location: pathname },
  })

  return applyResponseHeaders(response, null)
}

async function handleRequest(config : Config, event: FetchEvent) {
  const parsedUrl = new URL(event.request.url)

  if (parsedUrl.pathname === config.basepath) {
    return handleRedirect(config.basepath + '/')
  }

  const pathname = resolvePath(parsedUrl.pathname, config.basepath)
  const pathRedirect = config.manifest.redirects[pathname]
  const pathAlias = config.manifest.aliases[pathname]
  const pathManifest = config.manifest.paths[pathAlias || pathname]

  if (pathRedirect) {
    return handleRedirect(config.basepath + pathRedirect)
  }

  if (!pathManifest) {
    const response = new Response('Not Found: ' + pathname, { status: 404 })

    return applyResponseHeaders(response, null)
  }

  if (genEtag(pathManifest.hash) === event.request.headers.get('If-None-Match')) {
    const response = new Response(null, { status: 304 })

    return applyResponseHeaders(response, pathManifest)
  }

  const mapRequestToAsset = (req: Request) => {
    if (pathAlias) {
      return new Request(parsedUrl.origin + pathAlias, req)
    } else {
      return new Request(parsedUrl.origin + pathname, req)
    }
  }

  const response = await getAssetFromKV(event, {
    mapRequestToAsset,
    cacheControl: { bypassCache: !!config.debug },
  })

  return applyResponseHeaders(response, pathManifest)
}

function applyResponseHeaders(response: Response, pathManifest: any) {
  if (pathManifest && pathManifest.cacheControl) {
    response.headers.set('Cache-Control', pathManifest.cacheControl)
  }

  if (pathManifest && pathManifest.hash) {
    response.headers.set('ETag', genEtag(pathManifest.hash))
  }

  return response
}

export { init }
