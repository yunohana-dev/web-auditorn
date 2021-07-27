/** ウェブ監査を行うサービス */
export interface IService {
    name: string;
    origin: string;
    // サービスがCDNを利用している場合、透過するcookie名を指定する
    // 指定している場合、同じ条件で cache Hit/Miss 両方の測定を行う
    'cdn-whitelist-cookie'?: string;
    resources: Array<IResource>;
}

/** 監査対象のリソース・ページ */
export interface IResource {
    name: string;
    path: string;
}

/** 監査結果レポート */
export interface IReport {
    userAgent: string;
    environment: {
        networkUserAgent: string;
        hostUserAgent: string;
        benchmarkIndex: string;
    };
    lighthouseVersion: string;
    audits: {
        'first-contentful-paint': IPart;
        'first-meaningful-paint': IPart;
        'time-to-first-byte': IPart;
        'metrics': IMetrics;
    }
    categories: {
        performance: IPart;
        accessibility: IPart;
        'best-practices': IPart;
        seo: IPart;
        pwa: IPart;
    }
}

/** 監査項目ごとの評価 */
export interface IPart {
    title: string;
    id: string;
    score: number;
    numericValue: number;
}

export interface IMetrics {
    details: IDetail;
}

export interface IDetail {
    type: string;
    items: Array<Object>;
}