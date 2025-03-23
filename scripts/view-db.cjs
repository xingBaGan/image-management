const { ImageDatabase } = require('../electron/pouchDB/Database.cjs');
const PouchDB = require('pouchdb');
const path = require('path');

const db = ImageDatabase.getInstance();

// db.destroyDatabase().then(info => {
//   console.log(info);
// });

// db.syncDatabaseFromLocalJson('C:\\Users\\jzj\\AppData\\Roaming\\atujii\\images.json').then(result => {
//   // console.log(result);
//   console.log('----syncDatabaseFromLocalJson---');
// });



// db.getDatabaseInfo().then(info => {
//   console.log(info);
// });

const jsonPath = path.join(process.cwd(), 'images.json');
db.exportDatabaseToLocalJson(jsonPath).then(result => {
  console.log(result);
});

async function main() {
  // const result = await db.getDatabaseInfo();
  const fields = [
    'data.path',
    'data.name',
    'data.tags',
    'data.favorite',
    'data.categories',
    'data.colors',
    'data.ratio',
    'data.rating',
    'data.dateModified',
    'data.extension',
    'data.type',
    'data.size',
    'data.id',
    '_id',
    '_rev'
];
  const result = await db.db.createIndex({
    index: {
      fields: fields,
    }
  })
  console.log('----result---',result);
  if (result.result === 'exists') {
    try {
      const name = result.name
      console.log('----name---',name);
      const result2 = await db.db.find({
        fields: fields,
        selector: {
          'data.type': 'image',
          'data.size': { $gt: 0 },
        },
        sort:['data.rating'],
        // use_index: name
    });
    console.log(result2.docs);
    } catch (error) {
      console.log('----error---',error);
    }
  } 
  // const docs = await db.db.allDocs({
  //   include_docs: true,
  //   limit: 1000,
  //   startkey: 'image_**',
  //   // endkey: 'image_**',
  //   include_docs: true,
  // });
  // // console.log(docs);
  // const rows = docs.rows.map(row => {
  //   return {
  //     _id: row.id,
  //     _rev: row.doc._rev,
  //     data: row.doc.data
  //   }
  // })
  // console.log(rows);
}

// main();
