const { Builder } = require('selenium-webdriver');

module.exports = async function performTest(callback) {
  let driver = await new Builder().forBrowser('chrome').build();
  try {
    await driver.get('https://www.saucedemo.com');
    await callback(driver);
  } finally {
    await driver.quit();
  }
}
