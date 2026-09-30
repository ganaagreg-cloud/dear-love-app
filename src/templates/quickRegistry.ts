import type { QuickSpec } from './quick';
import { questQuick } from './quest/quick';
import { bookQuick } from './book/quick';
import { flightQuick } from './flight/quick';
import { wrappedQuick } from './wrapped/quick';
import { locketQuick } from './locket/quick';
import { netflixQuick } from './netflix/quick';

/** Quick-create adapters by template id (see src/templates/quick.ts). */
export const QUICK: Record<string, QuickSpec> = {
  quest: questQuick, book: bookQuick, flight: flightQuick, wrapped: wrappedQuick, locket: locketQuick, netflix: netflixQuick,
};
