import type { CategoryConfig } from './types';
/** Founder-approved LOCAL policy records only. D-008,9Nov2026 01:41PKT.
 * Not deployment, collection rights or evidence that a real product catalogue exists.
 * Reviewed canonical per-model attributes still supplied by the catalogue boundary;
 * never fill production attribute ranges/aliases from SYNTHETIC fixtures. */
export type ApprovedProductionPolicy = Required<Pick<CategoryConfig,'id'|'version'|'config_version'|'environment'|'approval_status'|'approval_scope'|'approver_allowlist'|'price_bounds_minor'>>;
const approved = (id: string,min: number,max: number): ApprovedProductionPolicy => ({
 id,version:'1.0.0',config_version:'1.0.0',environment:'PRODUCTION',approval_status:'APPROVED',
 price_bounds_minor:{min,max,basis:'APPROVED'},approver_allowlist:['musmanj'],
 approval_scope:{category_id:id,conditions:['NEW_SEALED','USED'],approved_by:'musmanj',approved_at:'2026-11-08T20:41:00Z',source_ref:'pm/config-bounds-proposal.md v0.2 §1.1-1.2; D-008'}
});
function freeze<T>(v:T):T {if(v!==null && typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
export const PRODUCTION_CATEGORY_CONFIGS: Readonly<Record<'phones'|'laptops'|'consoles',ApprovedProductionPolicy>> = freeze({
 phones:approved('phones',150000,150000000),laptops:approved('laptops',500000,300000000),consoles:approved('consoles',500000,90000000)
});
export type CanonicalCategorySchema = Pick<CategoryConfig,'id'|'label_key'|'attributes'|'condition_values'|'used_grade_values'>;
/** Resolve reviewed schema separately. Caller must also use1.0.0 on canonical variants;
 * no implicit migration, values guessing or fixture import into production. */
export function withApprovedProductionPolicy(schema: CanonicalCategorySchema): CategoryConfig {
 if(!Object.hasOwn(PRODUCTION_CATEGORY_CONFIGS,schema.id)) throw new RangeError('CONFIGURATION_REQUIRED');
 const p=PRODUCTION_CATEGORY_CONFIGS[schema.id as keyof typeof PRODUCTION_CATEGORY_CONFIGS];
 return {...schema,...p,price_bounds_minor:{...p.price_bounds_minor},approver_allowlist:[...p.approver_allowlist!],approval_scope:{...p.approval_scope!,conditions:[...p.approval_scope!.conditions]}};
}
