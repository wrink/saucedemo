const { Builder, By, Key, until } = require('selenium-webdriver');
const performTest = require('./app');

const URL = 'https://www.saucedemo.com';

const STANDARD_USER = 'standard_user';
const LOCKED_USER = 'locked_out_user';
const PROBLEM_USER = 'problem_user';
const GLITCH_USER = 'performance_glitch_user';

const PASSWORD = 'secret_sauce';

const LOGGED_IN_USERS = [
  STANDARD_USER,
  GLITCH_USER
] ;

jest.setTimeout(50000);

async function login(driver, user, password) {
  await driver.findElement(By.id('user-name')).sendKeys(user);
  await driver.findElement(By.id('password')).sendKeys(password);
  await driver.findElement(By.id('login-button')).click();
}

test('1: Title matches', async () => {
  await performTest(async (driver) => {
    expect(await driver.getTitle()).toBe('Swag Labs');
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`2.${i}: User ${user} can log in with valid credentials`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD);
      await driver.wait(until.urlIs(URL + '/inventory.html'), 5000);
    });
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`3.${i}: User ${user} cannot log in with invalid credentials`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD + 'a');
      await driver.wait(until.elementLocated(By.css('.error')), 5000);
    });
  });
});

test(`4: User ${LOCKED_USER} cannot log in with valid credentials`, async () => {
  await performTest(async (driver) => {
    await login(driver, LOCKED_USER, PASSWORD + 'a');
    await driver.wait(until.elementLocated(By.css('.error')), 5000);
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`5.${i}: User ${user} can add items to cart`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD);
      await driver.wait(until.urlIs(URL + '/inventory.html'), 5000);

      await driver.findElement(By.id('add-to-cart-sauce-labs-backpack')).click();
      await driver.findElement(By.id('add-to-cart-sauce-labs-bike-light')).click();
      await driver.wait(until.elementLocated(By.css('.shopping_cart_link')), 5000);
      await driver.wait(until.elementTextIs(await driver.findElement(By.css('.shopping_cart_link')), '2'), 5000);
      await driver.findElement(By.css('.shopping_cart_link')).click();
      await driver.wait(until.urlIs(URL + '/cart.html'), 5000);

      expect(await Promise.all((await driver.findElements(By.css('.inventory_item_name'))).map((e) => e.getText()))).toEqual([
        'Sauce Labs Backpack',
        'Sauce Labs Bike Light'
      ]);
    });
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`6.${i}: User ${user} can remove items from cart`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD);
      await driver.wait(until.urlIs(URL + '/inventory.html'), 5000);

      await driver.findElement(By.id('add-to-cart-sauce-labs-backpack')).click();
      await driver.wait(until.elementTextIs(await driver.findElement(By.css('.shopping_cart_link')), '1'), 5000);
      await driver.findElement(By.id('remove-sauce-labs-backpack')).click();
      await driver.wait(until.elementTextIs(await driver.findElement(By.css('.shopping_cart_link')), ''), 5000);

      await driver.findElement(By.id('add-to-cart-sauce-labs-backpack')).click();
      await driver.findElement(By.id('add-to-cart-sauce-labs-bike-light')).click();
      await driver.wait(until.elementLocated(By.css('.shopping_cart_link')), 5000);
      await driver.wait(until.elementTextIs(await driver.findElement(By.css('.shopping_cart_link')), '2'), 5000);
      await driver.findElement(By.css('.shopping_cart_link')).click();
      await driver.wait(until.urlIs(URL + '/cart.html'), 5000);

      await driver.findElement(By.id('remove-sauce-labs-backpack')).click();
      expect(await Promise.all((await driver.findElements(By.css('.inventory_item_name'))).map((e) => e.getText()))).toEqual([
        'Sauce Labs Bike Light'
      ]);
      await driver.findElement(By.id('remove-sauce-labs-bike-light')).click();
      expect(await Promise.all((await driver.findElements(By.css('.inventory_item_name'))).map((e) => e.getText()))).toEqual([]);
    });
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`7.${i}: User ${user} checkout total equals sum of prices`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD);
      await driver.wait(until.urlIs(URL + '/inventory.html'), 5000);

      await driver.findElement(By.id('add-to-cart-sauce-labs-backpack')).click();
      await driver.findElement(By.id('add-to-cart-sauce-labs-bike-light')).click();
      await driver.findElement(By.css('.shopping_cart_link')).click();
      await driver.wait(until.urlIs(URL + '/cart.html'), 5000);

      await driver.findElement(By.id('checkout')).click();
      await driver.wait(until.urlIs(URL + '/checkout-step-one.html'), 5000);

      await driver.findElement(By.id('first-name')).sendKeys('a');
      await driver.findElement(By.id('last-name')).sendKeys('a');
      await driver.findElement(By.id('postal-code')).sendKeys('a');
      await driver.findElement(By.id('continue')).click();
      await driver.wait(until.urlIs(URL + '/checkout-step-two.html'), 5000);

      const prices = await Promise.all((await driver.findElements(By.css('.inventory_item_price'))).map((e) => e.getText()));
      const itemTotal = prices.map((price) => parseFloat(price.slice(1))).reduce((a, b) => a + b, 0);
      expect(await driver.findElement(By.css('.summary_subtotal_label')).getText()).toBe('Item total: $' + itemTotal.toFixed(2));
      const tax = await driver.findElement(By.css('.summary_tax_label')).getText();
      const total = itemTotal + parseFloat(tax.slice(6));
      expect(await driver.findElement(By.css('.summary_total_label')).getText()).toBe('Total: $' + total.toFixed(2));
    });
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`8.${i}: User ${user} test.allTheThings() t-shirt is in stock`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD);
      await driver.wait(until.urlIs(URL + '/inventory.html'), 5000);

      await driver.findElement(By.id('add-to-cart-test.allthethings()-t-shirt-(red)'));
    });
  });
});

LOGGED_IN_USERS.map((user, i) => {
  test(`9.${i}: User ${user} checkout finish has pony express image`, async () => {
    await performTest(async (driver) => {
      await login(driver, user, PASSWORD);
      await driver.wait(until.urlIs(URL + '/inventory.html'), 5000);

      await driver.findElement(By.id('add-to-cart-sauce-labs-backpack')).click();
      await driver.findElement(By.id('add-to-cart-sauce-labs-bike-light')).click();
      await driver.findElement(By.css('.shopping_cart_link')).click();
      await driver.wait(until.urlIs(URL + '/cart.html'), 5000);

      await driver.findElement(By.id('checkout')).click();
      await driver.wait(until.urlIs(URL + '/checkout-step-one.html'), 5000);

      await driver.findElement(By.id('first-name')).sendKeys('a');
      await driver.findElement(By.id('last-name')).sendKeys('a');
      await driver.findElement(By.id('postal-code')).sendKeys('a');
      await driver.findElement(By.id('continue')).click();
      await driver.wait(until.urlIs(URL + '/checkout-step-two.html'), 5000);


      await driver.findElement(By.id('finish')).click();
      await driver.wait(until.urlIs(URL + '/checkout-complete.html'), 5000);

      expect(await driver.findElement(By.css('img.pony_express')).getAttribute('src')).toBe(URL + '/static/media/pony-express.46394a5d.png');
    });
  });
});
