/** Mongolian dative («to …»): -т after г в р с д т («авдарт», «газарт»), otherwise -д («Номинд», «Ануд», «буудалд»). */
export const dative = (w: string) => (w ? `${w}${/[гврсдт]$/i.test(w) ? 'т' : 'д'}` : w);
