const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const isLocal = process.env.NETLIFY_LOCAL === 'true';

const LOCAL_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LOCAL_URL = 'http://localhost:3000/ticket?username=';

const getConfig = async () => {
	const executablePath = isLocal ? LOCAL_CHROME_PATH : await chromium.executablePath();
	const url = isLocal ? LOCAL_URL : 'https://miduconf.com/ticket?username=';

	return { executablePath, url };
};

exports.handler = async function (event) {
	const {
		queryStringParameters: { username },
	} = event;
	const { executablePath, url } = await getConfig();

	const browser = await chromium.puppeteer.launch({
		executablePath,
		headless: true,
	});

	const page = await browser.newPage();
	await page.setViewport({
		width: 1200,
		height: 800,
		deviceScaleFactor: 2,
	});

	await page.goto(`${url}${username}`);

	await page.waitForSelector('.atropos[data-ready]');
	const el = await page.$('.atropos');

	const screenshot = await el.screenshot({ path: './image.png' });

	await browser.close();

	return {
		headers: {
			'Content-Type': 'image/png',
		},
		statusCode: 200,
		body: screenshot.toString('base64'),
		isBase64Encoded: true,
	};
};
