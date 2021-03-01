const Hapi = require('@hapi/hapi')
const inert = require('@hapi/inert')
const nunjucks = require('nunjucks')
const vision = require('@hapi/vision')

async function createServer () {
  const server = Hapi.server({
    mime: {
      override: {
        'text/event-stream': {
          compressible: false
        }
      }
    },
    port: process.env.PORT
  })

  await server.register(inert)
  await server.register(vision)

  const routes = [].concat(
    require('./routes/assets'),
    require('./routes/healthy'),
    require('./routes/healthz'),
    require('./routes/home'),
    ...require('./routes/sse')
  )

  server.route(routes)

  server.views({
    engines: {
      njk: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)
          return context => template.render(context)
        },
        prepare: (options, next) => {
          options.compileOptions.environment = nunjucks.configure([
            'node_modules/govuk-frontend',
            ...options.path
          ])
          return next()
        }
      }
    },
    path: [
      'app/views'
    ]
  })

  return server
}

module.exports = createServer
