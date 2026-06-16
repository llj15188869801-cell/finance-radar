import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMarketPulseEvents, parseEastmoneySectors, parseTencentCommodities, parseTencentIndexes } from "./market-pulse.js";

describe("automatic market pulse", () => {
  it("parses public index and commodity responses", () => {
    const indexes = parseTencentIndexes('v_s_sh000001="1~上证指数~000001~4096.47~64.96~1.61";v_usIXIC="200~纳斯达克~.IXIC~26683.94~~~~~~~~~~~~~~~~~~~~~~~~~~~2026-06-15 16:57:00~795.10~3.07";');
    const commodities = parseTencentCommodities('v_hf_CL="81.26,-4.26,81.15,81.16,82.42,79.70,04:57:03,84.88,81.40,0,1,5,2026-06-16,纽约原油";');
    assert.equal(indexes[0]?.name, "上证指数");
    assert.equal(indexes[0]?.changePercent, 1.61);
    assert.equal(commodities[0]?.changePercent, -4.26);
  });

  it("builds Chinese market outcome events without filing notices", () => {
    const indexes = parseTencentIndexes([
      'v_s_sh000001="1~上证指数~000001~4096.47~64.96~1.61"',
      'v_s_sz399001="51~深证成指~399001~15531.11~567.70~3.79"',
      'v_s_sz399006="51~创业板指~399006~4033.53~203.18~5.30"',
    ].join(";"));
    const sectors = parseEastmoneySectors('{"data":{"diff":[{"f14":"钼","f3":9.99},{"f14":"商业航天","f3":8.88}]}}');
    const events = buildMarketPulseEvents(indexes, [], sectors, new Date("2026-06-15T12:00:00Z"));
    assert.match(events[0]?.title ?? "", /A股主要指数集体上涨/);
    assert.match(events[0]?.summary ?? "", /截至公开行情抓取时，上证指数报4096.47点/);
    assert.equal(events.some((event) => /表格申报|CIK/.test(event.title)), false);
  });

  it("does not call mixed directions collective or synchronized", () => {
    const indexes = parseTencentIndexes([
      'v_s_sh000001="1~上证指数~000001~4096.47~64.96~1.61"',
      'v_s_sz399001="51~深证成指~399001~15531.11~-10.00~-0.10"',
      'v_s_sz399006="51~创业板指~399006~4033.53~203.18~5.30"',
      'v_usDJI="200~道琼斯~.DJI~51671.03~~~~~~~~~~~~~~~~~~~~~~~~~~~2026-06-15 16:46:10~468.77~0.92"',
      'v_usIXIC="200~纳斯达克~.IXIC~26683.94~~~~~~~~~~~~~~~~~~~~~~~~~~~2026-06-15 16:57:00~-10.00~-0.20"',
      'v_usINX="200~标普500~.INX~7554.29~~~~~~~~~~~~~~~~~~~~~~~~~~~2026-06-15 16:40:14~122.83~1.65"',
    ].join(";"));
    const commodities = parseTencentCommodities([
      'v_hf_CL="81.26,4.26,81.15,81.16,82.42,79.70,04:57:03,84.88,81.40,0,1,5,2026-06-16,纽约原油"',
      'v_hf_OIL="83.41,-4.49,83.50,83.52,85.93,82.40,04:56:51,87.33,85.00,0,2,4,2026-06-16,布伦特原油"',
    ].join(";"));
    const events = buildMarketPulseEvents(indexes, commodities, [], new Date("2026-06-15T12:00:00Z"));
    assert.match(events.find((event) => event.category === "A股行情")?.title ?? "", /涨跌不一/);
    assert.match(events.find((event) => event.category === "美股行情")?.title ?? "", /涨跌不一/);
    assert.match(events.find((event) => event.slug.includes("crude-oil"))?.title ?? "", /走势分化/);
  });
});
