import lighthouse from 'lighthouse';
import {launch, LaunchedChrome} from 'chrome-launcher';
import {IReport} from '../types/auditor';

export namespace LighthouseService {

    async function launchChromeAndRunLighthosue(url: string, opts: any): Promise<IReport> {
        return await launch(opts)
            .then((chrome: LaunchedChrome) => lighthouse(url, Object.assign({port: chrome.port}, opts), null)
                .then(results => chrome.kill()
                    .then(() => results.lhr as IReport))
            );
    }

    /**
     * headless モードで監査を実行する
     * @param url 監査対象のURL
     * @param opts 起動オプション
     */
    export async function audit(url: string, opts: any): Promise<IReport> {
        return await launchChromeAndRunLighthosue(url, opts);
    }


    /**
     * lighthouseの実行オプションを作成する
     *
     * @param isHeadless ヘッドレスモードで実行するか
     * @param isMobile モバイルモードで実行するか
     * @param throttling throttlingの指定
     * @param whitelistCookie CDNで透過するCookieのKey名
     */
    export function createOption(isHeadless: boolean, isMobile: boolean, throttling: string, whitelistCookie?: string) {
        return {
            disableStorageReset: false,
            emulatedFormFactor: isMobile ? 'mobile' : 'desktop',
            throttlingMethod: throttling === 'no' ? 'devtools' : 'provided',
            throttlings: throttling === 'lte' ? LteThrottling :
                throttling === '3gf' ? ThreeGenFastThrottling : undefined,
            extraHeaders: Object.assign({
                    "Authorization": "Basic ZmxleDpjTWY4a2N5elph"
                },
                !!whitelistCookie ? {"Cookie": `${whitelistCookie}=${new Date().getTime()};`} : {}),
            chromeFlags: [
                // See: https://github.com/GoogleChrome/chrome-launcher/blob/master/docs/chrome-flags-for-tools.md
                '--disable-extensions',
                '--disable-gpu',
                isHeadless ? '--headless' : '',
                isMobile ? '412, 732' : '1200,800'
            ]
        }
    }

    /**
     * Throttling設定
     * mobileSlow4G / 3G - Fast
     * @see https://github.com/WPO-Foundation/webpagetest/blob/master/www/settings/connectivity.ini.sample
     * @see https://docs.google.com/document/d/10lfVdS1iDWCRKQXPfbxEn4Or99D64mvNlugP1AQuFlE/edit
     * @see https://github.com/GoogleChrome/lighthouse/blob/648248e270deeef33e1b16b3420b43cc97230a97/lighthouse-core/config/constants.js
     */
    const ThreeGenFastThrottling = {
        rttMs: 150,
        throughputKbps: 1.6 * 1024,
        requestLatencyMs: 150 * 3.75,
        downloadThroughputKbps: 1.6 * 1024 * 0.9,
        uploadThroughputKbps: 750 * 0.9,
        cpuSlowdownMultiplier: 4,
    };

    /**
     * Throttling設定
     * LTE
     * @see https://github.com/WPO-Foundation/webpagetest/blob/master/www/settings/connectivity.ini.sample
     */
    const LteThrottling = {
        rttMs: 70,
        throughputKbps: 12 * 1024,
        requestLatencyMs: 70 * 3.75,
        downloadThroughputKbps: 12 * 1024 * 0.9,
        uploadThroughputKbps: 12 * 1024 * 0.9,
        cpuSlowdownMultiplier: 1,
    }

}