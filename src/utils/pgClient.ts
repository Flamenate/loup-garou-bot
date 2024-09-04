import fs from "node:fs";
import { Client, ClientConfig } from "pg";

const config: ClientConfig = {
    user: "avnadmin",
    password: process.env.PG_PASSWORD,
    host: "pg-loup-loupdb.c.aivencloud.com",
    port: 10684,
    database: "defaultdb",
    ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync("./ca.pem").toString(),
    },
};

const pgClient = new Client(config);
pgClient.connect(function (err) {
    if (err) throw err;
    pgClient.query("SELECT VERSION()", [], function (err, result) {
        console.log(result.rows[0].version);
    });
    pgClient.on("error", console.error);
});

export default pgClient;
