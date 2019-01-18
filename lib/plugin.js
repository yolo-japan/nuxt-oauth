/* eslint-disable import/no-unresolved, import/no-extraneous-dependencies, prefer-template */
import middleware from '@@/.nuxt/middleware'

const isAuthenticatedRoute = component =>
  typeof component.options.authenticated === 'function' ? component.options.authenticated(component) : component.options.authenticated

const checkAuthenticatedRoute = ({ route: { matched } }) => process.client
  ? matched.some(({ components }) => Object.values(components).some(c => isAuthenticatedRoute(c)))
  : matched.some(({ components }) => Object.values(components).some(({ _Ctor }) =>
    Object.values(_Ctor).some(c => c.options && isAuthenticatedRoute(c))))

middleware.auth = context => {
  const isAuthenticated = checkAuthenticatedRoute(context)
  const accessToken = context.req.accessToken

  if (!isAuthenticated || !!accessToken) return
  context.redirect(302, '/auth/login?redirect-url=' + context.route.path)
}

export default async (context, inject) => {
  const createAuth = action => (redirectUrl = context.route.path) =>
    context.redirect('/auth/' + action + '?redirect-url=' + redirectUrl)

  inject('login', createAuth('login'))
  inject('logout', createAuth('logout'))
}
