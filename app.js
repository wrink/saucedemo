const path = require('path');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { Builder } = require('selenium-webdriver');

module.exports = async function performTest(callback) {
  const driverPath = path.join(__dirname, 'driver/chromedriver');
  const serviceBuilder = new ServiceBuilder(driverPath);
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeService(serviceBuilder)
    .build();
  try {
    await driver.get('https://www.saucedemo.com');
    await callback(driver);
  } finally {
    await driver.quit();
  }
}
