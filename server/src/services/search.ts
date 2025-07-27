"use strict";

import _ from "lodash";

const OMITTED_FIELDS = [
  "localizations",
  "createdBy",
  "createdAt",
  "publishedAt",
  "updatedAt",
  "updatedBy",
  "locale",
  "id",
  "documentId",
];

const DEFAULT_LIMIT = 10;

type AnyObject = Record<string, any>;

export interface SearchConfig {
  default_populate?: AnyObject;
  custom_populate?: Array<{ name: string; populate: AnyObject }>;
  map?: {
    others?: string[];
    map_entity?: Array<{ passed: string; original_entity: string }>;
    final_count?: Record<string, number>;
  };
  auto_complete?: {
    search_by?: string;
  };
  entities?: Array<{ name: string; fields: string[]; [key: string]: any }>;
  sync_entities?: string[];
  search_filters?: AnyObject;
}

export interface StrapiContext {
  request: {
    query: Record<string, any>;
  };
}

const navigateObject = (obj: AnyObject): AnyObject[] => {
  let result: AnyObject[] = [];
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (
        typeof obj[key] !== "object" &&
        !Array.isArray(obj[key]) &&
        obj[key] !== null
      ) {
        result.push({ [key]: obj[key] });
      }
      if (typeof obj[key] === "object" && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          obj[key].forEach((element: any) => {
            if (typeof element === "object" && element !== null) {
              result = result.concat(navigateObject(element));
            } else {
              result.push(element);
            }
          });
        } else {
          result = result.concat(navigateObject(obj[key]));
        }
      }
    }
  }
  return result;
};

const getAllValues = (obj: AnyObject): any[] => {
  const values: any[] = [];
  for (const key in obj) {
    if (typeof obj[key] === "object" && obj[key] !== null) {
      values.push(...getAllValues(obj[key]));
    } else {
      if (key !== "id" && key !== "documentId" && key !== "__component") values.push(obj[key]);
    }
  }
  return values;
};

export default ({ strapi }: { strapi: any }) => ({
  async generateTypeFilter(
    type: string,
    otherEntityApis: string[],
    mappedEntities: Array<{ passed: string; original_entity: string }>,
    bindings: Record<string, any>
  ): Promise<{ typeFilter: string; bindings: Record<string, any> }> {
    if (!type || !otherEntityApis.includes(type)) return { typeFilter: '', bindings };

    const matchingEntities = mappedEntities.filter((entity) => entity.passed === type);
    let typeFilter = ` and entity = :type`;

    if (matchingEntities.length > 0) {
      typeFilter += ` and ( `;
      matchingEntities.forEach((entity, index) => {
        if (index !== 0) typeFilter += ` OR `;
        const bindingKey = `original_entity${index + 1}`;
        typeFilter += `original_entity = :${bindingKey}`;
        bindings[bindingKey] = entity.original_entity;
      });
      typeFilter += ` ) `;
    }

    bindings.type = type;
    return { typeFilter, bindings };
  },

  async getPopulateConfiguration(
    searchConfig: SearchConfig,
    entityName: string
  ): Promise<AnyObject> {
    let populate = searchConfig?.default_populate || {};
    const customPopulate = searchConfig?.custom_populate || [];
    const customConfig = customPopulate.find((item) => item.name === entityName);
    if (customConfig) {
      populate = { ...populate, ...customConfig.populate };
    }
    return populate;
  },

  async globalSearch(ctx: StrapiContext): Promise<AnyObject> {
    const { term, pagination, locale = "en", type } = ctx.request.query;

    const pageNumber = parseInt(pagination?.page ?? 1);
    const limit = parseInt(
      pagination?.pageSize ??
      strapi.config.get("constants.DEFAULT_RESPONSE_LIMIT", DEFAULT_LIMIT)
    );
    const start = limit * (pageNumber - 1);

    const searchConfig: SearchConfig = strapi.config.get("search", "defaultValueIfUndefined");
    const otherEntityApis = searchConfig?.map?.others || [];
    const mappedEntities = searchConfig?.map?.map_entity || [];

    const bindings: Record<string, any> = { locale };
    let { typeFilter, bindings: updatedBindings } = await this.generateTypeFilter(type, otherEntityApis, mappedEntities, bindings);
    let contentFilter = term ? `content ilike '%'||:term||'%' and` : '';
    if (term) updatedBindings.term = term;

    const query = `SELECT Count(*), entity, entity_id, original_entity FROM searches WHERE ${contentFilter} locale=:locale ${typeFilter} GROUP BY entity, entity_id, original_entity`;
    const knex = strapi.db.connection.context;
    const queryResult = await knex.raw(query, updatedBindings);

    let countRows: Record<string, any> = {};
    if (type) {
      const allEntitiesQuery = `SELECT Count(*), entity, entity_id, original_entity FROM searches WHERE ${contentFilter} locale=:locale GROUP BY entity, entity_id, original_entity`;
      const queryResultAll = await knex.raw(allEntitiesQuery, updatedBindings);
      countRows = _.groupBy(queryResultAll.rows, "entity");
    } else {
      countRows = _.groupBy(queryResult.rows, "entity");
    }

    const finalCount = { ...searchConfig?.map?.final_count };
    for (const [index, value] of Object.entries(finalCount)) {
      if (index !== "all" && countRows[index]?.length) {
        let count = finalCount[index] + countRows[index].length;
        finalCount[index] = count;
        finalCount["all"] += count;
      }
    }

    const rowCount = queryResult?.rows?.length;
    const totalPages = Math.ceil(rowCount / limit);
    queryResult.rows = queryResult.rows.slice(start, pageNumber * limit);

    const groupedSearchResults = _.groupBy(queryResult.rows, (item) =>
      `${item.entity}_${item.original_entity || 'default'}`
    );
    let results: AnyObject[] = [];
    for (const compositeKey in groupedSearchResults) {
      const [entityName, originalEntity] = compositeKey.split('_');
      const populate = await this.getPopulateConfiguration(searchConfig, entityName);
      const queryKey = originalEntity !== "default" ? originalEntity : entityName;

      const orderedList = _.map(groupedSearchResults[compositeKey], ({ entity_id }) => entity_id);
      let entityResults = await strapi.documents(queryKey).findMany({
        filters: { documentId: orderedList },
        populate,
        locale,
      });

      entityResults = _.map(
        _.sortBy(entityResults, (obj: any) => _.indexOf(orderedList, obj.id)),
        (item: any) => ({ ...item, entity: entityName })
      );
      results = results.concat(entityResults);
    }

    return {
      data: results,
      meta: {
        pagination: {
          page: pageNumber,
          pageSize: limit,
          pageCount: totalPages,
          total: rowCount,
          allCounts: finalCount,
        },
      },
    };
  },

  async syncEntries(ctx: StrapiContext): Promise<string | boolean> {
    const cultures = await strapi.plugins.i18n.services.locales.find();

    const searchFilters = strapi.config.get("search.search_filters") || null;
    const { model = "" } = ctx.request.query;
    if (model == "") return false;
    if (!searchFilters) return false;
    const searchEntities = _.filter(
      strapi.config.get("search.entities", {}),
      (item: any) => item.name === model
    );
    const where = {
      $or: [
        { entity: model },
        { original_entity: model },
      ],
    };
    strapi.db.query("plugin::strapi-v5-search-multilingual.search").deleteMany({
      where,
    });

    for (const searchEntity of searchEntities) {
      for (const { code } of cultures) {
        await this.processSearchFiltersSyncAll(searchEntity, code);
      }
    }

    return "data synced";
  },

  async processSearchFiltersSyncAll(
    searchEntity: AnyObject,
    locale: string
  ): Promise<boolean> {
    const {
      fields,
      filters = {},
      match_filters = {},
      populate = {},
      title = "PageTitle",
      frontend_entity,
    } = searchEntity;

    const entities = await strapi.documents(searchEntity.name).findMany({
      fields,
      filters: { ...filters, ...match_filters },
      populate,
      locale,
    });

    for (const entity of entities) {
      const theTitle = entity[title];
      const originalEntity = frontend_entity ? searchEntity.name : "";
      const entityName = frontend_entity || searchEntity.name;

      await this.createSearchEntry(
        entity.documentId,
        entityName,
        originalEntity,
        locale,
        theTitle,
        entity
      );
    }
    return true;
  },

  async syncSingleItem(
    entity: AnyObject,
    name: string,
    update = true
  ): Promise<boolean> {
        console.log("here4");
    
    const cultures = await strapi.plugins.i18n.services.locales.find();
    const searchEntities = _.filter(
      strapi.config.get("search.entities", "defaultValueIfUndefined"),
      (item: any) => item.name === name
    );
        console.log("here5");

    const searchFilters = strapi.config.get("search.search_filters") || null;

    const contentType = await strapi
      .plugin("content-manager")
      .service("content-types")
      .findContentType(name);
        console.log("here6");

    if (contentType?.options?.draftAndPublish === true && update)
      return true;

    if (contentType?.options?.draftAndPublish === true && !entity?.publishedAt)
      return true;

    for (const { code } of cultures) {
      if (entity.locale !== code && cultures.length > 1) continue;

      if (searchFilters) {
        console.log("here7");

        if (searchEntities.length > 1){
        console.log("here8");

          await this.processWithSearchFiltersMany(entity, searchEntities, code);
        }else{
        console.log("here9");

          await this.processWithSearchFiltersOne(entity, searchEntities, code);
        }
      } else {
        console.log("here10");

        await this.processWithoutSearchFilters(entity, searchEntities, code);
      }
    }
    return true;
  },

  async processWithSearchFiltersOne(
    entity: AnyObject,
    searchEntities: AnyObject[],
    locale: string
  ): Promise<boolean> {
    const searchEntity = searchEntities[0];

    const {
      fields,
      filters = {},
      populate = {},
      title = "PageTitle",
      frontend_entity,
    } = searchEntity;
console.log(searchEntity);
    const entities = await strapi.documents(searchEntity.name).findMany({
      fields,
      filters: { ...filters, documentId: entity.documentId },
      populate,
      locale,
    });

    if (entities.length === 1) {
      const theTitle = entities[0][title];
      const originalEntity = frontend_entity ? searchEntity.name : "";
      const entityName = frontend_entity || searchEntity.name;

      await this.createSearchEntry(
        entity.documentId,
        entityName,
        originalEntity,
        locale,
        theTitle,
        entities
      );
    }
    return true;
  },

  async processWithSearchFiltersMany(
    entity: AnyObject,
    searchEntities: AnyObject[],
    locale: string
  ): Promise<boolean> {
    let skip = false;

    for (const searchEntity of searchEntities) {
      if (skip) break;

      const {
        fields,
        match_filters = {},
        populate = {},
        title = "PageTitle",
        frontend_entity,
      } = searchEntity;

      const entities = await strapi.documents(searchEntity.name).findMany({
        fields,
        filters: { ...match_filters, documentId: entity.documentId, status: 'publish' },
        populate,
        locale,
      });

      if (entities.length == 1) {
        const theTitle = entities[0][title];
        const originalEntity = frontend_entity ? searchEntity.name : "";
        const entityName = frontend_entity || searchEntity.name;

        await this.createSearchEntry(
          entity.documentId,
          entityName,
          originalEntity,
          locale,
          theTitle,
          entities
        );
        skip = true;
      }
    }
    return true;
  },

  async processWithoutSearchFilters(
    entity: AnyObject,
    searchEntities: AnyObject[],
    locale: string
  ): Promise<boolean> {
    const propArray = navigateObject(_.omit(entity, OMITTED_FIELDS));

    _.each(propArray, (item: AnyObject) => {
      const fieldName = Object.keys(item)[0];
      if (searchEntities[0].fields.includes(fieldName)) {
        strapi.documents("plugin::strapi-v5-search-multilingual.search").create({
          data: {
            entity_id: entity.documentId,
            entity: searchEntities[0].name,
            content: item[fieldName],
            locale,
          },
        });
      }
    });
    return true;
  },

  async createSearchEntry(
    entityId: string,
    entityName: string,
    originalEntity: string,
    locale: string,
    title: string,
    entities: AnyObject
  ): Promise<boolean> {
    const content = getAllValues(entities).filter(Boolean).join("  ");

    if (content) {
      strapi.documents("plugin::strapi-v5-search-multilingual.search").create({
        data: {
          entity_id: entityId,
          original_entity: originalEntity,
          entity: entityName,
          content,
          locale,
          title,
        },
      });
    }
    return true;
  },

  async autoComplete(ctx: StrapiContext): Promise<{ data: string[] }> {
    const { term, locale } = ctx.request.query;
    const search: SearchConfig = strapi.config.get("search", "defaultValueIfUndefined");

    const auto_complete =
      search?.auto_complete?.search_by &&
      search.auto_complete.search_by === "contains"
        ? "$containsi"
        : "$startsWithi";
    const title = {
      [auto_complete]: term,
    };
    const theEntities = await strapi.documents("plugin::strapi-v5-search-multilingual.search").findMany(
      {
        fields: ["title"],
        filters: {
          title,
        },
        locale,
      }
    );

    return { data: _.map(theEntities, ({ title }) => title) };
  },

  async syncAllEntitiesTypes(ctx: StrapiContext): Promise<{ entities: string[] }> {
    const entities = strapi.config.get("search.sync_entities", []) || [];
    return { entities };
  },
});