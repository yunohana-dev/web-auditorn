import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora'
import inquirer from 'inquirer';
import columnify from 'columnify';
import {Command, flags} from '@oclif/command'
import {IReport, IResource, IService} from "../types/auditor";
import {Auditorn} from "../settings";
import {LighthouseService} from "../services/LighthouseService";
import {AuditornUtils} from "../AuditornUtils";

export default class Run extends Command {
    static description = 'サービスへの監査を実行する';

    static flags = {
        help: flags.help({char: 'h', description: 'helpを表示する'}),
        output: flags.boolean({char: 'o', description: 'lighthosueのレポートを出力する', default: true}),
        headless: flags.boolean({char: 'l', description: 'ヘッドレスモードで実行する', default: true}),
        device: flags.string({char: 'd', description: 'デバイス種別', options: ['desktop', 'mobile'], default: 'desktop'}),
        throttling: flags.string({char: 't', description: 'throttlingを行う', options: ['no', 'lte', '3g-fast'], default: 'no'}),
        count: flags.integer({char: 'c', description: '試行回数', default: 1})
    };

    static args = [{'name': 'filename', 'description': '監査対象のサービスが定義されたjsonファイル名'}];

    async run() {
        const {args, flags} = this.parse(Run);
        let target: IService = await this.initTargets(args.filename);

        console.log(chalk.blueBright(
            `以下の内容で監査を実行します\n`
            + `対象サービス\t: ${target.name}\n`
            + `対象リソース数\t: ${target.resources.length}\n`
            + `CDNの利用\t: ${!target["cdn-whitelist-cookie"] ? "無" : "有"}\n`
            + `試行回数\t: ${flags.count}\n`
            + `ヘッドレス\t: ${flags.headless}\n`
            + `デバイス種別\t: ${flags.device}\n`
            + `スロットリング\t: ${flags.throttling}\n`
        ) + chalk.whiteBright('----------------')
        );

        let resources: Array<IResource> = target.resources;
        for (let index = 0; index < resources.length; index++) {
            let resource: IResource = resources[index];
            if (!resource) continue;

            let reports: Array<IReport> = await this.auditUnderTryCount(target, resource);
            console.log(chalk.greenBright(`${resource.name}`));
            await this.outputSummary(reports);

            if (!target["cdn-whitelist-cookie"]) continue;
            // CDN cache の利用を回避する
            let reportsWithoutCache: Array<IReport> = await this.auditUnderTryCount(target, resource, target["cdn-whitelist-cookie"]);
            console.log(chalk.greenBright(`${resource.name} [Miss cache]`));
            await this.outputSummary(reportsWithoutCache);
        }
    }

    async auditUnderTryCount(service: IService, resource: IResource, whitelistCookie?: string): Promise<Array<IReport>> {
        const {args, flags} = this.parse(Run);
        let reports = new Array<IReport>();
        let spinner = ora().start();
        for (let count = 0; count < flags.count; count++) {
            spinner.text = `scoring ${resource.name}${!!whitelistCookie ? " [Miss cache]" : ""} (${count + 1}/${flags.count})`;
            let opts = await LighthouseService.createOption(flags.headless, flags.device === 'mobile', flags.throttling, whitelistCookie);
            let report: IReport = await this.audit(`${service.origin}${resource.path}`, opts);
            if (flags.output) {
                let timestamp = `${(new Date()).toLocaleString()}`.replace(/[\-\s\/:]/g, '');
                let filename = `${!!whitelistCookie ? "MissCache-" : ""}${flags.device}${flags.throttling ? "-throttling-" : ""}-${timestamp}`;
                await AuditornUtils.writeJson(`${Auditorn.Outputs}/${service.name}/${resource.name}`, filename, report);
            }
            reports.push(report);
        }
        spinner.succeed().stop();
        return reports;
    }

    async audit(url: string, opts): Promise<IReport> {
        return await LighthouseService.audit(url, opts);
    }

    async initTargets(filename?: string): Promise<IService> {
        if (!filename) {
            let answers = await inquirer.prompt(questions) as Object;
            let target: IService = answers["service"];
            target.resources = answers["resources"];
            return target;
        }
        return require(`../../${Auditorn.Definitions}/${filename}`);
    }

    async outputSummary(reports: Array<IReport>) {
        let summary = new Array<Object>();
        for (let index = 0; index < reports.length; index++) {
            let report = reports[index];
            if (!report) continue;
            let debugdata = report.audits.metrics.details.items[0];
            let categories = report.categories;
            let audits = report.audits;
            summary.push(
                await this.score(
                    `${index + 1}回目`,
                    categories.performance.score * 100,
                    categories.accessibility.score * 100,
                    categories["best-practices"].score * 100,
                    categories.seo.score * 100,
                    audits["first-contentful-paint"].numericValue,
                    audits["first-meaningful-paint"].numericValue,
                    audits["server-response-time"].numericValue,
                    debugdata["largestContentfulPaint"],
                    debugdata["maxPotentialFID"],
                    debugdata["cumulativeLayoutShift"]
                ));
        }
        let total_count = reports.length;
        summary.push(
            await this.score(
                "最小",
                await AuditornUtils.min(reports.map((report) => report.categories.performance.score * 100)),
                await AuditornUtils.min(reports.map((report) => report.categories.accessibility.score * 100)),
                await AuditornUtils.min(reports.map((report) => report.categories["best-practices"].score * 100)),
                await AuditornUtils.min(reports.map((report) => report.categories.seo.score * 100)),
                await AuditornUtils.min(reports.map((report) => report.audits["first-contentful-paint"].numericValue)),
                await AuditornUtils.min(reports.map((report) => report.audits["first-meaningful-paint"].numericValue)),
                await AuditornUtils.min(reports.map((report) => report.audits["server-response-time"].numericValue)),
                await AuditornUtils.min(reports.map((report) => report.audits.metrics.details.items[0]["largestContentfulPaint"])),
                await AuditornUtils.min(reports.map((report) => report.audits.metrics.details.items[0]["maxPotentialFID"])),
                await AuditornUtils.min(reports.map((report) => report.audits.metrics.details.items[0]["cumulativeLayoutShift"])),
            ), await this.score(
                "最大",
                await AuditornUtils.max(reports.map((report) => report.categories.performance.score * 100)),
                await AuditornUtils.max(reports.map((report) => report.categories.accessibility.score * 100)),
                await AuditornUtils.max(reports.map((report) => report.categories["best-practices"].score * 100)),
                await AuditornUtils.max(reports.map((report) => report.categories.seo.score * 100)),
                await AuditornUtils.max(reports.map((report) => report.audits["first-contentful-paint"].numericValue)),
                await AuditornUtils.max(reports.map((report) => report.audits["first-meaningful-paint"].numericValue)),
                await AuditornUtils.max(reports.map((report) => report.audits["server-response-time"].numericValue)),
                await AuditornUtils.max(reports.map((report) => report.audits.metrics.details.items[0]["largestContentfulPaint"])),
                await AuditornUtils.max(reports.map((report) => report.audits.metrics.details.items[0]["maxPotentialFID"])),
                await AuditornUtils.max(reports.map((report) => report.audits.metrics.details.items[0]["cumulativeLayoutShift"])),
            ), await this.score(
                "平均",
                await AuditornUtils.sum(reports.map((report) => report.categories.performance.score * 100)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.categories.accessibility.score * 100)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.categories["best-practices"].score * 100)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.categories.seo.score * 100)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.audits["first-contentful-paint"].numericValue)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.audits["first-meaningful-paint"].numericValue)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.audits["server-response-time"].numericValue)) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.audits.metrics.details.items[0]["largestContentfulPaint"])) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.audits.metrics.details.items[0]["maxPotentialFID"])) / total_count,
                await AuditornUtils.sum(reports.map((report) => report.audits.metrics.details.items[0]["cumulativeLayoutShift"])) / total_count,
            ), await this.score(
                "中央",
                await AuditornUtils.median(reports.map((report) => report.categories.performance.score * 100)),
                await AuditornUtils.median(reports.map((report) => report.categories.accessibility.score * 100)),
                await AuditornUtils.median(reports.map((report) => report.categories["best-practices"].score * 100)),
                await AuditornUtils.median(reports.map((report) => report.categories.seo.score * 100)),
                await AuditornUtils.median(reports.map((report) => report.audits["first-contentful-paint"].numericValue)),
                await AuditornUtils.median(reports.map((report) => report.audits["first-meaningful-paint"].numericValue)),
                await AuditornUtils.median(reports.map((report) => report.audits["server-response-time"].numericValue)),
                await AuditornUtils.median(reports.map((report) => report.audits.metrics.details.items[0]["largestContentfulPaint"])),
                await AuditornUtils.median(reports.map((report) => report.audits.metrics.details.items[0]["maxPotentialFID"])),
                await AuditornUtils.median(reports.map((report) => report.audits.metrics.details.items[0]["cumulativeLayoutShift"])),
            )
        );

        this.log(chalk.greenBright(columnify(summary, {
            columnSplitter: ' | ',
            config: {
                Performance: {align: 'right'},
                Accessibility: {align: 'right'},
                'Best Practice': {align: 'right'},
                SEO: {align: 'right'},
                // PWA: {align: 'right'},
                'first-contentful-paint': {align: 'right'},
                'first-meaningful-paint': {align: 'right'},
                'time-to-first-byte': {align: 'right'},
                'largest-contentful-paint': {align: 'right'},
                'first-input-delay': {align: 'right'},
                'cumulative-layout-shift': {align: 'right'},
            }
        })));
    }

    async score(label: string,
                perf: number,
                acc: number,
                prac: number,
                seo: number,
                fcp: number,
                fmp: number,
                ttfb: number,
                lcp: number,
                fid: number,
                cls: number): Promise<Object> {
        return {
            label: label,
            Performance: perf.toLocaleString('en-us', {minimumFractionDigits: 0}),
            Accessibility: acc.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'Best Practice': prac.toLocaleString('en-us', {minimumFractionDigits: 0}),
            SEO: seo.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'first-contentful-paint': fcp?.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'first-meaningful-paint': fmp?.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'time-to-first-byte': ttfb?.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'largest-contentful-paint': lcp?.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'first-input-delay': fid?.toLocaleString('en-us', {minimumFractionDigits: 0}),
            'cumulative-layout-shift': cls?.toLocaleString('en-us', {minimumFractionDigits: 0}),
        }
    }

}

const questions: Array<Object> = [
    {
        type: 'list',
        name: 'service',
        message: '対象サービス: ',
        choices: async () => {
            return fs.readdirSync(Auditorn.Definitions)
                .filter((file: string) => fs.statSync(`${Auditorn.Definitions}/${file}`).isFile() && /.*\.json$/.test(file))
                .map((file: string) => {
                    let service = require(`../../${Auditorn.Definitions}/${file}`) as IService;
                    return {
                        name: service.name,
                        value: service
                    }
                }).sort();
        },

        validate: function (answer: any) {
            return answer.length >= 1;
        },
    },
    {
        type: 'checkbox',
        name: 'resources',
        message: '対象リソース: ',
        choices: async (answers) => {
            let resources = answers["service"].resources;
            return !resources ? [] : resources.map((resource: IResource) => {
                return {
                    name: resource.name,
                    value: resource,
                    checked: true,
                }
            });
        },
        validate: function (answer: any) {
            return answer.length >= 1;
        },
    },
];