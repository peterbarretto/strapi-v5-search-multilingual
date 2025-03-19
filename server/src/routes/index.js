import searchAPIRoutes from './search';

const routes = {
  'content-api': {
    type: 'content-api',
    routes: searchAPIRoutes,
  },
};

export default routes;
