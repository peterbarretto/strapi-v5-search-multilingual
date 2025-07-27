import type { Core } from '@strapi/strapi';

interface SearchEntityConfig {
  name: string;
  repeated?: boolean;
  frontend_entity?: boolean;
}

interface EntryEventPayload {
  uid: string;
  model: unknown;
  entry: {
    id: number;
    documentId?: string;
    [key: string]: any;
  };
}

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const getEntities = (): SearchEntityConfig[] =>
    strapi.config.get('search.entities') ?? [];

  const buildWhere = (entry: any, uid: string, entity: SearchEntityConfig) => {
    const where: Record<string, unknown> = {
      entity_id: entry.documentId,
      entity: uid,
    };

    if (entity.frontend_entity) {
      where.original_entity = uid;
      delete where.entity;
    }

    return where;
  };

  strapi.eventHub.addListener('entry.create', async (listener: EntryEventPayload) => {
    const entities = getEntities();

    for (const entity of entities) {
      if (entity.name === listener.uid) {
        await strapi
          .plugin('strapi-v5-search-multilingual')
          .service('search')
          .syncSingleItem(listener.entry, entity.name, false);
      }
    }
  });

  strapi.eventHub.addListener('entry.update', async (listener: EntryEventPayload) => {
    const entities = getEntities();
console.log("entities: ",entities);
    for (const entity of entities) {
      if (entity.name === listener.uid && !entity.repeated) {
        console.log("here1");
        const where = buildWhere(listener.entry, listener.uid, entity);
        console.log("here1");

        await strapi
          .db
          .query('plugin::strapi-v5-search-multilingual.search')
          .deleteMany({ where });
        console.log("here2");

        await strapi
          .plugin('strapi-v5-search-multilingual')
          .service('search')
          .syncSingleItem(listener.entry, entity.name, true);
      }
        console.log("here3");

    }
  });

  strapi.eventHub.addListener('entry.publish', async (listener: EntryEventPayload) => {
    const entities = getEntities();

    for (const entity of entities) {
      if (entity.name === listener.uid && !entity.repeated) {
        const where = buildWhere(listener.entry, listener.uid, entity);

        await strapi
          .db
          .query('plugin::strapi-v5-search-multilingual.search')
          .deleteMany({ where });

        await strapi
          .plugin('strapi-v5-search-multilingual')
          .service('search')
          .syncSingleItem(listener.entry, entity.name, false);
      }
    }
  });

  strapi.eventHub.addListener('entry.delete', async (listener: EntryEventPayload) => {
    const entities = getEntities();

    for (const entity of entities) {
      if (entity.name === listener.uid && !entity.repeated) {
        const where = buildWhere(listener.entry, listener.uid, entity);

        await strapi
          .db
          .query('plugin::strapi-v5-search-multilingual.search')
          .deleteMany({ where });
      }
    }
  });
};

export default register;
