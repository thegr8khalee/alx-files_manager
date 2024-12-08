import dbClient from './utils/db';

const waitConnection = () => {
  return new Promise((resolve, reject) => {
    let i = 0;
    const repeatFct = async () => {
      // Wait for 1 second before retrying
      await new Promise(resolveTimeout => setTimeout(resolveTimeout, 1000));

      i += 1;
      if (i >= 10) {
        reject(new Error('Failed to connect to DB after 10 retries'));
      } else if (!dbClient.isAlive()) {
        repeatFct(); // Recursive call to try again
      } else {
        resolve(); // Resolve once DB is alive
      }
    };
    repeatFct();
  });
};

(async () => {
  console.log(dbClient.isAlive()); // Check if DB is alive initially
  await waitConnection(); // Wait until DB is connected
  console.log(dbClient.isAlive()); // Check if DB is alive after waiting
  console.log(await dbClient.nbUsers()); // Log number of users
  console.log(await dbClient.nbFiles()); // Log number of files
})();
