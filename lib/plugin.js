/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies, prefer-template */
import middleware from '@@/.nuxt/middleware'

const moduleName = '<%= options.moduleName %>'

const initStore = async context => {
  if (!context.store) {
    throw new Error('nuxt-oauth requires a Vuex store!')
  }

  context.store.registerModule(moduleName, {
    namespaced: true,
    state: process.server ? {
      accessToken: (context.req && context.req.accessToken),
      user: (context.req && context.req.user),
      expires: (context.req && context.req.expires)
    } : null,
    mutations: {
      updateToken (state, token) {
        state.accessToken = token.accessToken
        state.expires = token.expires
      }
    }
  }, {
    preserveState: process.client
  })
}

const isAuthenticatedRoute = component =>
  typeof component.options.authenticated === 'function' ? component.options.authenticated(component) : component.options.authenticated

const checkAuthenticatedRoute = ({ route: { matched } }) => process.client
  ? matched.some(({ components }) => Object.values(components).some(c => isAuthenticatedRoute(c)))
  : matched.some(({ components }) => Object.values(components).some(({ _Ctor }) =>
    Object.values(_Ctor).some(c => c.options && isAuthenticatedRoute(c))))

middleware.auth = context => {
  const isAuthenticated = checkAuthenticatedRoute(context)
  const { accessToken = null } = context.store.state[moduleName]

  if (!isAuthenticated || !!accessToken) return
  context.redirect(302, '/auth/login?redirect-url=' + context.route.path)
}

export default async (context, inject) => {
  await initStore(context)

  const createAuth = action => (redirectUrl = context.route.path) =>
    context.redirect('/auth/' + action + '?redirect-url=' + redirectUrl)

  inject('login', createAuth('login'))
  inject('logout', createAuth('logout'))
}
