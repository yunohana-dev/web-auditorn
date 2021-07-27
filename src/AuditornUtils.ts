import fs from 'fs';
import makeDir from 'make-dir'

export namespace AuditornUtils {

  export async function writeJson(path: string, filename: string, object: any) {
    await makeDir(path);
    await fs.writeFileSync(`${path}/${filename}.json`, JSON.stringify(object, null, "  "));
  }

  export async function sum(numbers: number[]): Promise<number> {
    return numbers.reduce((accumulator, currentValue) => accumulator + currentValue);
  }

  export async function max(numbers: number[]): Promise<number> {
    return numbers.reduce((a, b) => Math.max(a, b));
  }

  export async function min(numbers: number[]): Promise<number> {
    return numbers.reduce((a, b) => Math.min(a, b));
  }

  export async function median(numbers: number[]): Promise<number> {
    if (numbers.length === 0) return 0;
    if (numbers.length === 1) return numbers[0];
    numbers.sort((a, b) => a - b);
    let center = Math.floor(numbers.length / 2);
    if (center % 2 === 0) return numbers[center];
    return (numbers[center - 1] + numbers[center]) / 2;
  }

}
