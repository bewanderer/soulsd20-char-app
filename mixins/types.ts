export interface CharacterStats {
  Resistances: Resistances;
  Stats: Stats;
  Skills: Skills;
  Knowledge: Knowledge;
}

export interface Resistances {
  Curse: number;
  Frost: number;
  Bleed: number;
  Poison: number;
  Toxic: number;
  Poise: number;

  Physical: number;
  Magic: number;
  Fire: number;
  Lightning: number;
  Dark: number;

  FlatPhysical: number;
  FlatMagic: number;
  FlatFire: number;
  FlatLightning: number;
  FlatDark: number;
}

export interface Stats {
  Vitality: number;
  Endurance: number;
  Strength: number;
  Dexterity: number;
  Attunement: number;
  Intelligence: number;
  Faith: number;
}

export interface Skills {
  Athletics: number;
  Acrobatics: number;
  Perception: number;
  FireKeeping: number;
  Sanity: number;
  Stealth: number;
  Precision: number;
  Diplomacy: number;
}

export interface Knowledge {
  Magics: number;
  WorldHistory: number;
  Monsters: number;
  Cosmic: number;
}

export interface WeaponProficiencies {
  Spear: number;
  Shield: number;
  Gun: number;
  Dagger: number;
  Whip: number;
  Hammer: number;
  StraightSword: number;
  Katana: number;
  Greatsword: number;
  Reaper: number;
  Axe: number;
  Fist: number;
  Bow: number;
  Halberd: number;
  Twinblade: number;
  Sorcery: number;
  Miracles: number;
}

export interface Fate {
  UUID: string;
  Cost: number;
  Name: string;
  Description: string;
}

export interface Item {
  id: number;
  name: string;
  category: string;
  description?: string;
  Quantity: number; // Keep for player store compatibility
}

export interface Spell {
  id: number;
  name: string;
  description: string;
  requirements: string;
  cost: number;
  ap: number | string;
  fp: number;
  damage: string;
  range: string;
  duration: string;
  att_cost?: number; // Attunement cost (default 1 if not specified)
  charged_relation_uuid?: string;
  charged_spell?: Spell | null;
  category?: string; // For spell categorization
  dice?: Array<{ // Spell damage dice from API
    amount: number;
    sides: number;
    element_type: string;
  }>;
  spell_scaling?: Array<{ // Spell scaling from API
    stat: string;
    grade: string;
  }>;
}

export interface Spirit {
  id: number;
  name: string;
  tier: string; // Tier I, II, III, IV
  description: string;
  size: string; // Small, Medium, Large, Huge, Gargantuan, Colossal
  requirements: string;
  cost: number; // FP maintenance cost per turn
  att_cost: number; // Attunement slot cost
  dice?: Array<{ // Spirit damage dice from API
    amount: number;
    sides: number;
    element_type: string;
  }>;
  spell_scaling?: Array<{ // Spirit scaling from API (INT/FAI based)
    stat: string;
    grade: string;
  }>;
}

export interface DestinyFeat {
  id: number;
  name: string;
  cost: number;
  description: string;
}

export interface WeaponFeat {
  id: number;
  name: string;
  level: number;
  weapon_tree: string;
  description: string;
}

// Extended interface for obtained weapon proficiency feats (includes cross-tree acquisition data)
export interface ObtainedWeaponProfFeat {
  id: number;
  feat_id: number;
  weapon_tree: string;
  level: number;
  name: string;
  description: string;
  // Cross-tree acquisition fields
  source: 'natural' | 'dual_wielding_skilled' | 'dual_wielding_skilled_plus' |
          'dual_wielding_master' | 'dual_wielding_master_plus' |
          'musical_skilled_artist' | 'musical_master_artist' |
          'protege_1' | 'protege_2' | 'protege_3';
  source_feat_id?: number;  // ID of the granting feat (for cascading un-obtain)
  is_greyed_out: boolean;   // True if obtained via DW or Musical (show in original tree as greyed)
  acquisition_note?: string; // Display note like "(acquired through Dual Wielding - Skilled Wielder)"
}

// Flags for Dual Wielding cross-tree feat acquisition
export interface DualWieldingFeatFlags {
  skilled_wielder_used: boolean;          // Has choice been made?
  skilled_wielder_plus_used: boolean;
  master_wielder_used: boolean;
  master_wielder_plus_used: boolean;
  master_wielder_plus_chose_fate: boolean; // Did user choose +1 fate instead of feat?
}

// Flags for Protege cross-tree feat acquisition
export interface ProtegeFlags {
  protege_1_lv3_obtained: boolean;     // Immediate lv3 feat obtained
  protege_1_lv5_used: boolean;         // Has lv5 choice been made?
  protege_1_lv5_postponed: boolean;    // Is lv5 choice postponed?
  protege_1_postponed_trees: string[]; // Trees available when postponed

  protege_2_used: boolean;
  protege_2_postponed: boolean;
  protege_2_postponed_trees: string[];

  protege_3_used: boolean;
  protege_3_postponed: boolean;
  protege_3_postponed_trees: string[];
}

// Flags for Musical Instruments cross-tree feat acquisition
export interface MusicalInstrumentsFeatFlags {
  skilled_artist_used: boolean;   // Has Skilled Artist choice been made?
  master_artist_used: boolean;    // Has Master Artist choice been made?
}

export interface WeaponFeats {
  Spear: WeaponFeat[];
  Shield: WeaponFeat[];
  Gun: WeaponFeat[];
  Dagger: WeaponFeat[];
  Whip: WeaponFeat[];
  Hammer: WeaponFeat[];
  StraightSword: WeaponFeat[];
  Katana: WeaponFeat[];
  Greatsword: WeaponFeat[];
  Reaper: WeaponFeat[];
  Axe: WeaponFeat[];
  Fist: WeaponFeat[];
  Bow: WeaponFeat[];
  Halberd: WeaponFeat[];
  Twinblade: WeaponFeat[];
  Sorcery: WeaponFeat[];
  Miracles: WeaponFeat[];
}

export interface WeaponScaling {
  type: string;
  stat: string;
  value: string;
  grade?: string;
}

export interface WeaponSpellScaling {
  stat: string;
  requirement: number;
  value: string;
  grade?: string;
}

export interface WeaponDice {
  type: string;
  count: number;
  value: number;
  sides?: number;
  element?: string;
}

export interface WeaponRequirements {
  str?: number;
  dex?: number;
  int?: number;
  fai?: number;
}

export interface WeaponSkill {
  id: number;
  name: string;
  ap?: number;
  fp?: number;
  cost_ap?: number; // Alternative AP property from modifications
  cost_fp?: number; // Alternative FP property from modifications
  description?: string;
}

export interface Weapon {
  id: number;
  name: string;
  weapon_type: string;
  second_type?: string;
  ap: number | string;
  durability: number;
  infusion?: string;
  description?: string;
  is_trick?: boolean;
  is_twin?: boolean;
  is_official?: boolean;
  created_at?: string;
  created_by?: string | null;
  skill_primary?: string | WeaponSkill;
  skill_secondary?: string | WeaponSkill | null;
  usage_formula?: string | null;
  requirements: WeaponRequirements;
  scaling: WeaponScaling[];
  spell_scaling?: WeaponSpellScaling[];
  dice: WeaponDice[];
  bonuses?: any[];
}

export interface UserInputValues {
  Exhaustion: number;
  FirekeepingChecks: number;

  TotalDodges: number;
  CurrentDodges: number;

  CurrentHP: number;
  CurrentFP: number;
  CurrentAP: number;
  TempHP: number;

  MaxHPBonus: number;
  MaxFPBonus: number;
  MaxAPBonus: number;

  HpFlask: number;
  FpFlask: number;
  FlaskLevel: number;

  AttunementSlots: number;

  DestinyFeatUsages: {};
  WeaponFeatUsages: {};

  CurrentStatuses: Statuses;
  BonusStatuses: Statuses;
  BonusResistances: InputValueResistances;
  BonusResistancesActive: boolean;
  BonusResistancesTemp: InputValueResistances;
  Conditions: Conditions;
}

export interface Conditions {
  ImpairedVision: boolean;
  Deaf: boolean;
  ArmFracture: boolean;
  LegFracture: boolean;
  Grappled: boolean;
  Restrained: boolean;
  Prone: boolean;
  Dazed: boolean;
  LockedUp: boolean;
  Staggered: boolean;
  Frenzied: boolean;
  Berzerk: boolean;
}

export interface Statuses {
  Curse: number;
  Frost: number;
  Bleed: number;
  Poison: number;
  Toxic: number;
  Poise: number;
}

export interface InputValueResistances {
  Physical: number;
  Magic: number;
  Fire: number;
  Lightning: number;
  Dark: number;

  FlatPhysical: number;
  FlatMagic: number;
  FlatFire: number;
  FlatLightning: number;
  FlatDark: number;
}

// Notes System
export interface Notes {
  sections: NoteSection[];
}

export interface NoteSection {
  id: string;
  name: string;
  content: string;
  created_at: string;
  updated_at: string;
  expanded?: boolean; // For UI expand/collapse
}

// Compendium System
export interface Compendium {
  entries: CompendiumEntry[];
}

export type CompendiumEntry =
  | LoreEntry
  | CharacterEntry
  | LocationEntry
  | MonsterEntry
  | OtherEntry;

interface BaseEntry {
  id: string;
  type: 'lore' | 'character' | 'location' | 'monster' | 'other';
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LoreEntry extends BaseEntry {
  type: 'lore';
  content: string;
}

export interface CharacterEntry extends BaseEntry {
  type: 'character';
  content: string;
  lineage_id: number | null;
  bloodline_id: number | null;
  age: number | null;
}

export interface LocationEntry extends BaseEntry {
  type: 'location';
  content: string;
}

export interface MonsterEntry extends BaseEntry {
  type: 'monster';
  is_boss: boolean;
  resistances: MonsterResistance[];
  statuses: MonsterStatus[];
  hp: number | null;
  fp: number | null;
  ap: number | null;
  behavior_notes: string;
}

export interface MonsterResistance {
  resistance_type: ResistanceType;
  modifier: number; // -100 to 999 (percentage)
  phase?: number; // Phase number (for boss monsters)
}

export interface MonsterStatus {
  status_type: StatusType;
  modifier: number; // Flat value
  phase?: number; // Phase number (for boss monsters)
}

export enum ResistanceType {
  PHYSICAL = 'Physical',
  MAGIC = 'Magic',
  FIRE = 'Fire',
  LIGHTNING = 'Lightning',
  DARK = 'Dark'
}

export enum StatusType {
  FROST = 'Frost',
  BLEED = 'Bleed',
  POISON = 'Poison',
  TOXIC = 'Toxic',
  CURSE = 'Curse',
  POISE = 'Poise'
}

// Keep DamageType for backward compatibility
export enum DamageType {
  PHYSICAL = 'Physical',
  MAGIC = 'Magic',
  FIRE = 'Fire',
  LIGHTNING = 'Lightning',
  DARK = 'Dark',
  FROST = 'Frost',
  BLEED = 'Bleed',
  POISON = 'Poison',
  TOXIC = 'Toxic',
  CURSE = 'Curse',
  POISE = 'Poise'
}

export interface OtherEntry extends BaseEntry {
  type: 'other';
  content: string;
}

// Combat System - Companion
export interface Companion {
  id: string;
  name: string;
  type: string;
  hp: number | null;
  fp: number | null;
  ap: number | null;
  skills: {
    Athletics: number;
    Acrobatics: number;
    Perception: number;
    FireKeeping: number;
    Sanity: number;
    Stealth: number;
    Precision: number;
    Diplomacy: number;
  };
  resistances: {
    Physical: number;
    Magic: number;
    Fire: number;
    Lightning: number;
    Dark: number;
  };
  statuses: {
    Frost: number;
    Bleed: number;
    Poison: number;
    Toxic: number;
    Curse: number;
    Poise: number;
  };
  notes: string;
}

// Combat System - Weapon Modifications
export interface WeaponModifications {
  isModified: boolean;
  ap?: number;
  dice?: WeaponDice[];
  scaling?: WeaponScaling[];
  spell_scaling?: WeaponSpellScaling[];
}

// Combat System - Settings
export interface CombatSettings {
  twoHandingMainHand: boolean;
  twoHandingOffHand: boolean;
  companionActive: boolean;
  activeCompanionId: string | null;
  mainHandModifications?: WeaponModifications;
  offHandModifications?: WeaponModifications;
}