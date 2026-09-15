(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BwpCost = factory();
  }
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  // Prices in USD, labour and all calculated totals in PLN.
  var NUMERIC_KEYS = [
    'rate', 'fx', 'portals', 'startPosts', 'monthlyPosts', 'clientPosts',
    'articleMinutes', 'clientExtraMinutes', 'images', 'retryPercent',
    'subUsd', 'sharedInfra', 'toolsMonthly', 'domain', 'hosting', 'launchHours',
    'sharedSetupHours', 'upkeepHours', 'sharedUpkeepHours', 'sharedStart',
    'writerIn', 'writerOut', 'writerInputPrice', 'writerOutputPrice',
    'researchIn', 'researchOut', 'researchCalls', 'researchInputPrice',
    'researchOutputPrice', 'researchRequestPrice', 'editorIn', 'editorOut',
    'editorInputPrice', 'editorOutputPrice', 'imageNano1K', 'imageNano2K',
    'imageNano4K', 'imageGpt1K', 'imageGpt2K', 'imageGpt4K', 'successPercent'
  ];
  var INTEGER_KEYS = ['portals', 'startPosts', 'monthlyPosts', 'clientPosts', 'images'];
  var SCENARIOS = ['B', 'C'];
  var ROUTES = ['hybrid', 'api'];
  var IMAGE_MODELS = ['nano', 'gpt'];
  var RESOLUTIONS = ['1K', '2K', '4K'];

  var COMMON_DEFAULTS = {
    rate: 250,
    fx: 4,
    portals: 15,
    clientPosts: 0,
    clientExtraMinutes: 10,
    images: 1,
    retryPercent: 25,
    subUsd: 100,
    domain: 100,
    hosting: 0,
    sharedStart: 0,
    writerIn: 16000,
    writerOut: 8000,
    writerInputPrice: 1.5,
    writerOutputPrice: 9,
    researchIn: 12000,
    researchOut: 4000,
    researchCalls: 2,
    researchInputPrice: 1,
    researchOutputPrice: 1,
    researchRequestPrice: 0.008,
    editorIn: 12000,
    editorOut: 4000,
    editorInputPrice: 3,
    editorOutputPrice: 15,
    imageModel: 'nano',
    resolution: '1K',
    imageNano1K: 0.04,
    imageNano2K: 0.06,
    imageNano4K: 0.09,
    imageGpt1K: 0.03,
    imageGpt2K: 0.05,
    imageGpt4K: 0.08,
    successPercent: 50
  };

  function defaults(scenario) {
    var selected = scenario === undefined ? 'B' : scenario;
    if (SCENARIOS.indexOf(selected) === -1) {
      throw new Error('scenario must be B or C');
    }
    var scenarioDefaults = selected === 'C'
      ? {
          scenario: 'C',
          route: 'api',
          portals: 250,
          startPosts: 60,
          monthlyPosts: 6,
          articleMinutes: 2,
          sharedInfra: 200,
          toolsMonthly: 2500,
          launchHours: 3,
          sharedSetupHours: 240,
          upkeepHours: 0.25,
          // 18 h supervision + about 80 h/month of sampled QA (half an editor FTE).
          sharedUpkeepHours: 98
        }
      : {
          scenario: 'B',
          route: 'hybrid',
          startPosts: 100,
          monthlyPosts: 10,
          articleMinutes: 15,
          sharedInfra: 0,
          toolsMonthly: 180,
          launchHours: 8,
          sharedSetupHours: 36,
          upkeepHours: 1,
          sharedUpkeepHours: 6
        };
    return Object.assign({}, COMMON_DEFAULTS, scenarioDefaults);
  }

  // Baseline team: senior operator on an hourly rate plus a junior on a
  // monthly cost. Weights 1:3 mean the junior carries 3/4 of every hour.
  function defaultEmployees() {
    return [
      {name: 'Senior / operator', costType: 'hourly', cost: 250, availableHours: 160, weight: 1},
      {name: 'Junior SEO', costType: 'monthly', cost: 9000, availableHours: 160, weight: 3}
    ];
  }

  function assertFiniteNonNegative(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(name + ' must be a finite number >= 0');
    }
  }

  function validateEmployees(employees) {
    if (!Array.isArray(employees) || employees.length === 0) {
      throw new Error('employees must be a non-empty array');
    }
    employees.forEach(function (employee, index) {
      var prefix = 'employees[' + index + ']';
      if (employee === null || typeof employee !== 'object' || Array.isArray(employee)) {
        throw new Error(prefix + ' must be an object');
      }
      if (typeof employee.name !== 'string' || employee.name.trim().length === 0) {
        throw new Error(prefix + '.name must be a non-empty string');
      }
      if (employee.costType !== 'hourly' && employee.costType !== 'monthly') {
        throw new Error(prefix + '.costType must be hourly or monthly');
      }
      assertFiniteNonNegative(employee.cost, prefix + '.cost');
      if (typeof employee.availableHours !== 'number' ||
          !Number.isFinite(employee.availableHours) || employee.availableHours <= 0) {
        throw new Error(prefix + '.availableHours must be a finite number > 0');
      }
      if (typeof employee.weight !== 'number' ||
          !Number.isFinite(employee.weight) || employee.weight <= 0) {
        throw new Error(prefix + '.weight must be a finite number > 0');
      }
    });
  }

  function calculateTeam(employees, monthlyHours, setupHours) {
    validateEmployees(employees);
    if (monthlyHours === undefined) monthlyHours = 0;
    if (setupHours === undefined) setupHours = 0;
    assertFiniteNonNegative(monthlyHours, 'monthlyHours');
    assertFiniteNonNegative(setupHours, 'setupHours');

    var totalWeight = employees.reduce(function (sum, employee) {
      return sum + employee.weight;
    }, 0);
    var rates = employees.map(function (employee) {
      return employee.costType === 'hourly'
        ? employee.cost
        : employee.cost / employee.availableHours;
    });
    var effectiveRate = employees.reduce(function (sum, employee, index) {
      return sum + rates[index] * employee.weight;
    }, 0) / totalWeight;
    var teamAvailableHours = employees.reduce(function (sum, employee) {
      return sum + employee.availableHours;
    }, 0);
    var teamMonthlyCostAtCapacity = employees.reduce(function (sum, employee, index) {
      return sum + rates[index] * employee.availableHours;
    }, 0);
    var employeeBreakdown = employees.map(function (employee, index) {
      var share = employee.weight / totalWeight;
      var assignedMonthlyHours = monthlyHours * share;
      var assignedSetupHours = setupHours * share;
      return {
        name: employee.name,
        hourlyRate: rates[index],
        share: share,
        monthlyHours: assignedMonthlyHours,
        monthlyCost: assignedMonthlyHours * rates[index],
        setupHours: assignedSetupHours,
        setupCost: assignedSetupHours * rates[index],
        availableHours: employee.availableHours,
        overloaded: assignedMonthlyHours > employee.availableHours
      };
    });

    return {
      effectiveRate: effectiveRate,
      teamAvailableHours: teamAvailableHours,
      teamMonthlyCostAtCapacity: teamMonthlyCostAtCapacity,
      employeeBreakdown: employeeBreakdown,
      teamOverloaded: employeeBreakdown.some(function (employee) {
        return employee.overloaded;
      })
    };
  }

  function validate(config) {
    NUMERIC_KEYS.forEach(function (key) {
      assertFiniteNonNegative(config[key], key);
    });

    if (!(config.fx > 0)) {
      throw new Error('fx must be > 0');
    }
    if (!Number.isInteger(config.portals) || config.portals < 1 || config.portals > 1000) {
      throw new Error('portals must be an integer from 1 to 1000');
    }
    INTEGER_KEYS.forEach(function (key) {
      if (!Number.isInteger(config[key])) {
        throw new Error(key + ' must be an integer >= 0');
      }
    });
    if (!(config.successPercent > 0 && config.successPercent <= 100)) {
      throw new Error('successPercent must be > 0 and <= 100');
    }
    if (SCENARIOS.indexOf(config.scenario) === -1) {
      throw new Error('scenario must be B or C');
    }
    if (ROUTES.indexOf(config.route) === -1) {
      throw new Error('route must be hybrid or api');
    }
    if (IMAGE_MODELS.indexOf(config.imageModel) === -1) {
      throw new Error('imageModel must be nano or gpt');
    }
    if (RESOLUTIONS.indexOf(config.resolution) === -1) {
      throw new Error('resolution must be 1K, 2K or 4K');
    }
  }

  function calculate(input) {
    if (input === undefined) input = {};
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('config must be an object');
    }

    // Defaults are applied only to omitted properties. An explicitly supplied
    // blank, null or undefined value remains invalid and is never coerced.
    var scenario = Object.prototype.hasOwnProperty.call(input, 'scenario')
      ? input.scenario
      : 'B';
    var config = Object.assign({}, defaults(scenario), input);
    validate(config);

    var hasEmployees = Object.prototype.hasOwnProperty.call(config, 'employees');

    // Keep cfg.rate intact for callers and use a local effective rate whenever
    // a team is supplied. This also makes the no-team path exactly backwards
    // compatible with the original single-rate model.
    var setupHours = config.sharedSetupHours + config.portals * (
      config.launchHours + config.startPosts * config.articleMinutes / 60
    );
    var monthlyHours = config.sharedUpkeepHours + config.portals * (
      config.upkeepHours + config.monthlyPosts * config.articleMinutes / 60 +
      config.clientPosts * (config.articleMinutes + config.clientExtraMinutes) / 60
    );
    var team = hasEmployees
      ? calculateTeam(config.employees, monthlyHours, setupHours)
      : {
          effectiveRate: config.rate,
          teamAvailableHours: 0,
          teamMonthlyCostAtCapacity: 0,
          employeeBreakdown: [],
          teamOverloaded: false
        };
    var effectiveRate = team.effectiveRate;

    var writerUsd = (
      config.writerIn * config.writerInputPrice +
      config.writerOut * config.writerOutputPrice
    ) / 1000000;
    var researchUsd = (
      config.researchIn * config.researchInputPrice +
      config.researchOut * config.researchOutputPrice
    ) / 1000000 + config.researchCalls * config.researchRequestPrice;
    var editorApiUsd = config.route === 'api'
      ? (
          config.editorIn * config.editorInputPrice +
          config.editorOut * config.editorOutputPrice
        ) / 1000000
      : 0;
    var imagePriceKey = 'image' + (config.imageModel === 'nano' ? 'Nano' : 'Gpt') + config.resolution;
    var imagePriceUsd = config[imagePriceKey];
    var imageUnitUsd = config.images * imagePriceUsd;
    var apiSubtotalUsd = writerUsd + researchUsd + editorApiUsd + imageUnitUsd;
    var retryMultiplier = 1 + config.retryPercent / 100;
    var apiUnit = apiSubtotalUsd * retryMultiplier * config.fx;
    var humanUnit = config.articleMinutes / 60 * effectiveRate;
    var unit = apiUnit + humanUnit;
    var clientUnit = unit + config.clientExtraMinutes / 60 * effectiveRate;

    var startupPerPortal = config.launchHours * effectiveRate + config.domain + config.startPosts * unit;
    var monthlyPerPortal = config.upkeepHours * effectiveRate + config.hosting +
      config.monthlyPosts * unit + config.clientPosts * clientUnit;
    var sharedCapex = config.sharedSetupHours * effectiveRate + config.sharedStart;
    var sharedMonthly = config.sharedUpkeepHours * effectiveRate + config.sharedInfra +
      config.toolsMonthly + config.subUsd * config.fx;
    var capex = sharedCapex + config.portals * startupPerPortal;
    var opex = sharedMonthly + config.portals * monthlyPerPortal;
    var annual = capex + 12 * opex;
    var marginalYear = startupPerPortal + 12 * monthlyPerPortal;
    var allocatedYear = annual / config.portals;
    var perSuccess = allocatedYear / (config.successPercent / 100);
    var annualCash = config.sharedStart + config.portals * (
      config.domain + config.startPosts * apiUnit
    ) + 12 * (
      config.sharedInfra + config.toolsMonthly + config.subUsd * config.fx +
      config.portals * (config.hosting + (config.monthlyPosts + config.clientPosts) * apiUnit)
    );
    var annualLabor = annual - annualCash;
    // Upper-bound variant: every hour at the flat operator rate, no team.
    var flatHumanUnit = config.articleMinutes / 60 * config.rate;
    var flatUnit = apiUnit + flatHumanUnit;
    var capacityHours = hasEmployees ? team.teamAvailableHours : 160;
    var setupMonths = setupHours / capacityHours;
    return Object.assign({}, config, {
      writerUsd: writerUsd,
      researchUsd: researchUsd,
      editorApiUsd: editorApiUsd,
      editorUsd: editorApiUsd,
      imagePriceUsd: imagePriceUsd,
      imageUnitUsd: imageUnitUsd,
      apiSubtotalUsd: apiSubtotalUsd,
      retryMultiplier: retryMultiplier,
      apiUnit: apiUnit,
      effectiveRate: effectiveRate,
      teamAvailableHours: team.teamAvailableHours,
      teamMonthlyCostAtCapacity: team.teamMonthlyCostAtCapacity,
      employeeBreakdown: team.employeeBreakdown,
      teamOverloaded: team.teamOverloaded,
      humanUnit: humanUnit,
      unit: unit,
      clientUnit: clientUnit,
      startupPerPortal: startupPerPortal,
      monthlyPerPortal: monthlyPerPortal,
      sharedCapex: sharedCapex,
      sharedMonthly: sharedMonthly,
      capex: capex,
      opex: opex,
      annual: annual,
      marginalYear: marginalYear,
      allocatedYear: allocatedYear,
      perSuccess: perSuccess,
      annualCash: annualCash,
      annualLabor: annualLabor,
      flatHumanUnit: flatHumanUnit,
      flatUnit: flatUnit,
      capacityHours: capacityHours,
      setupMonths: setupMonths,
      setupHours: setupHours,
      monthlyHours: monthlyHours,
      initialArticleCount: config.portals * config.startPosts,
      monthlyArticleCount: config.portals * (config.monthlyPosts + config.clientPosts)
    });
  }

  return {
    defaults: defaults,
    defaultEmployees: defaultEmployees,
    calculate: calculate,
    calculateTeam: calculateTeam
  };
});
