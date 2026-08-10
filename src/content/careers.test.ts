/**
 * Career-ladder invariants — the design rules from GDD §4.1, enforced as data
 * tests so any new ladder or re-tune keeps them true:
 *   1. No strictly-dominated roles: each role's gate is a distinct requirement set.
 *   2. Reachable: a ladder only gates on skills its own roles grow, so every
 *      promotion is attainable by working that field.
 *   3. Pay rises monotonically up each ladder (a promotion always pays more).
 *   4. Every role is registered and maps back to its ladder.
 */
import { describe, it, expect } from 'vitest';
import { LADDERS, ROLE_BY_ID, ladderOfRole } from './careers';
import type { Requirement, SkillId } from '../state/types';

/** Every skill id referenced anywhere in a requirement tree. */
function skillsInGate(req: Requirement, acc: Set<SkillId> = new Set()): Set<SkillId> {
  if (req.kind === 'skill') acc.add(req.id);
  if (req.kind === 'allOf' || req.kind === 'anyOf') req.reqs.forEach((r) => skillsInGate(r, acc));
  return acc;
}

/** Collect every requirement of a given kind in a tree. */
function reqsOfKind<K extends Requirement['kind']>(
  req: Requirement,
  kind: K,
  acc: Extract<Requirement, { kind: K }>[] = [],
): Extract<Requirement, { kind: K }>[] {
  if (req.kind === kind) acc.push(req as Extract<Requirement, { kind: K }>);
  if (req.kind === 'allOf' || req.kind === 'anyOf') req.reqs.forEach((r) => reqsOfKind(r, kind, acc));
  return acc;
}

describe('career ladders', () => {
  it('give every role a unique gate (no strictly-dominated roles)', () => {
    for (const ladder of LADDERS) {
      const gates = ladder.roles.map((r) => JSON.stringify(r.gate));
      expect(new Set(gates).size, `${ladder.name} has duplicate gates`).toBe(gates.length);
    }
  });

  it('only gate on skills the field itself grows (reachability)', () => {
    for (const ladder of LADDERS) {
      const grown = new Set<SkillId>();
      for (const role of ladder.roles) {
        for (const id of Object.keys(role.skillGain ?? {})) grown.add(id as SkillId);
      }
      for (const role of ladder.roles) {
        for (const skill of skillsInGate(role.gate)) {
          expect(grown.has(skill), `${ladder.name}/${role.id} gates on ungrowable ${skill}`).toBe(
            true,
          );
        }
      }
    }
  });

  it('pay strictly increases up each ladder', () => {
    for (const ladder of LADDERS) {
      for (let i = 1; i < ladder.roles.length; i++) {
        expect(
          ladder.roles[i]!.salaryPerWeek,
          `${ladder.name}: ${ladder.roles[i]!.id} should out-pay ${ladder.roles[i - 1]!.id}`,
        ).toBeGreaterThan(ladder.roles[i - 1]!.salaryPerWeek);
      }
    }
  });

  it('register every role and map it back to its ladder', () => {
    for (const ladder of LADDERS) {
      for (const role of ladder.roles) {
        expect(ROLE_BY_ID[role.id]).toBe(role);
        expect(ladderOfRole(role.id)).toBe(ladder);
      }
    }
  });

  it('gate promotions on current-role tenure, never whole-field experience', () => {
    for (const ladder of LADDERS) {
      for (let i = 1; i < ladder.roles.length; i++) {
        const role = ladder.roles[i]!;
        const prev = ladder.roles[i - 1]!;
        // Time served is measured in the current role, not across the whole field.
        expect(reqsOfKind(role.gate, 'fieldExp'), `${role.id} still gates on fieldExp`).toHaveLength(
          0,
        );
        // Any tenure requirement must be for the role directly below it.
        for (const rt of reqsOfKind(role.gate, 'roleTenure')) {
          expect(rt.roleId, `${role.id} tenure-gates on a non-adjacent role`).toBe(prev.id);
        }
      }
    }
  });

  it('open Service and Labor with an always-available entry rung', () => {
    for (const field of ['service', 'labor'] as const) {
      const ladder = LADDERS.find((l) => l.field === field)!;
      expect(ladder.roles[0]!.gate).toEqual({ kind: 'always' });
    }
  });
});
