// const config = require('../../config');
// const db = require('../../database/database');
// const onchain = require('../../onchain');
// const blockchain = require('../../web3');
// // const initialFuel=Number(config.initialFuel);
// // const initialFuel=42000000000000000000;

// /**
//  * START THE PROJECT AND THEN HIT THE ENDPOINT '/RFM-users', WAIT TILL PROCESS FINISHES.
//  */

// async function getRFMUsers(userId,fuel) {
//   try {
//    let id=userId;
//    let userFuel=fuel;
//     const RFM_users_query = `select u.id, u."walletAddress", u.name as username, ul."leagueId", leagues.name as league, ul.rating as points, ul.wins, ul.loose as loses, ul.draw as draws  from users as u
//   join (
//       select * from "userLeagues"
//       where id in (select max(id) from "userLeagues" group by id)
//   ) as ul
//   left join leagues on ul."leagueId" = leagues.id on u.id = ul."userId"
//   where u."isDeleted"=false and "walletAddress" is not null and u."id"=${id}`;

//     const [rows, result] = await db.query(RFM_users_query, { raw: true });
//     const count = result.rowCount;
//     const wallets = [];
//     const walletData = [];
//     for (let u of rows) {
//       if (u.walletAddress) wallets.push(u.walletAddress);
//       const meta = {
//         league: u['league'] || 'Trial',
//         points: u['points'] || 0,
//         chests: 0,
//         chestRewards: [],
//         missionCount: 0,
//         fuel: userFuel,
//         wins: u['wins'] || 0,
//         loses: u['loses'] || 0,
//         draws: u['draws'] || 0
//       };
//       walletData.push(meta);
//     }
//     // const payload = { wallets, walletData };
//     wallets
//       .reduce(function (p, wallet, i) {
//         return p.then(async () => {
//           return await blockchain.update_user_league(wallet, walletData[i]);
//         });
//       }, Promise.resolve())
//       .then(() => {
//         // all done here
//         console.log(`successfully migrated ${wallets.length} users to contract`);
//       //  return res.status(200).send({ msg: `successfully migrated ${wallets.length} users to contracti`, count, walletData });
//         console.log(`successfully migrated ${wallets.length} users to contracti`, count );
//         return true;

//       })
//       .catch((err) => {
//         // process error hereconsole.log(error);
//         console.log(err);
//         // process.exit(1);
//       });
//   } catch (error) {
//     console.log(error);
//     return false;
//   }
// }

// async function sessionEndCalculateRank(req, res) {
//   try {
//     const RFM_users_query = `UPDATE "userLeagues"
//     SET
//         "leagueId" = CASE
//             WHEN "userLeagues"."battles" = 0 AND "userLeagues"."leagueId" <> 1 THEN "userLeagues"."leagueId" - 1
//             WHEN "userLeagues"."leagueId" = (
//                 SELECT "leagueId"
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId"
//                 AND "userLeagues".rating > "lp_max"
//             ) THEN "userLeagues"."leagueId" + 1
//             WHEN "userLeagues"."leagueId" = (
//                 SELECT "leagueId"
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId"
//                 AND "userLeagues".rating >= "lp_min"
//                 AND "userLeagues".rating <= "lp_max"
//             ) THEN "userLeagues"."leagueId"
//             ELSE "userLeagues"."leagueId" - 1
//         END,
//         "rating" = CASE
//             WHEN "userLeagues"."battles" = 0 AND "userLeagues"."leagueId" <> 1 THEN (
//                 SELECT lp_min
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId" - 1
//             )
//             WHEN "userLeagues"."leagueId" = (
//                 SELECT "leagueId"
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId"
//                 AND "userLeagues".rating > "lp_max"
//             ) THEN (
//                 SELECT lp_min
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId" + 1
//             )
//             WHEN "userLeagues"."leagueId" = (
//                 SELECT "leagueId"
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId"
//                 AND "userLeagues".rating >= "lp_min"
//                 AND "userLeagues".rating <= "lp_max"
//             ) THEN (
//                 SELECT lp_min
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId"
//             )
//             ELSE (
//                 SELECT lp_min
//                 FROM "userLps"
//                 WHERE "leagueId" = "userLeagues"."leagueId" - 1
//             )
//         END
//     WHERE EXISTS (
//         SELECT 1
//         FROM "userLps"
//         WHERE "leagueId" = "userLeagues"."leagueId"
//         AND (
//             ("userLeagues"."rating" > "lp_max" AND "leagueId" <> (SELECT MAX("leagueId") FROM "userLps"))
//             OR ("userLeagues"."rating" < "lp_min" AND "leagueId" <> (SELECT MIN("leagueId") FROM "userLps"))
//             OR ("userLeagues"."rating" >= "lp_min" AND "userLeagues"."rating" <= "lp_max" AND "leagueId" = (SELECT "leagueId" FROM "userLps" WHERE "leagueId" = "userLeagues"."leagueId"))
//         )
//         AND NOT ("userLeagues"."leagueId" = 1 AND "userLeagues"."battles" = 0)
//     );
//     UPDATE "userLeagues"
//     SET "rating" = 0
//     WHERE "leagueId" = 1 AND "battles" = 0;`;

//     const [rows, result] = await db.query(RFM_users_query, { raw: true });
//     const count = result.rowCount;
//     if (res) {
//       return res.status(200).send({
//         success:true,
//         data:null,
//          msg: `Successfully updated data ${count} users on database`
//         });
//     }
//     return `Successfully updated data ${count} users on database`
//   } catch (error) {
//     console.log(error);
//     if (res) {
//       return res.status(500).send({ success: false,
//         data:null,
//         msg:error 
//         });
//     }
//     return error;
//   }
// }

// async function seasonEndResetBlockchainData(req, res) {
//   try {
//     const RFM_users_query = `SELECT u.id, u."walletAddress", u.name AS username, ul."leagueId", leagues.name AS league, ul.rating AS points, ul.wins, ul.loose AS loses, ul.draw AS draws FROM users AS u
//     JOIN (
//       SELECT * FROM "userLeagues"
//       WHERE id IN (SELECT max(id) FROM "userLeagues" GROUP BY id)
//     ) AS ul
//     LEFT JOIN leagues ON ul."leagueId" = leagues.id ON u.id = ul."userId"
//     WHERE u."isDeleted" = false AND "walletAddress" IS NOT NULL`;

//     const [rows, result] = await db.query(RFM_users_query, { raw: true });
//     const count = result.rowCount;

//     const wallets = [];
//     const walletData = [];

//     console.log('Fetching users from the database');

//     for (let u of rows) {
//       if (u.walletAddress) wallets.push(u.walletAddress);
//     const getUserFuel= await onchain.getUser(u.walletAddress);
//       const meta = {
//         league: u['league'] || 'Trial',
//         points: u['points'] || 0,
//         chests: 0,
//         chestRewards: [],
//         missionCount: 0,
//         fuel: getUserFuel.fuel || 0 , //how to manage fuel for future 
//         wins: u['wins'] || 0,
//         loses: u['loses'] || 0,
//         draws: u['draws'] || 0,
//       };
//       walletData.push(meta);
//     }

//     console.log('Update user league on blockchain with data');

//     const batchSize = 20;
//     const totalBatches = Math.ceil(wallets.length / batchSize);

//     for (let i = 0; i < totalBatches; i++) {
//       const startIndex = i * batchSize;
//       const endIndex = startIndex + batchSize;
//       const batchWallets = wallets.slice(startIndex, endIndex);
//       const batchData = walletData.slice(startIndex, endIndex);

//       console.log(`Processing batch ${i + 1}`);

//       try {
//         const userUpdates = await blockchain.update_user_league_blockchain(batchWallets, batchData);

//         console.log(`User updates for batch ${i + 1}:`, userUpdates);

//         console.log(`Successfully migrated ${batchWallets.length} users to contract`);
//       } catch (error) {
//         console.error(`Error processing batch ${i + 1}:`, error);
//         // Handle the error if needed
//       }
//     }
//     if (res) {
//       return res.status(200).send({ msg: `Successfully migrated all users to contract`, count, walletData });
//     }
//     return { msg: `Successfully migrated all users to contract`, count, walletData }

//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ success: false, error });
//   }
// }

// async function setFuelOnBlockchain(req, res) {
//   try {
//     const RFM_users_query = `SELECT u.id, u."walletAddress", u.name AS username, ul."leagueId", leagues.name AS league, ul.rating AS points, ul.wins, ul.loose AS loses, ul.draw AS draws FROM users AS u
//     JOIN (
//       SELECT * FROM "userLeagues"
//       WHERE id IN (SELECT max(id) FROM "userLeagues" GROUP BY id)
//     ) AS ul
//     LEFT JOIN leagues ON ul."leagueId" = leagues.id ON u.id = ul."userId"
//     WHERE u."isDeleted" = false AND "walletAddress" IS NOT NULL`;

//     const [rows, result] = await db.query(RFM_users_query, { raw: true });
//     const count = result.rowCount;
// console.log(rows,'---rows');
//     const wallets = [];
//     const walletData = [];

//     console.log('Fetching users from the database');
//     for (let u of rows) {
//       if (u.walletAddress) wallets.push(u.walletAddress);
//       const meta = {
//         league: u['league'] || 'Bronze 1',
//         points: u['points'] || 0,
//         chests: 0,
//         chestRewards: [],
//         missionCount: 0,
//         fuel: initialFuel,
//         wins: u['wins'] || 0,
//         loses: u['loses'] || 0,
//         draws: u['draws'] || 0,
//       };
//       walletData.push(meta);
//     }
//     console.log('Update user league on blockchain with data');

//     const batchSize = 20;
//     const totalBatches = Math.ceil(wallets.length / batchSize);

//     for (let i = 0; i < totalBatches; i++) {
//       const startIndex = i * batchSize;
//       const endIndex = startIndex + batchSize;
//       const batchWallets = wallets.slice(startIndex, endIndex);
//       const batchData = walletData.slice(startIndex, endIndex);

//       console.log(`Processing batch ${i + 1}`);

//       try {
//         const userUpdates = await blockchain.update_user_league_blockchain(batchWallets, batchData);

//         console.log(`User updates for batch ${i + 1}:`, userUpdates);

//         console.log(`Successfully migrated ${batchWallets.length} users to contract`);
//       } catch (error) {
//         console.error(`Error processing batch ${i + 1}:`, error);
//         // Handle the error if needed
//       }
//     }
//     if (res) {
//       return res.status(200).send({ msg: `Successfully migrated all users to contract`, count, walletData });
//     }
//     return { msg: `Successfully migrated all users to contract`, count, walletData }

//   } catch (error) {
//     console.log(error);
//     return res.status(500).send({ success: false, error });
//   }
// }

// async function battleReset(req, res) {
//   try {
//     const RFM_users_query = `UPDATE "userLeagues"
//     SET
//         battles=0`;
//     const [rows, result] = await db.query(RFM_users_query, { raw: true });
//     const count = result.rowCount;
//     if (res) {
//       return res.status(200).send({
//         success:true,
//         data:null,
//          msg: `Successfully batlles data ${count} users on database`
//         });
//     }
//     return `Successfully batlles data ${count} users on database`
//   } catch (error) {
//     console.log(error);
//     if (res) {
//       return res.status(500).send({ success: false,
//         data:null,
//         msg:error
//         });
//     }
//     return error;
//   }
// }

// async function resetWinLose(req, res) {
//   try {
//     const RFM_users_query = `UPDATE "userLeagues"
//     SET
//         win=0,loose=0,draw=0`;
//     const [rows, result] = await db.query(RFM_users_query, { raw: true });
//     const count = result.rowCount;
//     if (res) {
//       return res.status(200).send({
//         success:true,
//         data:null,
//          msg: `Successfully batlles data ${count} users on database`
//         });
//     }
//     return `Successfully batlles data ${count} users on database`
//   } catch (error) {
//     console.log(error);
//     if (res) {
//       return res.status(500).send({ success: false,
//         data:null,
//         msg:error
//         });
//     }
//     return error;
//   }
// }

// // console.log(await getUsers());
// module.exports = { getRFMUsers,sessionEndCalculateRank,seasonEndResetBlockchainData,setFuelOnBlockchain,battleReset,resetWinLose };
