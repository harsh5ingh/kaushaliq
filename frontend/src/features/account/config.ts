export const personalSections=['education','interests','skills','career','geography'] as const;
export type EditableSection=typeof personalSections[number];
export const latestCompletionYear=new Date().getFullYear()+10;
import { personalEn } from '../../app/i18n/locales/personal';
import type { Translator, MessageKey } from '../../app/i18n/config';
export function preferenceLabel(t:Translator,kind:'i'|'g',id:string) { const key=`personal.${kind}.${id}`; return key in personalEn?t(key as MessageKey):id; }
