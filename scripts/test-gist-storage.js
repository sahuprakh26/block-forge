"use strict";
const lb = require("../lib/leaderboard");
console.log("storage:", lb.storageMode());
lb.getLeaderboard("endless", 5)
  .then((r) => {
    console.log("rows:", r.length);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
