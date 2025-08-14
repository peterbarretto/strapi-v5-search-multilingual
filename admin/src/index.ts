import type { StrapiApp } from '@strapi/admin/strapi-admin'
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import SyncButton from './components/SyncButton';

export default {
  register(app : StrapiApp) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

    bootstrap(app : StrapiApp) {
    app.getPlugin('content-manager').injectComponent("listView", "actions", {
      name: "SyncButton",
      Component: SyncButton,
    });
  },
  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};
