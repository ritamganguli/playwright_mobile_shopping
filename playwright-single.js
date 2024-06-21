const { chromium, devices } = require('playwright');
const { expect } = require("expect");
const { _android } = require("playwright");
const cp = require('child_process');
const fs = require('fs');
const playwrightClientVersion = cp.execSync('npx playwright --version').toString().trim().split(' ')[1];

const executeAdbCommand = (command) => {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing ADB command: ${error}`);
      } else {
        resolve(stdout ? stdout : stderr);
      }
    });
  });
};

const parallelTests = async (capability) => {
  console.log('Initialising test:: ', capability['LT:Options']['name']);

  let device = await _android.connect(
    `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(
      JSON.stringify(capability)
    )}`,
  );
  console.log(`Model:: ${device.model()}, serial:: ${device.serial()}`);

  await device.shell("am force-stop com.android.chrome");

  let context = await device.launchBrowser();
  let page = await context.newPage();

  // Navigate to the page and wait for the 'load' event
  console.log('Navigating to the page...');
  await page.goto("https://www.repco.com.au/", { waitUntil: 'load', timeout: 180000 });
  console.log('Page loaded.');

  // Handle location permission popup using shell commands
  await context.grantPermissions(['geolocation'], { origin: 'https://www.repco.com.au/' });

//  await page.waitForTimeout(180000);

// Define a selector for the element you want to click
const storeLocationSelector = '.store-location-mobile .js-store-finder-link a';

// Wait for the element to be visible and click it
console.log('Waiting for the store location element to be visible...');
await page.waitForSelector(storeLocationSelector, { timeout: 10000 });
console.log('Clicking on the store location element...');
await page.click(storeLocationSelector);
console.log('Store location element clicked.');

// Define a selector for the input field
const inputFieldSelector = 'input#storeselector-query';
// Wait for the input field to be visible and click it
console.log('Waiting for the input field to be visible...');
await page.waitForSelector(inputFieldSelector, { timeout: 10000 });
console.log('Clicking on the input field...');
await page.click(inputFieldSelector);
console.log('Input field clicked.');

// Type something into the input field
console.log('Typing into the input field...');
await page.type(inputFieldSelector, '3148');
console.log('Text typed into the input field.');

  // Hide the keyboard
  await device.shell('input keyevent 4', { timeout: 60000 });

  // Wait for the button with the specified class to be present
  console.log('Waiting for search button...');
  await page.waitForSelector('//*[@id="storeSelectorForm"]/div/span/button', { timeout: 60000 });
  let searchButton = await page.locator('//*[@id="storeSelectorForm"]/div/span/button');
  // Click on the button
  console.log('Clicking on search button...');
  await searchButton.click({ timeout: 60000 });

console.log('Clicking on Oakleigh button');
  let searchButton1 = await page.locator('//div[@class="col-xs-12"]/button');
  await searchButton1.nth(1).click();

console.log('Waiting for page reload');
  await page.waitForTimeout(3000);

   console.log('Clicking on add button');
   let addToCartButton = await page.locator('//div[@class="add-to-cart bazaar-voice showing-5"]');
   await addToCartButton.nth(1).click();

   console.log('Clicking on checkout button');
   let checkoutBtn = await page.locator('a.btn.btn-green.add-to-cart-button');
  await checkoutBtn.click();
  console.log('Clicking on checkout button');

  const continueToPaymentSelector = 'button.btn.btn-green.btn--continue-checkout.js-continue-checkout-button.btn-continue-addicon';
  console.log('Ensuring continue to payment button is visible and clickable');
  await page.waitForSelector(continueToPaymentSelector, { timeout: 10000 });

  // Log if the button is covered by any element
  const isCovered = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (!element) return false;
    const { top, left, bottom, right } = element.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    if (top < 0 || left < 0 || bottom > clientHeight || right > clientWidth) {
      return true;
    }
    const overlapElement = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
    return overlapElement !== element;
  }, continueToPaymentSelector);
  
  if (isCovered) {
    console.log('The continue to payment button is covered by another element');

    // Find and hide the covering element
    await page.evaluate(selector => {
      const element = document.querySelector(selector);
      if (element) {
        const { top, left, bottom, right } = element.getBoundingClientRect();
        const { clientWidth, clientHeight } = document.documentElement;
        if (!(top < 0 || left < 0 || bottom > clientHeight || right > clientWidth)) {
          const overlapElement = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
          if (overlapElement && overlapElement !== element) {
            overlapElement.style.display = 'none';
          }
        }
      }
    }, continueToPaymentSelector);
  } else {
    console.log('The continue to payment button is not covered by another element');
  }

  // Scroll into view and click using JavaScript
  console.log('Scrolling into view and clicking the continue to payment button using JavaScript');
  await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ block: 'center', inline: 'center' });
      element.click();
    }
  }, continueToPaymentSelector);

  // Ensure the button is clicked by dispatching a click event
  console.log('Dispatching click event using JavaScript');
  await page.evaluate(selector => {
    const element = document.querySelector(selector);
    if (element) {
      const event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
    }
  }, continueToPaymentSelector);

  // Click using coordinates as a fallback
  console.log('Clicking using coordinates as a fallback');
  const continueToPaymentElement = await page.locator(continueToPaymentSelector);
  const boundingBox = await continueToPaymentElement.boundingBox();
  if (boundingBox) {
    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;
    await page.mouse.click(x+40, y);
  }





   console.log('Clicking on email input field');
    let email = await page.locator('#emailId');
   await email.type('ritamg@lambdatest.com');

   console.log('Clicking on continue button');
   await page.click('button.btn.btn-green.btn-continue.btn-checkout-default');


   console.log('Clicking on checkout as guest button');
   let guestCheckout = await page.locator('button.checkout-default-Flow');
   await guestCheckout.click();

   let element = await page.locator('(//input[@name="firstName"])[1]');
  if (await element.count() > 0) {
    // Element found on the main page
    await element.type('ritam');
    console.log('Element found and filled on the main page.');
    console.log('Entering Surname');

    let surname= await page.locator('(//input[@name="lastName"])[1]')
    await surname.type('Ganguli');
    console.log('Entering Phone No');
    let phone_no= await page.locator('(//input[@name="phone"])[1]')
    await phone_no.type('0485972084');
    console.log('Adress');
    console.log('Filling Up Adress');
    let adress= await page.locator('(//input[@name="qasSearch"])[1]')
    await adress.type('1 Nonda Pl, PARKINSON, QLD, 4115');
    await page.waitForTimeout(15000);
    console.log('Filled Up Adress');
    let selectect_adress= await page.locator("//div[text()='1 Nonda Place, PARKINSON  QLD 4115']");
    await selectect_adress.click();
    await device.shell('input keyevent 4', { timeout: 60000 });

    let continue_button= await page.locator('#contact-continue-payment-mobile');
    await continue_button.click();

    // This prints the entire JSON response on the console. You can use the data in this variable even outside the test script if you save it appropriately
    // console.log('Ensuring continue to payment button is visible and clickable');
    // await page.waitForSelector(continue_button, { timeout: 10000 });

    // // Log if the button is covered by any element
    // const isCovered = await page.evaluate(selector => {
    //   const element = document.querySelector(selector);c
    //   if (!element) return false;
    //   const { top, left, bottom, right } = element.getBoundingClientRect();
    //   const { clientWidth, clientHeight } = document.documentElement;
    //   if (top < 0 || left < 0 || bottom > clientHeight || right > clientWidth) {
    //     return true;
    //   }
    //   const overlapElement = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
    //   return overlapElement !== element;
    // }, continue_button);
    
    // if (isCovered) {
    //   console.log('The continue to payment button is covered by another element');

    //   // Find and hide the covering element
    //   await page.evaluate(selector => {
    //     const element = document.querySelector(selector);
    //     if (element) {
    //       const { top, left, bottom, right } = element.getBoundingClientRect();
    //       const { clientWidth, clientHeight } = document.documentElement;
    //       if (!(top < 0 || left < 0 || bottom > clientHeight || right > clientWidth)) {
    //         const overlapElement = document.elementFromPoint((left + right) / 2, (top + bottom) / 2);
    //         if (overlapElement && overlapElement !== element) {
    //           overlapElement.style.display = 'none';
    //         }
    //       }
    //     }
    //   }, continue_button);
    // } else {
    //   console.log('The continue to payment button is not covered by another element');
    // }

    // // Scroll into view and click using JavaScript
    // console.log('Scrolling into view and clicking the continue to payment button using JavaScript');
    // await page.evaluate(selector => {
    //   const element = document.querySelector(selector);
    //   if (element) {
    //     element.scrollIntoView({ block: 'center', inline: 'center' });
    //     element.click();
    //   }
    // }, continue_button);

    // // Ensure the button is clicked by dispatching a click event
    // console.log('Dispatching click event using JavaScript');
    // await page.evaluate(selector => {
    //   const element = document.querySelector(selector);
    //   if (element) {
    //     const event = new MouseEvent('click', {
    //       view: window,
    //       bubbles: true,
    //       cancelable: true
    //     });
    //     element.dispatchEvent(event);
    //   }
    // }, continue_button);

    // // Click using coordinates as a fallback
    // console.log('Clicking using coordinates as a fallback');
    // const continueToPaymentElement = await page.locator(continue_button);
    // const boundingBox = await continueToPaymentElement.boundingBox();
    // if (boundingBox) {
    //   const x = boundingBox.x + boundingBox.width / 2;
    //   const y = boundingBox.y + boundingBox.height / 2;
    //   await page.mouse.click(x+40, y);
    // }

    // await page.waitForTimeout(30000);
  } else {
    // Element not found on the main page, check inside iframes
    const iframes = await page.frames();
    let found = false;
    for (const frame of iframes) {
      element = await frame.locator('(//input[@name="firstName"])[1]');
      if (await element.count() > 0) {
        // Element found inside this iframe
        await element.fill('ritam');
        console.log('Element found and filled inside an iframe.');
        found = true;
        break;
      }
    }
    if (!found) {
      console.log('Element not found on the main page or in any iframes.');
    }




  }
  
  //await page.locator('#address.firstName').type('Ritam');





await page.waitForTimeout(3000);




await page.waitForTimeout(10000);






  try {
    console.log('Test Passed');
    await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: "setTestStatus", arguments: { status: "passed", remark: "Assertions passed" } })}`);
    await teardown(page, context, device);
  } catch (e) {
    console.log('Test Failed');
    await page.evaluate(_ => {}, `lambdatest_action: ${JSON.stringify({ action: "setTestStatus", arguments: { status: "failed", remark: e.stack } })}`);
    await teardown(page, context, device);
    throw e.stack;
  }
};

async function teardown(page, context, device) {
  await page.close();
  await context.close();
  await device.close();
}

// Capabilities array with the respective configuration for the parallel tests
const capabilities = [
  {
    "LT:Options": {
      "platformName": "android",
      "deviceName": "Galaxy S23 Ultra",
      "platformVersion": "13",
      "isRealMobile": true,
      "autoHeal": true,
      "region": "ap",
      "autoAcceptAlerts": true,
      "autoGrantPermissions": true,
      "build": process.env.LT_BUILD_NAME,
      "name": "Playwright android test",
      "user": process.env.LT_USERNAME,
      "accessKey": process.env.LT_ACCESS_KEY,
      "network": true,
      "video": true,
      "console": true,
      "projectName": "New Project"
    }
  },

];

(async () => {
  await Promise.all(capabilities.map(capability => parallelTests(capability)));
})();
