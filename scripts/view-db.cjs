const { ImageDatabase } = require('../electron/pouchDB/Database.cjs');

const db = ImageDatabase.getInstance();
const path = require('path');

// db.destroyDatabase().then(info => {
//   console.log(info);
// });

db.syncDatabaseFromLocalJson('C:\\Users\\jzj\\AppData\\Roaming\\atujii\\images.json').then(result => {
  console.log(result);
});



// db.getDatabaseInfo().then(info => {
//   console.log(info);
// });

// const jsonPath = path.join(process.cwd(), 'images.json');
// db.exportDatabaseToLocalJson(jsonPath).then(result => {
//   console.log(result);
// });

