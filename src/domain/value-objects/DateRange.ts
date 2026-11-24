/** Rango inclusivo de fechas YYYY-MM-DD. Un extremo vacío significa sin límite. */
export class DateRange {
  constructor(
    readonly from: string = '',
    readonly to: string = '',
  ) {}

  contains(date: string): boolean {
    return (!this.from || date >= this.from) && (!this.to || date <= this.to);
  }

  get isEmpty(): boolean {
    return !this.from && !this.to;
  }
}
