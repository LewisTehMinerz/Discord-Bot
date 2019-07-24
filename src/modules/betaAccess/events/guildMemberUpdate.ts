import * as Discord from "discord.js";
import { MongoClient } from "../../../database/client";

var { supporter, patron, beta, booster } = require("../../../roles.json"),
  coll = MongoClient.db("PreMiD").collection("betaAccess");

module.exports = async (
  oldMember: Discord.GuildMember,
  newMember: Discord.GuildMember
) => {
  //* If user is patron and does not have either supporter or beta role, give it to them
  if (
    newMember.roles.has(patron) &&
    (!newMember.roles.has(supporter) || !newMember.roles.has(beta))
  ) {
    newMember.roles.add([supporter, beta]);

    if (!(await coll.findOne({ userId: newMember.id })))
      await coll.insertOne({ userId: newMember.id });

    return;
  }

  //* If user boosts and doesn't have beta role, give it to them
  if (newMember.roles.has(booster) && !newMember.roles.has(beta)) {
    newMember.roles.add(beta);

    coll.insertOne({ userId: newMember.id });

    return;
  }

  //* Remove beta access when boost expires
  if (oldMember.roles.has(booster) && !newMember.roles.has(booster)) {
    newMember.roles.remove(beta);

    coll.findOneAndDelete({ userId: newMember.id });

    return;
  }
};
