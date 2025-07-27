import type { Core } from '@strapi/strapi';

const search = ({ strapi }: { strapi: Core.Strapi }) => ({
  async index(ctx) {
    return await strapi
      .plugin("strapi-v5-search-multilingual")
      .service("search")
      .globalSearch(ctx);
  },
  async syncEntries(ctx) {
    ctx.body = strapi
      .plugin("strapi-v5-search-multilingual")
      .service("search")
      .syncEntries(ctx);
  },
  async syncAllEntitiesTypes(ctx) {
    return await strapi
      .plugin("strapi-v5-search-multilingual")
      .service("search")
      .syncAllEntitiesTypes(ctx);
  },
  async autoComplete(ctx) {
    return await strapi
      .plugin("strapi-v5-search-multilingual")
      .service("search")
      .autoComplete(ctx);
  },
});

export default search;
