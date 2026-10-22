import { IGNAT } from './ignat';
import { INSPECTOR } from './inspector';
import { PROHOROV } from './prohorov';
import type { InterrogationDef, NpcId } from './types';

export const INTERROGATIONS: Record<NpcId, InterrogationDef> = {
  ignat: IGNAT,
  prohorov: PROHOROV,
  inspector: INSPECTOR,
};

export type { InterrogationDef, NpcId } from './types';
