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
    while (true) {
        let page, context, device;
        try {
            console.log('Initialising test:: ', capability['LT:Options']['name']);

            device = await _android.connect(
                `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(
                    JSON.stringify(capability)
                )}`,
            );
            console.log(`Model:: ${device.model()}, serial:: ${device.serial()}`);

            await device.shell("am force-stop com.android.chrome");

            context = await device.launchBrowser();
            page = await context.newPage();

            // Navigate to the page and wait for the 'load' event
            console.log('Navigating to the page...');
            await page.goto("https://www.repco.com.au/", { waitUntil: 'load', timeout: 180000 });
            console.log('Page loaded.');

            // Handle location permission popup using shell commands
            await context.grantPermissions(['geolocation'], { origin: 'https://www.repco.com.au/' });

            const storeLocationSelector = '.store-location-mobile .js-store-finder-link a';

            console.log('Waiting for the store location element to be visible...');
            await page.waitForSelector(storeLocationSelector, { timeout: 10000 });
            console.log('Clicking on the store location element...');
            await page.click(storeLocationSelector);
            console.log('Store location element clicked.');

            const inputFieldSelector = 'input#storeselector-query';
            console.log('Waiting for the input field to be visible...');
            await page.waitForSelector(inputFieldSelector, { timeout: 10000 });
            console.log('Clicking on the input field...');
            await page.click(inputFieldSelector);
            console.log('Input field clicked.');

            console.log('Typing into the input field...');
            await page.type(inputFieldSelector, '3148');
            console.log('Text typed into the input field.');

            await device.shell('input keyevent 4', { timeout: 60000 });

            console.log('Waiting for search button...');
            await page.waitForSelector('//*[@id="storeSelectorForm"]/div/span/button', { timeout: 60000 });
            let searchButton = await page.locator('//*[@id="storeSelectorForm"]/div/span/button');
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

            console.log('Scrolling into view and clicking the continue to payment button using JavaScript');
            await page.evaluate(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.scrollIntoView({ block: 'center', inline: 'center' });
                    element.click();
                }
            }, continueToPaymentSelector);

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

            console.log('Clicking using coordinates as a fallback');
            const continueToPaymentElement = await page.locator(continueToPaymentSelector);
            const boundingBox = await continueToPaymentElement.boundingBox();
            if (boundingBox) {
                const x = boundingBox.x + boundingBox.width / 2;
                const y = boundingBox.y + boundingBox.height / 2;
                await page.mouse.click(x + 40, y);
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
                await element.type('ritam');
                console.log('Element found and filled on the main page.');
                console.log('Entering Surname');

                let surname = await page.locator('(//input[@name="lastName"])[1]')
                await surname.type('Ganguli');
                console.log('Entering Phone No');
                let phone_no = await page.locator('(//input[@name="phone"])[1]')
                await phone_no.type('0485972084');
                console.log('Adress');
                console.log('Filling Up Adress');
                let adress = await page.locator('(//input[@name="qasSearch"])[1]')
                await adress.type('1 Nonda Pl, PARKINSON, QLD, 4115');
                await page.waitForTimeout(15000);
                console.log('Filled Up Adress');
                let selectect_adress = await page.locator("//div[text()='1 Nonda Place, PARKINSON  QLD 4115']");
                await selectect_adress.click();
                await device.shell('input keyevent 4', { timeout: 60000 });

                let continue_button = await page.locator('#contact-continue-payment-mobile');
                await continue_button.click();

            } else {
                const iframes = await page.frames();
                let found = false;
                for (const frame of iframes) {
                    element = await frame.locator('(//input[@name="firstName"])[1]');
                    if (await element.count() > 0) {
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

            await page.waitForTimeout(3000);
            await page.waitForTimeout(10000);

            console.log('Test Passed');
            await page.evaluate(_ => { }, `lambdatest_action: ${JSON.stringify({ action: "setTestStatus", arguments: { status: "passed", remark: "Assertions passed" } })}`);
            await teardown(page, context, device);
            break; // Exit the loop if the test passes
        } catch (e) {
            console.log('Test Failed');
            let sessionId;
            if (page) {
                const response = JSON.parse(await page.evaluate(_ => { }, `lambdatest_action: ${JSON.stringify({ action: 'getTestDetails' })}`));
                console.log(response); // Log the JSON response
                await page.evaluate(_ => { }, `lambdatest_action: ${JSON.stringify({ action: "setTestStatus", arguments: { status: "failed", remark: e.stack } })}`);
                let response1 = await page.evaluate(_ => { }, `lambdatest_action: ${JSON.stringify({ action: 'getTestDetails' })}`)
                //console.log("Test details: ", JSON.parse(response1).data.session_id);
                sessionId = JSON.parse(response1).data.session_id;

            }
            await teardown(page, context, device);

            await new Promise(resolve => setTimeout(resolve, 20000));

            const axios = require('axios');

            const authToken = "c2h1YmhhbXI6ZGw4WThhczU5aTFZeUdaWlVlTEY4OTdhQ0Z2SURtYUtrVVUxZTZSZ0JtbGdNTElJaGg=";

            const url = `https://api.lambdatest.com/automation/api/v1/sessions/${sessionId}`;

            axios.delete(url, {
                headers: {
                    'Authorization': `Basic ${authToken}`,
                    'accept': 'application/json'
                }
            })
                .then(response => {
                    console.log('Session deleted successfully:', response.data);
                })
                .catch(error => {
                    console.error('Error deleting session:', error);
                });




        }
    }
};

async function teardown(page, context, device) {
    if (page) await page.close();
    if (context) await context.close();
    if (device) await device.close();
}

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
            "build": "Playwright Android Build",
            "name": "Playwright android test",
            "user": 'ritamg',
            "accessKey": 'acess_key',
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
