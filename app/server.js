const Hapi = require('@hapi/hapi')
const inert = require('@hapi/inert')
const nunjucks = require('nunjucks')
const vision = require('@hapi/vision')
const susie = require('susie')

async function createServer () {
  const server = Hapi.server({
    mime: {
      override: {
        // NOTE: setting this content type as not compressible results in a
        // simplified writing to the stream as there doesn't need to be an
        // explicit call to flush as per this issue
        // https://github.com/hapijs/hapi/issues/3599
        'text/event-stream': {
          compressible: false
        }
      }
    },
    port: process.env.PORT
  })

  await server.register(inert)
  await server.register(vision)
  await server.register(susie)

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
