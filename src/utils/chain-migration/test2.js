/**
 * This script is totally independent from server code base, but dependent on chain address, please update contract address before running this script and
    // !!  Be Extra Careful before running this.
 */

const { Client } = require('pg');
require('dotenv').config();
const blockchain = require('../../web3');

async function get_uesrs() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST_READER,
    database: process.env.DB,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT
  });
  console.log(process.env.DB_USER, process.env.DB_HOST_READER, process.env.DB);
  try {
    //* fetching all users from xana database where wallet address exists and user is of RFM
    const RFM_users_query = `select u.id, u."walletAddress", u.name as username, ul."leagueId", leagues.name as league, ul.rating as points, ul.wins, ul.loose as loses, ul.draw as draws  from users as u
  join (
      select * from "userLeagues"
      where id in (select max(id) from "userLeagues" group by id)
  ) as ul
  left join leagues on ul."leagueId" = leagues.id on u.id = ul."userId"
  where u."isDeleted"=false and "walletAddress" is not null and u."userInfo"=3`;

    const wallets = [];
    const walletData = [];
    console.log('fetching users from database');
    const data = await client
      .query(RFM_users_query)
      .then(({ rows }) => {
        console.log(rows);
        for (let u of rows) {
          // console.log(u);
          if (u.walletAddress) wallets.push(u.walletAddress);
          const meta = {
            league: u['league'] || 'Trial',
            points: u['points'] || 0,
            chests: 0,
            chestRewards: [],
            missionCount: 0,
            fuel: 0,
            wins: u['wins'] || 0,
            loses: u['loses'] || 0,
            draws: u['draws'] || 0
          };
          walletData.push(meta);
        }
        return { wallets, walletData };
      })
      .catch((e) => {
        console.log(e);
      });
    console.log(data);
    client.end();
    return data;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

async function RFM_user_migration() {
  try {
    const { wallets, walletData } = await get_uesrs();
    // * need to update users one by one with delay until one update finishes, otherwise we get replacement fee too low/ nonce already used Errors.
    wallets
      .reduce(function (p, wallet, i) {
        return p.then(async () => {
          //   return await blockchain.update_user_league(wallet, walletData[i]);
          return;
        });
      }, Promise.resolve())
      .then(() => {
        // all done here
        console.log(`successfully migrated ${wallets.length} users to contract`);
      })
      .catch((err) => {
        // process error hereconsole.log(error);
        console.log(err);
        process.exit(1);
      });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

// RFM_user_migration();
