# run-for-money-apis

<p> this is xana app repository, contains APIs for RFM Game.<br>
API Documentations can be found at api-test.xana.net

start script ==>> "npm start" 

<p>

## migrations
`
* npx sequelize migration:create --name <tableName>
below command for update you table 
* npx sequelize-cli db:migrate --name <migrationFileName>`

## Seeds

*   `npx sequelize seed:generate --name <seed file name>`
*   `npx sequelize db:seed --seed <seed-file-name>`

### remove column
* `npx sequelize-cli db:migrate:undo --name 20230927045548-addworldTagsTable.js`

### node info
* `node -v : v14.21.3`