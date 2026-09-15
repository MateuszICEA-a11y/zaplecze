const test = require('node:test');
const assert = require('node:assert/strict');
const BwpCost = require('./cost-model.js');

test('defaults expose the two scenarios without sharing mutable state', () => {
  const b = BwpCost.defaults();
  const c = BwpCost.defaults('C');
  assert.equal(b.scenario, 'B');
  assert.equal(b.route, 'hybrid');
  assert.equal(b.sharedInfra, 0);
  assert.equal(b.launchHours, 8);
  assert.equal(c.scenario, 'C');
  assert.equal(c.route, 'api');
  assert.equal(c.portals, 250);
  assert.equal(c.sharedInfra, 200);
  assert.equal(c.launchHours, 3);
  assert.equal(b.monthlyPosts, 10);
  assert.equal(b.articleMinutes, 15);
  assert.equal(c.startPosts, 60);
  assert.equal(c.articleMinutes, 2);
  assert.equal(b.toolsMonthly, 180);
  assert.equal(c.toolsMonthly, 2500);
  b.portals = 1;
  assert.equal(BwpCost.defaults().portals, 15);
});

test('synthetic arithmetic keeps shared costs once and separates cash from labour', () => {
  const result = BwpCost.calculate({
    scenario: 'B', route: 'hybrid', portals: 2,
    rate: 60, fx: 2, startPosts: 1, monthlyPosts: 2, clientPosts: 1,
    articleMinutes: 30, clientExtraMinutes: 15, images: 2, retryPercent: 0,
    subUsd: 10, sharedInfra: 5, toolsMonthly: 0, domain: 7, hosting: 3,
    launchHours: 4, sharedSetupHours: 5, upkeepHours: 1,
    sharedUpkeepHours: 2, sharedStart: 11,
    writerIn: 1000, writerOut: 2000, writerInputPrice: 1,
    writerOutputPrice: 2, researchIn: 1000, researchOut: 1000,
    researchCalls: 1, researchInputPrice: 1, researchOutputPrice: 1,
    researchRequestPrice: 0.5, editorIn: 1000, editorOut: 1000,
    editorInputPrice: 1, editorOutputPrice: 1,
    imageModel: 'nano', resolution: '1K', imageNano1K: 0.1,
    imageNano2K: 0.2, imageNano4K: 0.3, imageGpt1K: 0.4,
    imageGpt2K: 0.5, imageGpt4K: 0.6, successPercent: 50
  });
  // writer=.005, research=.502, images=.2; FX=2; human=30 PLN.
  assert.equal(result.writerUsd, 0.005);
  assert.equal(result.researchUsd, 0.502);
  assert.equal(result.imageUnitUsd, 0.2);
  assert.ok(Math.abs(result.apiUnit - 1.414) < 1e-12);
  assert.equal(result.humanUnit, 30);
  assert.ok(Math.abs(result.unit - 31.414) < 1e-12);
  assert.ok(Math.abs(result.clientUnit - 46.414) < 1e-12);
  assert.equal(result.sharedCapex, 311);
  assert.equal(result.sharedMonthly, 145);
  assert.ok(Math.abs(result.startupPerPortal - (31.414 + 247)) < 1e-12);
  assert.ok(Math.abs(result.monthlyPerPortal - (1 * 60 + 3 + 2 * 31.414 + 46.414)) < 1e-12);
  assert.equal(result.capex, 311 + 2 * result.startupPerPortal);
  assert.equal(result.annual, result.capex + 12 * (145 + 2 * result.monthlyPerPortal));
  assert.ok(Math.abs(result.annualCash - (11 + 2 * (7 + 1 * 1.414) + 12 * (5 + 10 * 2 + 2 * (3 + 3 * 1.414)))) < 1e-12);
  assert.ok(Math.abs(result.annualLabor - (result.annual - result.annualCash)) < 1e-12);
  assert.equal(result.initialArticleCount, 2);
  assert.equal(result.monthlyArticleCount, 6);
});

test('doubling article volume changes variable totals while shared costs stay fixed', () => {
  const base = BwpCost.calculate({
    portals: 1, startPosts: 2, monthlyPosts: 3, clientPosts: 1,
    sharedSetupHours: 10, sharedUpkeepHours: 4, launchHours: 1,
    upkeepHours: 0, rate: 100, hosting: 0, sharedInfra: 0,
    subUsd: 0, sharedStart: 0, toolsMonthly: 0
  });
  const doubled = BwpCost.calculate({
    portals: 1, startPosts: 4, monthlyPosts: 6, clientPosts: 2,
    sharedSetupHours: 10, sharedUpkeepHours: 4, launchHours: 1,
    upkeepHours: 0, rate: 100, hosting: 0, sharedInfra: 0,
    subUsd: 0, sharedStart: 0, toolsMonthly: 0
  });
  assert.equal(doubled.sharedCapex, base.sharedCapex);
  assert.equal(doubled.sharedMonthly, base.sharedMonthly);
  assert.equal(doubled.setupHours - 10 - 1, 2 * (base.setupHours - 10 - 1));
  assert.equal(doubled.monthlyHours - 4, 2 * (base.monthlyHours - 4));
  const fixedPerYear = 1 * 100 + 100 + 12 * 0;
  assert.ok(Math.abs(
    doubled.annual - doubled.sharedCapex - 12 * doubled.sharedMonthly - fixedPerYear -
      2 * (base.annual - base.sharedCapex - 12 * base.sharedMonthly - fixedPerYear)
  ) < 1e-9);
});

test('routes and image variants change only their intended API components', () => {
  const input = Object.assign({}, BwpCost.defaults('B'), {
    portals: 1, startPosts: 0, monthlyPosts: 0, clientPosts: 0,
    images: 1, imageNano1K: 0.04, imageNano2K: 0.06, imageNano4K: 0.09,
    imageGpt1K: 0.03, imageGpt2K: 0.05, imageGpt4K: 0.08
  });
  const hybrid = BwpCost.calculate(input);
  const api = BwpCost.calculate(Object.assign({}, input, {route: 'api'}));
  const fourK = BwpCost.calculate(Object.assign({}, input, {imageModel: 'gpt', resolution: '4K'}));
  assert.equal(hybrid.editorApiUsd, 0);
  assert(hybrid.apiUnit < api.apiUnit);
  assert.ok(Math.abs(fourK.imageUnitUsd - 0.08) < 1e-12);
  assert.equal(fourK.editorApiUsd, 0);
  assert.ok(Math.abs(fourK.apiUnit - hybrid.apiUnit - (0.08 - 0.04) * 1.25 * input.fx) < 1e-12);
});

test('invalid values throw instead of being coerced', () => {
  for (const [key, value] of [
    ['rate', ''], ['fx', 0], ['portals', 0], ['portals', 1001],
    ['startPosts', 1.5], ['monthlyPosts', -1], ['clientPosts', '2'],
    ['images', Number.NaN], ['successPercent', 0], ['successPercent', 101],
    ['scenario', 'D'], ['route', 'subscription'], ['imageModel', 'nano-pro'],
    ['resolution', '8K']
  ]) {
    assert.throws(() => BwpCost.calculate(Object.assign({}, BwpCost.defaults(), {[key]: value})), Error);
  }
});

test('employee teams support hourly and monthly costs with weighted work shares', () => {
  const config = Object.assign({}, BwpCost.defaults('B'), {
    rate: 250,
    portals: 2,
    employees: [
      {name: 'Hourly', costType: 'hourly', cost: 120, availableHours: 1000, weight: 1},
      {name: 'Monthly', costType: 'monthly', cost: 50000, availableHours: 1000, weight: 3}
    ]
  });
  const before = JSON.stringify(config);
  const result = BwpCost.calculate(config);
  assert.equal(config.rate, 250);
  assert.equal(JSON.stringify(config), before);
  assert.equal(result.effectiveRate, 67.5);
  assert.equal(result.teamAvailableHours, 2000);
  assert.equal(result.teamMonthlyCostAtCapacity, 170000);
  assert.equal(result.employeeBreakdown.length, 2);
  assert.equal(result.employeeBreakdown[0].hourlyRate, 120);
  assert.equal(result.employeeBreakdown[1].hourlyRate, 50);
  assert.equal(result.employeeBreakdown[0].share, 0.25);
  assert.equal(result.employeeBreakdown[1].share, 0.75);
  assert.equal(result.employeeBreakdown[0].monthlyHours, result.monthlyHours * 0.25);
  assert.equal(result.employeeBreakdown[1].setupHours, result.setupHours * 0.75);
  assert.equal(result.teamOverloaded, false);
  const monthlyCost = result.employeeBreakdown.reduce((sum, employee) => sum + employee.monthlyCost, 0);
  const setupCost = result.employeeBreakdown.reduce((sum, employee) => sum + employee.setupCost, 0);
  assert.ok(Math.abs(monthlyCost - result.monthlyHours * result.effectiveRate) < 1e-9);
  assert.ok(Math.abs(setupCost + 12 * monthlyCost - result.annualLabor) < 1e-7);
});

test('employee capacity and overload are reported from assigned work', () => {
  const result = BwpCost.calculate(Object.assign({}, BwpCost.defaults(), {
    portals: 1,
    sharedUpkeepHours: 2,
    employees: [
      {name: 'Small team', costType: 'hourly', cost: 80, availableHours: 1, weight: 1}
    ]
  }));
  assert.equal(result.employeeBreakdown[0].availableHours, 1);
  assert.equal(result.employeeBreakdown[0].overloaded, true);
  assert.equal(result.teamOverloaded, true);

  const setupOnly = BwpCost.calculate(Object.assign({}, BwpCost.defaults(), {
    portals: 1,
    sharedUpkeepHours: 0,
    upkeepHours: 0,
    monthlyPosts: 0,
    clientPosts: 0,
    employees: [
      {name: 'Setup only', costType: 'hourly', cost: 80, availableHours: 1, weight: 1}
    ]
  }));
  assert(setupOnly.employeeBreakdown[0].setupHours > setupOnly.employeeBreakdown[0].availableHours);
  assert.equal(setupOnly.employeeBreakdown[0].monthlyHours, 0);
  assert.equal(setupOnly.employeeBreakdown[0].overloaded, false);
  assert.equal(setupOnly.teamOverloaded, false);
});

test('invalid employee rows throw and calculateTeam remains available as a pure helper', () => {
  for (const employees of [
    [],
    [{name: 'x', costType: 'hourly', cost: 1, availableHours: 0, weight: 1}],
    [{name: 'x', costType: 'hourly', cost: 1, availableHours: 1, weight: 0}],
    [{name: ' ', costType: 'hourly', cost: 1, availableHours: 1, weight: 1}],
    [{name: 'x', costType: 'other', cost: 1, availableHours: 1, weight: 1}],
    [{name: 'x', costType: 'monthly', cost: '', availableHours: 1, weight: 1}]
  ]) {
    assert.throws(() => BwpCost.calculate(Object.assign({}, BwpCost.defaults(), {employees})), Error);
    assert.throws(() => BwpCost.calculateTeam(employees), Error);
  }
  const team = BwpCost.calculateTeam([
    {name: 'x', costType: 'hourly', cost: 10, availableHours: 10, weight: 1}
  ], 4, 8);
  assert.equal(team.effectiveRate, 10);
  assert.equal(team.employeeBreakdown[0].monthlyCost, 40);
  assert.equal(team.employeeBreakdown[0].setupCost, 80);
});

test('default team, tools cost, flat-rate variant and setup months are exposed', () => {
  const team = BwpCost.defaultEmployees();
  assert.equal(team.length, 2);
  assert.equal(team[1].costType, 'monthly');
  team[0].cost = 1;
  assert.equal(BwpCost.defaultEmployees()[0].cost, 250);
  const flat = BwpCost.calculate({scenario: 'B'});
  const withTeam = BwpCost.calculate({scenario: 'B', employees: BwpCost.defaultEmployees()});
  assert.equal(flat.flatUnit, flat.unit);
  assert.equal(withTeam.flatUnit, flat.unit);
  assert(withTeam.unit < withTeam.flatUnit);
  assert.equal(withTeam.effectiveRate, (250 + 3 * 9000 / 160) / 4);
  assert.equal(flat.capacityHours, 160);
  assert.equal(withTeam.capacityHours, 320);
  assert.equal(withTeam.setupMonths, withTeam.setupHours / 320);
  const noTools = BwpCost.calculate({scenario: 'B', toolsMonthly: 0});
  assert.equal(flat.sharedMonthly - noTools.sharedMonthly, 180);
  assert.equal(flat.annualCash - noTools.annualCash, 12 * 180);
});
