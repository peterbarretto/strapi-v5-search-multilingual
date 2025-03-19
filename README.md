# strapi-v5-search-multilingual


Strapi v5 Search Multilingual is a powerful plugin designed to bring multilingual full-text search capabilities to your Strapi application. 🗂️🌐 Whether you're managing a multilingual blog, e-commerce store, or any global content, this plugin simplifies search implementation across multiple languages.

Simple search plugin for __strapi 5__, which searches in __components__ and __dynamic zones__ also if needed.
These components and dynamic zones field can be put in the populate in the entities search config.
Also it provides a way to search for page titles using the Auto-complete api.
One button to sync all entries in a collection to the search collection.

---

## Features ✨
- **Multilingual Search**: Support for searching across multiple languages effortlessly.  
- **Full-Text Search**: Provides robust full-text search capabilities powered by MongoDB or other Strapi-supported databases. 
- **Autocomplete Feature**: Search the titles for any entry in any collection using the autocomplete api. Specify the Title field for the collection in the config file and that field will be searched while using the autocomplete api.
- **Customizable**: Fine-tune search fields, language preferences, and filters for your unique needs.  
- **Easy Integration**: Seamlessly integrates into your existing Strapi application with minimal setup.  
- **Easy Sync**: One button to sync all entries to the search collection.  
- **Optimized Performance**: Efficient querying for large datasets and multilingual content.
- **Search Collection**: A search collection is created by the plugin which has the content that will be searched. The path to the search collection is   
```bash
/admin/content-manager/collection-types/plugin::strapi-v5-search-multilingual.search
```
Search Collection Listing Screenshot:

![Screenshot](https://raw.githubusercontent.com/peterbarretto/strapi-v5-search-multilingual/refs/heads/main/screenshots/search-collection-listing.png)


---

## Installation 🚀  
You can install this plugin using npm:  

```bash
npm install strapi-v5-search-multilingual
```

Or with Yarn:  

```bash
yarn add strapi-v5-search-multilingual
```

---

## Usage 🛠️  

1. **Setup Configuration**:  
   After installation, add the search config file at config/search.js in your strapi installation.
   Example search config file is provided in this repo at search.config.example.js  

2. **Run Your Strapi Application**:  
   Start your Strapi server to initialize the plugin:  

   ```bash
   npm run develop
   ```

3. **Sync collections using the single Sync Button in the Dashboard**:
   Add the collections that you want the Sync button to be avalaible in the CMS. Click Sync and all the entries will be synced to the search collection.

4. **Edit and save entries that need to be updated after the sync**:  
   Open entries in strapi dashboard and save those. This will create the entries in the Strapi search collection.

5. **Use the Search API**:  
   Query your multilingual content using the search endpoint provided by the plugin.  

6. **Use the Auto complete API**:  
   Query your multilingual Title field to get auto completed titles.  


---

## Configuration Options ⚙️  

Here’s a basic example configuration file (search.config.example.js): 


```bash
module.exports = {
  search_filters: true,
    entities: [
      {
        name:  "api::initiative.initiative",
        fields: ["PageTitle", "ShortDescription"],
        title: "PageTitle"
      },
      {
        name:  "api::product.product",
        fields: ["PageTitle", "ShortDescription"], //only search for text in the mentioned fields
        title: "PageTitle", //specify the title field in a collection which will be used for autocomplete funtionality
        filters: { //only make entries searchable who fulfill the below conditions
          SearchPage:  true,
        },
      },
    ],
    map: {
      others: [ 
        "api::initiative.initiative",
        "api::product.product",
      ], 
      map_entity: [
      ],
      final_count: { 
        all: 0,
        "api::initiative.initiative":0,
        "api::product.product":0,
      },
    },
    default_populate: { //in the search result for each entry if you need additional fields to be fetched (relations/components which are not fetched by default findMany)
      PageSlug: true,
      Image: true,
      ParentPage: true,
    },
    custom_populate:[
    ],
    auto_complete:{
      search_by: 'startswith' //contains or startswith , default is startswith
    },
    sync_entities:
    ["api::initiative.initiative","api::product.product"],
};
  
```

1. **Main Configurations:**
- `search_filters`: (required) has to set to true to use the below keys.
- `entities`: (required) has all the entities that need to be searched.
- `name`: (required) is the collection that is present in strapi.
- `fields`: (required) all the fields that need to be searched in the strapi collection.
- `title`: (required) is used to specify the field that will be search for auto complete feature.
- `filters`: this is used to filter if specify entries from a collection have to be searched and the others are not to be shown in the search results
- `sync_entities`: this is used to specify which all entities will have the Sync Search Items button

2. **Other Configurations:**
- `map.others`: (required) this is used to set the list of filters that need to be filtered in the search results.
- `map.final_count`: (required)this is used to set all the counts that you want to use in the frontend result.
- `match_filters`: this is used to filter if the same collection has two different entities that need to be shown as different tabs on the search page.
- `frontend_entity`: this is the entity name that is used on the frontend tabs to differentiate.
- `map.map_entity`: this is used to fetch the details of the entity if original_entity is set for the result entries.
- `default_populate`: this is the default populate when fetching each entries details.
- `custom_populate`: this is for custom populating when fetching each entries details for the specified collection.

3. **Search inside component configurations:**
```bash
entities: [
    { 
        name: "api::initiative.initiative",
        fields: ["PageTitle", "ShortDescription"],
        title: "PageTitle"
        populate: { 
          componentname: {    
            populate: {
              Description: true
            }        
          }
        }
    }
    ]
```
- `populate`: this key is used to search in the component for specific field, add this in entities under the specific collection. Here we want to search in the Description field inside the componentname

4. **Search inside dynamic zone configurations:**
```bash
entities: [
    { 
        name: "api::initiative.initiative",
        fields: ["PageTitle", "ShortDescription"],
        title: "PageTitle"
        populate: { 
          dynamiczone: {
            on: {
              'blocks.content-block': { 
                populate: {
                  Description: true
                } 
              }
            }
          }
        }
    }
    ]
```
- `populate`: this key can also be used to search inside a dynamic zone 'blocks', add this in entities under the specific collection. Here we want to search in the Description field inside the component 'content-block'

---
### There are three example config files provided in the repo: 
1. **Basic** : search.config.example.js
2. **Intermediate** : search.config.intermediate.example.js
3. **Advance** : search.config.advance.example.js

---

## Example API Call 🖥️  

#### 1. Search All collections for a search term

```bash
  GET /api/strapi-v5-search-multilingual/search/?locale=en&type=api::initiative.initiative&term=a&pagination[page]=2&pagination[pageSize]=10
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `term` | `string` |  text to be searched|
| `locale` | `string` |  locale for searching, default is 'en' |
| `type` | `string` |  filter by collection uid, eg: **api::initiative.initiative** |
| `pagination[page]` | `string` |  page number to return in results , default is page 1|
| `pagination[pageSize]` | `string` |  page result size|

Response:  
```json
{
    "data": [
        {
            "id": 4,
            "documentId": "ehm58bojoeq5nn6pl6afmaqw",
            "PageTitle": "Test Initiative",
            "PageSlug": "test-initiative",
            "ShortDescription": "Short description goes here",
            "createdAt": "2024-11-08T07:08:59.058Z",
            "updatedAt": "2024-12-09T09:59:17.023Z",
            "publishedAt": "2024-11-29T07:21:27.335Z",
            "locale": "en",
            "PublishedDate": null,
            "PageUid": "test-initiative",
            "Thumbnail": {
                "id": 20,
                "name": "Test_initiative_thumbnail.jpg",
                "alternativeText": null,
                "caption": null,
                "width": 1330,
                "height": 1060,
                "formats": {
                   
                },
                "hash": "Test_initiative_thumbnail_324ed44e96",
                "ext": ".jpg",
                "mime": "image/jpeg",
                "size": 161.2,
                "url": "/uploads/Test_initiative_thumbnail_324ed44e96.jpg",
                "previewUrl": null,
                "provider": "local",
                "provider_metadata": null,
                "folderPath": "/5",
                "createdAt": "2024-11-08T07:06:55.652Z",
                "updatedAt": "2024-11-08T07:06:55.652Z"
            },
            "entity": "api::initiative.initiative"
        }
    ],
    "meta": {
        "pagination": {
            "page": 1,
            "pageSize": 10,
            "pageCount": 1,
            "total": 1,
            "allCounts": {
                "all": 1,
                "api::program.program": 0,
                "api::resource.resource": 0,
                "api::initiative.initiative": 1,
                "api::news.news": 0,
                "api::publication.publication": 0
            }
        }
    }
}
```
Screenshot:
![Screenshot](https://raw.githubusercontent.com/peterbarretto/strapi-v5-search-multilingual/refs/heads/main/screenshots/search-tabs.png)

#### 2. Search Title (Autocomplete)

```bash
  GET /api/strapi-v5-search-multilingual/search/autocomplete?locale=en&term=te
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `term` | `string` |  text to be searched in title and return autocompleted results|
| `locale` | `string` |  locale for searching, default is 'en' |

Response:  
```json
{
    "data": [
        "Test Initiative 1",
        "Test Initiative 2"
    ]
}
```
Screenshot:

![Screenshot](https://raw.githubusercontent.com/peterbarretto/strapi-v5-search-multilingual/refs/heads/main/screenshots/autocomplete-search.png)


Search Collection Screenshot:

![Screenshot](https://raw.githubusercontent.com/peterbarretto/strapi-v5-search-multilingual/refs/heads/main/screenshots/search-collection-entry.png)


Sync Search Button Screenshot:

![Screenshot](https://raw.githubusercontent.com/peterbarretto/strapi-v5-search-multilingual/refs/heads/main/screenshots/sync-button.png)
To get the above button add the collections as shown below in the config file

Sync Search Collection Config Screenshot:

![Screenshot](https://raw.githubusercontent.com/peterbarretto/strapi-v5-search-multilingual/refs/heads/main/screenshots/sync-button-config.png)

---

## Compatibility 🤝  
This plugin is compatible with Strapi v4.  

---


## License 📜  
This project is licensed under the [MIT License](./LICENSE).  

---

## Links and Resources 🔗  
- [NPM Package](https://www.npmjs.com/package/strapi-v5-search-multilingual)  
- [Strapi v5 Documentation](https://docs.strapi.io/)
- [Strapi v4 Plugin ](https://www.npmjs.com/package/strapi-indexed-search-multilingual)
---
## Future Development
- __optimization of code__

---