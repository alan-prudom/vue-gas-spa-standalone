import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { pt } from './pt';
import { pl } from './pl';

export const locales = {
    en,
    es,
    fr,
    pt,
    pl
};

export type LocaleCode = keyof typeof locales;
export type LocaleStrings = typeof en;
