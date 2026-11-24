import type { IClock } from '../../application/ports/IClock';
import { toLocalDate } from '../../shared/utils/dates';

export class SystemClock implements IClock {
  today(): string {
    return toLocalDate(new Date());
  }
}
