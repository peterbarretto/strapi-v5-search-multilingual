const controller = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi
      .plugin('strapi-v5-search-multilingual')
      // the name of the service file & the method.
      .service('service')
      .getWelcomeMessage();
  },
});

export default controller;
