// const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');
const fs = require("fs");

const { launch, getStream, wss: puppeteerWss } = require("puppeteer-stream");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const AnonymizeUAPlugin = require('puppeteer-extra-plugin-anonymize-ua');

// Configuration des plugins Puppeteer
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true, useCache: false }));
puppeteer.use(AnonymizeUAPlugin());

const meetingConfig = {
    mn: 'NUMERO_DE_LA_REUNION',         // <-- Mettez un vrai numéro de réunion
    pwd: 'MOT_DE_PASSE_REUNION',       // <-- Mettez le mot de passe si nécessaire
    name: 'MonBotPuppeteer',
    role: 0,
    lang: 'fr-FR',
    signature: 'VOTRE_SIGNATURE_GENEREE', // <-- Mettez une signature VALIDE générée par votre backend
    sdkKey: 'VOTRE_SDK_KEY',              // <-- Mettez votre SDK Key de Zoom
};

// Fonction simple pour transformer l'objet de configuration en chaîne de requête URL
function serialize(obj) {
    const str = [];
    for (const p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    }
    return str.join("&");
}


// --- ÉTAPE 2 : Le script Puppeteer ---
async function rejoindreAutomatiquement() {
    let chromePath = '';
    const platform = os.platform();
    if (platform === 'darwin') {
        chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
        const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', `${os.homedir()}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe`];
        chromePath = paths.find(p => fs.existsSync(p));
        // chromePath = 'C:/Program Files/Mozilla Firefox/firefox.exe';
    } else {
        chromePath = '/usr/bin/google-chrome';
    }
    console.log('Lancement du navigateur...');
    const browser = await launch({
        executablePath: chromePath || undefined,
        headless: false, // Mettez `false` pour voir ce qui se passe
        args: [
            '--lang=fr-FR,fr',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-features=VizDisplayCompositor',
            '--window-size=1920,1080',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-extensions',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
        ]
    });

    const pathServer = 'http://127.0.0.1:9999';
    const queryString = "name=Q0ROIzMuMTMuMldpbjEwI2Nocm9tZS8xMzguMC4wLjA%3D&mn=3192600158&email=bWFyeXRyYTI5MkBnbWFpbC5jb20%3D&pwd=JHRF0L&role=0&lang=en-US&signature=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBLZXkiOiJQQXhyTlBNSVFzdUdQYmxKYmE0djl3Iiwic2RrS2V5IjoiUEF4ck5QTUlRc3VHUGJsSmJhNHY5dyIsIm1uIjozMTkyNjAwMTU4LCJyb2xlIjowLCJpYXQiOjE3NTQ1MDI1NzksImV4cCI6MTc1NDUwOTc3OSwidG9rZW5FeHAiOjE3NTQ1MDk3Nzl9.FfiJ3M6AKreUkGSWQGoRpxBBzd942lywhMrZuRFLuiQ&china=0&sdkKey=PAxrNPMIQsuGPblJba4v9w";
    const urlComplete = `${pathServer}/meeting.html?${queryString}`;

    // Masquer les propriétés webdriver
    const context = browser.defaultBrowserContext();
    const origin = new URL(urlComplete).origin;
    await context.overridePermissions(origin, ['microphone', 'camera', 'notifications']);
    console.log(`✅ Permissions accordées pour l'origine : ${origin}`);

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
        });

        delete navigator.__proto__.webdriver;

        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en', 'fr'],
        });

        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                { name: 'Chrome PDF Plugin', length: 1 },
                { name: 'Chrome PDF Viewer', length: 1 },
                { name: 'Native Client', length: 1 }
            ],
        });
    });
    // User-Agent rotatif
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    page.setDefaultTimeout(45000);

    // // Construire l'URL complète de la réunion
    // // const cheminAbsolu = path.resolve(__dirname, 'meeting.html');
    // // const pathServer = 'https://localhost:9999';
    // const pathServer = 'http://127.0.0.1:9999';
    // // const queryString = serialize(meetingConfig);
    // const queryString = "name=Q0ROIzMuMTMuMldpbjEwI2Nocm9tZS8xMzguMC4wLjA%3D&mn=3192600158&email=bWFyeXRyYTI5MkBnbWFpbC5jb20%3D&pwd=JHRF0L&role=0&lang=en-US&signature=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBLZXkiOiJQQXhyTlBNSVFzdUdQYmxKYmE0djl3Iiwic2RrS2V5IjoiUEF4ck5QTUlRc3VHUGJsSmJhNHY5dyIsIm1uIjozMTkyNjAwMTU4LCJyb2xlIjowLCJpYXQiOjE3NTQ0OTQ5MjUsImV4cCI6MTc1NDUwMjEyNSwidG9rZW5FeHAiOjE3NTQ1MDIxMjV9.-wtwO1mXLZCLiULrjhJon_aY3LIvL-b0xMKGj5rSqKc&china=0&sdkKey=PAxrNPMIQsuGPblJba4v9w";

    // // const urlComplete = `file://${cheminAbsolu}?${queryString}`;
    // const urlComplete = `${pathServer}/meeting.html?${queryString}`;

    console.log(`Navigation vers : ${urlComplete}`);
    await page.goto(urlComplete, {
        // Attendre que le réseau soit inactif, ce qui signifie souvent que la page est chargée
        waitUntil: 'networkidle0'
    });

    console.log('Page de la réunion chargée. En attente du bouton "Join"...');

    // --- ÉTAPE 3 : Trouver et cliquer sur le bouton "Join" ---
    // C'est la partie la plus importante. Vous devez trouver le bon "sélecteur" pour le bouton.
    // Le sélecteur peut être un ID, une classe, ou un autre attribut.
    // EXEMPLE : Le SDK Zoom peut utiliser un bouton avec la classe `.join-audio` ou un ID comme `#join-btn`
    // Vous DEVEZ inspecter votre page `meeting.html` pour trouver le bon sélecteur.
    // const selecteurBoutonJoin = '#root > div > div > button'; // CECI EST UN EXEMPLE, À ADAPTER !

    //     // const selecteurAutoriser = '::-p-xpath(//button[.//span[contains(., "Autoriser")] or .//span[contains(., "pendant")] ])';

    //     // const selecteurBoutonJoin = '::-p-xpath(//button[.//span[contains(., "Join")] or .//span[contains(., "Participer")] ])';
    // // .preview .preview-join-button
    //     const selecteurBoutonJoin = '.zm-btn';


    //     try {
    //         // await page.waitForSelector(selecteurAutoriser, { visible: true, timeout: 15000 });
    //         // console.log('Bouton "PopUp" trouvé ! Clic en cours...');
    //         // await page.click(selecteurAutoriser);

    //         // Attendre que le bouton soit visible et cliquable sur la page
    //         await page.waitForSelector(selecteurBoutonJoin, { visible: true, timeout: 15000 });
    //         console.log('Bouton "Join" trouvé ! Clic en cours...');
    //         await selecteurBoutonJoin.click();

    //         console.log('Clic effectué ! La réunion devrait être en cours de connexion.');

    //     } catch (error) {
    //         console.error(`Erreur : Impossible de trouver le bouton avec le sélecteur".`);
    //         console.error('Vérifiez que le sélecteur est correct et que la page se charge bien.');
    //         await page.screenshot({ path: 'erreur_screenshot.png' }); // Prend une capture d'écran pour le débogage
    //     }

    const SELECTORS = {
        MEETING_ID_SUBMIT_BUTTON: '::-p-xpath(//button[contains(., "Join") or contains(., "Participer")])',
    };


    try {
        console.log('Bouton "Join" trouvé ! Clic en cours...');
        const joinFromBrowser = await page.waitForSelector(SELECTORS.MEETING_ID_SUBMIT_BUTTON, { timeout: 10000 });
        await joinFromBrowser.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
    } catch (e) {
        console.error(`Erreur : Impossible de trouver le bouton avec le sélecteur".`);
        console.error('Vérifiez que le sélecteur est correct et que la page se charge bien.');
        await page.screenshot({ path: 'erreur_screenshot.png' });
    }


    // Laissez le navigateur ouvert pour voir le résultat.
    // Décommentez la ligne suivante pour fermer le navigateur automatiquement après le script.
    // await browser.close();
}

// Lancer l'automatisation
rejoindreAutomatiquement();