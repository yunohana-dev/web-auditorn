import { IReport, ICategories, IAudits } from "./type/auditor";

export class ReportDto {

  report: IReport;
  categories: ICategories;
  audits: IAudits;

  constructor(report: IReport) {
    this.report = report;
    this.categories = report.categories;
    this.audits = report.audits;
  }

  getPerformance(): number {
    return this.categories.performance.score || 0
  }
  getFixedPerformance(): number {
    return this.getPerformance() * 100
  }
  getAccessibility(): number {
    return this.categories.accessibility.score || 0
  }
  getFixedAccessibility(): number {
    return this.getAccessibility() * 100
  }
  getBestPractice(): number {
    return this.categories["best-practices"].score || 0
  }
  getFixedBestPractice(): number {
    return this.getBestPractice() * 100
  }
  getSeo(): number {
    return this.categories.seo.score || 0
  }
  getFixedSeo(): number {
    return this.getSeo() * 100
  }
  getTimeToFirstByte(): number {
    return this.audits["server-response-time"].numericValue || 0
  }
  getFirstContentfulPaint(): number {
    return this.audits["first-contentful-paint"].numericValue || 0
  }
  getFirstMeaningfulPaint(): number {
    return this.audits["first-meaningful-paint"].numericValue || 0
  }
  getLargestContentfulPaint(): number {
    return this.audits["largest-contentful-paint"].numericValue || 0
  }
  getFirstInputDelay(): number {
    return this.audits["max-potential-fid"].numericValue || 0
  }
  getCumulativeLayoutShift(): number {
    return this.audits["cumulative-layout-shift"].numericValue || 0
  }

}
