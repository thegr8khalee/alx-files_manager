const dbClient = require('./utils/db'); // Assuming DBClient is in utils/db.js

(async () => {
  console.log(dbClient.isAlive()); // Check if DB is alive initially
  console.log(await dbClient.nbUsers()); // Get the number of users
  console.log(await dbClient.nbFiles()); // Get the number of files
})();
