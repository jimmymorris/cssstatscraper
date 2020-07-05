const fs = require('fs');
const cssstats = require('cssstats')
const chalk = require('chalk');
const log = console.log;
const got = require('got');
const jsdom = require("jsdom");
const { getHeapSpaceStatistics } = require('v8');
const { parse } = require('path');
const { JSDOM } = jsdom;

const vgmUrl = 'https://www.alexa.com/topsites/countries/US';

(async () => {
  log(chalk.cyan('Getting top sites'))
  const getSites = await got(vgmUrl);
  const dom = new JSDOM(getSites.body);

  // Create an Array out of the HTML Elements for filtering using spread syntax.
  const nodeList = [...dom.window.document.querySelectorAll('.site-listing a')];
  log(chalk.cyan(`Found ${nodeList.length} sites`))
  let allSpacing = {};

  for (let i = 0; i < nodeList.length; i += 1) {
    const url = nodeList[i].text;
    log(chalk.cyan(`Getting ${url} CSS stats`))
    try {
      const statsData = await got(`https://cssstats.com/api/stats?url=${url}`);

      if (typeof statsData !== 'undefined') {
        const { properties } = JSON.parse(statsData.body).stats.declarations;
        let spacing = await getSpacing(properties)

        const uniqueSpacing = [...new Set([...spacing])].sort((a, b) => a - b);

        allSpacing[url] = uniqueSpacing;
      }
    } catch (error) {
      log(chalk.red(error));
    }
  }

  fs.writeFileSync('spacings.json', JSON.stringify(allSpacing, null, 2));

})();

const getSpacing = (properties) => {
  let spacing = [];
  const availableProperties = Object.keys(properties);
  // console.log({availableProperties})
  const spacingProps = [
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-right',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-right'
  ]

  spacingProps.map(prop => {
    if (availableProperties.includes(prop)) {
      properties[prop]
        .map(s => spacing.push(...s.split(' ')))
    }
  })

  if (spacing.length > 0) {
    spacing = spacing
      .filter(s => !s.includes('%') && !s.includes('auto') && !s.includes('-') && parseFloat(s) !== null && parseFloat(s) > 0)
      .map(s => parseFloat(s))
  }

  return spacing
}