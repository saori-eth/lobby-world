import { createRaidApp } from "@shared/gametype/raid.js";

export default (world, app, fetch, props, setTimeout) => {
  createRaidApp(world, app, { maxHp: 100 });
};
