import { uuid } from 'uuidv4'

// Indicates the name of the SDK client
const CLIENT_NAME = 'doxy-cf-sentry'
const CLIENT_VERSION = '1.0.0'
const RETRIES = 5

type SentryConfig = {
  app: string,
  env: string,
  sentryKey: string,
  sentryProjectId: string,
  release?: string,
}

// A very lazy approximation of the Sentry Javascript interface
export default {
  captureMessage,
  captureException,
  captureEvent,
}

export async function captureMessage(config: SentryConfig, formatted: string, extra: any) {
  return captureEvent(config, {
    level: 'info',
    message: { formatted },
    extra,
  })
}

export async function captureException(config: SentryConfig, err: any, request?: Request) {
  const errType = err.name || (err.contructor || {}).name
  const frames = parse(err)
  const extraKeys = Object.keys(err).filter((key) => !['name', 'message', 'stack'].includes(key))
  const data = {
    message: errType + ': ' + (err.message || '<no message>'),
    exception: {
      values: [
        {
          type: errType,
          value: err.message,
          stacktrace: frames.length ? { frames: frames.reverse() } : undefined,
        },
      ],
    },
    extra: extraKeys.length
      ? {
          [errType]: extraKeys.reduce((obj, key) => ({ ...obj, [key]: err[key] }), {}),
        }
      : undefined,
  }

  return captureEvent(config, data, request)
}

export async function captureEvent(config: SentryConfig, data: any, request?: Request) {
  const payload = {
    // No dashes allowed
    event_id: uuid().replace(/-/g, ''),
    tags: { app: config.app },
    platform: 'javascript',
    environment: config.env,
    server_name: `${config.app}-${config.env}`,
    timestamp: Date.now() / 1000,
    request:
      request && request.url
        ? {
            method: request.method,
            url: request.url,
            headers: request.headers,
            data: request.body,
          }
        : undefined,
    release: config.release,
    ...data,
  }

  for (let i = 0; i <= RETRIES; i++) {
    const res = await fetch(`https://sentry.io/api/${config.sentryProjectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': [
          'Sentry sentry_version=7',
          `sentry_client=${CLIENT_NAME}/${CLIENT_VERSION}`,
          `sentry_key=${config.sentryKey}`,
        ].join(', '),
      },
      body: JSON.stringify(payload),
    })
    if (res.status === 200) {
      return
    }
    // We couldn't send to Sentry, try to log the response at least
    console.error({ httpStatus: res.status, ...(await res.json()) }) // eslint-disable-line no-console
  }
}

function parse(err: Error) {
  return (err.stack || '')
    .split('\n')
    .slice(1)
    .map((line: string) => {
      if (line.match(/^\s*[-]{4,}$/)) {
        return { filename: line }
      }

      // From https://github.com/felixge/node-stack-trace/blob/1ec9ba43eece124526c273c917104b4226898932/lib/stack-trace.js#L42
      const lineMatch = line.match(/at (?:(.+)\s+\()?(?:(.+?):(\d+)(?::(\d+))?|([^)]+))\)?/)
      if (!lineMatch) {
        return
      }

      return {
        function: lineMatch[1] || undefined,
        filename: lineMatch[2] || undefined,
        lineno: +lineMatch[3] || undefined,
        colno: +lineMatch[4] || undefined,
        in_app: lineMatch[5] !== 'native' || undefined,
      }
    })
    .filter(Boolean)
}

/*
Forked from: https://github.com/bustle/cf-sentry

Copyright (c) 2019 Michael Hart and Bustle Digital Group

Permission is hereby granted, free of charge, to any
person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the
Software without restriction, including without
limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software
is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT
SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
*/
