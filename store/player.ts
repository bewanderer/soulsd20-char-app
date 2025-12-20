import { defineStore } from 'pinia'
import { watch } from 'vue'
import { useCompendiumStore } from '~~/store/compendium'
import {
  CharacterStats,
  DestinyFeat,
  Item,
  Spell,
  Spirit,
  WeaponFeat,
  UserInputValues,
  Notes,
  Compendium,
  Companion,
  CombatSettings,
  ObtainedWeaponProfFeat,
  DualWieldingFeatFlags,
  ProtegeFlags,
  MusicalInstrumentsFeatFlags,
} from '@/mixins/types'
import {
  getActiveCharacter,
  updateCharacter,
  downloadCharacterAsFile,
  migrateCharacterData,
  type StoredCharacter
} from '@/mixins/characterStorage'

type EquippedItem = {
  id: number;
  category: string;
  name: string;
} | null;

type Equipment = {
  MainHand: EquippedItem;
  OffHand: EquippedItem;
  Armor: EquippedItem;
  Artifact: EquippedItem;
  Artifact2: EquippedItem;
  Ring1: EquippedItem;
  Ring2: EquippedItem;
  Ring3: EquippedItem;
  Ring4: EquippedItem;
  Ring5: EquippedItem;
};

type RootState = {
  UUID: string;
  UserUUID: string;
  Name: string;
  Gender: string;
  PhysicalDescription: string;
  Lineage: string;
  Background: string;
  LineageId: number | null;
  BackgroundId: number | null;
  BloodlineId: number | null;
  Undying: number;
  Souls: number;
  Level: number;
  StartingHP: number;
  LevelHP: number;
  HealthDie: {
    count: number;  // X in XdY
    sides: number;  // Y in XdY
  };

  PendingLevelUp: {
    active: boolean;
    targetLevel: number;
    isEvenLevel: boolean;

    // HP & Stats & Knowledge
    hpRoll: number | null;
    lastHealthDie: { count: number; sides: number } | null; // Track dice config when roll was made
    selectedStat: string | null;
    oldStatValue: number;
    newStatValue: number;
    selectedKnowledge: string | null;

    // Proficiency Points
    primaryToSpend: number;
    secondaryToSpend: number;
    tertiaryToSpend: number;
    primarySpent: number;
    secondarySpent: number;
    tertiarySpent: number;
    tempTreeAllocations: Record<string, number>;

    // Completion
    completed: boolean;
  } | null;

  // Multi Proficient tracking
  HasMultiProficient: boolean;
  MultiProficientRetroactivePoints: number;

  UserInputValues: UserInputValues;

  FatePoints: number;
  DestinyFeatSlots: number;
  DodgeCostOverride: number | null;
  DodgeDistanceOverride: number | null;
  ItemUsageCostOverride: number | null;
  JumpHorizontalOverride: number | null;
  JumpVerticalOverride: number | null;
  RunningJumpHorizontalOverride: number | null;
  RunningJumpVerticalOverride: number | null;
  MaxEquipLoadOverride: number | null;
  Enable5thRingSlot: boolean;
  Enable2ndArtifactSlot: boolean;
  WorthlessHuskCount: number;
  AttunedSpells: Spell[];
  LearnedSpells: number[];
  AttunedSpirits: Spirit[];
  LearnedSpirits: number[];
  AttunedWeaponSkills: any[];
  LearnedWeaponSkills: number[];
  SpellModifications: Record<number, any>;      // Custom modifications for spells (keyed by spell ID)
  SpiritModifications: Record<number, any>;     // Custom modifications for spirits (keyed by spirit ID)
  WeaponSkillModifications: Record<number, any>; // Custom modifications for weapon skills (keyed by skill ID)
  WeaponModifications: Record<number, any>;     // Custom modifications for weapons (keyed by weapon ID)
  ObtainedDestinedTraits: any[];                // Obtained destined traits
  DestinedTraitModifications: Record<number, any>; // Custom modifications for destined traits (keyed by trait ID)
  WeaponProficiencyPoints?: {                   // Weapon proficiency points system
    total: number;                              // Total points available (manually editable)
    baseFromLevel: number;                      // Points from level (auto-calculated)
    customBonus: number;                        // Custom bonus points (manually added)
  };
  ObtainedWeaponProfFeats: ObtainedWeaponProfFeat[];  // Obtained weapon proficiency feats
  DualWieldingFeatFlags: DualWieldingFeatFlags;       // Flags for Dual Wielding cross-tree acquisition
  MusicalInstrumentsFeatFlags: MusicalInstrumentsFeatFlags;  // Flags for Musical Instruments cross-tree acquisition
  ProtegeFlags: ProtegeFlags;                         // Flags for Protege cross-tree acquisition
  TemporaryFatePoints: number;                        // Temporary fate points (from DW Master Wielder+)
  DestinyFeats: DestinyFeat[];
  Inventory: Item[],
  Equipment: Equipment;
  WeaponFeats: WeaponFeat[];
  CharacterStats: CharacterStats;
  Spells: Spell[];
  WeaponProficiencies: any;

  Notes: Notes;
  Compendium: Compendium;
  FieldNotes: {
    [key: string]: string;
  };
  Companions: Companion[];
  CombatSettings: CombatSettings;
  CharacterImagePath: string; // Base64 encoded character image
  _autoSaveInitialized: boolean; // Internal flag to prevent duplicate auto-save setup
}

export const usePlayerStore = defineStore({
  id: 'playerStore',
  state: () => ({
    UUID: '',
    UserUUID: '',
    Name: 'Yah',
    Gender: 'Male',
    PhysicalDescription: '',
    Lineage: 'Human',
    Background: 'Knight',
    LineageId: null,
    BackgroundId: null,
    BloodlineId: null,
    Undying: 0,
    Souls: 0,
    Level: 0,
    StartingHP: 0,
    LevelHP: 0,
    HealthDie: {
      count: 1,
      sides: 6
    },

    PendingLevelUp: null,
    HasMultiProficient: false,
    MultiProficientRetroactivePoints: 0,

    UserInputValues: {
      Exhaustion: 0,
      FirekeepingChecks: 0,

      TotalDodges: 0,
      CurrentDodges: 0,

      CurrentHP: 0,
      CurrentFP: 0,
      CurrentAP: 0,
      TempHP: 0,

      MaxHPBonus: 0,
      MaxFPBonus: 0,
      MaxAPBonus: 0,

      HpFlask: 0,
      FpFlask: 0,
      FlaskLevel: 0,

      AttunementSlots: 0,

      DestinyFeatUsages: {},
      WeaponFeatUsages: {},

      CurrentStatuses: {
        Curse: 0,
        Frost: 0,
        Bleed: 0,
        Poison: 0,
        Toxic: 0,
        Poise: 0,
      },
      BonusStatuses: {
        Curse: 0,
        Frost: 0,
        Bleed: 0,
        Poison: 0,
        Toxic: 0,
        Poise: 0,
      },
      BonusResistances: {
        Physical: 0,
        Magic: 0,
        Fire: 0,
        Lightning: 0,
        Dark: 0,

        FlatPhysical: 0,
        FlatMagic: 0,
        FlatFire: 0,
        FlatLightning: 0,
        FlatDark: 0,
      },
      BonusResistancesActive: false,
      BonusResistancesTemp: {
        Physical: 0,
        Magic: 0,
        Fire: 0,
        Lightning: 0,
        Dark: 0,

        FlatPhysical: 0,
        FlatMagic: 0,
        FlatFire: 0,
        FlatLightning: 0,
        FlatDark: 0,
      },
      Conditions: {
        ImpairedVision: false,
        Deaf: false,
        ArmFracture: false,
        LegFracture: false,
        Grappled: false,
        Restrained: false,
        Prone: false,
        Dazed: false,
        LockedUp: false,
        Staggered: false,
        Frenzied: false,
        Berzerk: false,
      }
    },

    Inventory: [],
    Equipment: {
      MainHand: null,
      OffHand: null,
      Armor: null,
      Artifact: null,
      Artifact2: null,
      Ring1: null,
      Ring2: null,
      Ring3: null,
      Ring4: null,
      Ring5: null,
    },
    FatePoints: 2,
    DestinyFeatSlots: 0,
    DodgeCostOverride: null,
    DodgeDistanceOverride: null,
    ItemUsageCostOverride: null,
    JumpHorizontalOverride: null,
    JumpVerticalOverride: null,
    RunningJumpHorizontalOverride: null,
    RunningJumpVerticalOverride: null,
    MaxEquipLoadOverride: null,
    Enable5thRingSlot: false,
    Enable2ndArtifactSlot: false,
    WorthlessHuskCount: 0,
    AttunedSpells: [],
    LearnedSpells: [],
    AttunedSpirits: [],
    LearnedSpirits: [],
    AttunedWeaponSkills: [],
    LearnedWeaponSkills: [],
    SpellModifications: {},
    SpiritModifications: {},
    WeaponSkillModifications: {},
    WeaponModifications: {},  // Custom modifications for weapons (keyed by weapon ID)
    ObtainedDestinedTraits: [],
    DestinedTraitModifications: {},
    WeaponProficiencyPoints: {
      total: 0,          // Level 0 = 0 points
      baseFromLevel: 0,  // Points from level (1 per level)
      customBonus: 0     // Custom bonus points (from GM, artifacts, etc.)
    },
    ObtainedWeaponProfFeats: [],
    DualWieldingFeatFlags: {
      skilled_wielder_used: false,
      skilled_wielder_plus_used: false,
      master_wielder_used: false,
      master_wielder_plus_used: false,
      master_wielder_plus_chose_fate: false
    },
    MusicalInstrumentsFeatFlags: {
      skilled_artist_used: false,
      master_artist_used: false
    },
    ProtegeFlags: {
      protege_1_lv3_obtained: false,
      protege_1_lv5_used: false,
      protege_1_lv5_postponed: false,
      protege_1_postponed_trees: [],
      protege_2_used: false,
      protege_2_postponed: false,
      protege_2_postponed_trees: [],
      protege_3_used: false,
      protege_3_postponed: false,
      protege_3_postponed_trees: []
    },
    TemporaryFatePoints: 0,
    DestinyFeats: [],
    WeaponFeats: [],
    Spells: [],
    CharacterStats: {
      Resistances: {
        Curse: 0,
        Frost: 0,
        Bleed: 0,
        Poison: 0,
        Toxic: 0,
        Poise: 0,

        Physical: 0,
        Magic: 0,
        Fire: 0,
        Lightning: 0,
        Dark: 0,

        FlatPhysical: 0,
        FlatMagic: 0,
        FlatFire: 0,
        FlatLightning: 0,
        FlatDark: 0,
      },
      Stats: {
        Vitality: 10,
        Endurance: 10,
        Strength: 10,
        Dexterity: 10,
        Attunement: 10,
        Intelligence: 10,
        Faith: 10,
      },
      Skills: {
        Athletics: 0,
        Acrobatics: 0,
        Perception: 0,
        FireKeeping: 0,
        Sanity: 0,
        Stealth: 0,
        Precision: 0,
        Diplomacy: 0,
      },
      Knowledge: {
        Magics: 0,
        WorldHistory: 0,
        Monsters: 0,
        Cosmic: 0,
      },
    },
    WeaponProficiencies: {
      FIST: 0,
      DAGGER: 0,
      STRAIGHT_THRUST: 0,
      KATANA_CURVED: 0,
      ULTRA_GREAT_SWORD: 0,
      GREAT_AXE: 0,
      GREAT_HAMMER: 0,
      TWINBLADE: 0,
      SPEAR: 0,
      HALBERD: 0,
      REAPER: 0,
      WHIP: 0,
      CROSS_BOW: 0,
      GREAT_BOW_BALLISTA: 0,
      GUN: 0,
      SHIELD: 0,
      SORCERY: 0,
      MIRACLE: 0,
      PYROMANCY: 0,
      HEX: 0,
      SPIRIT_SUMMONING: 0,
      DUAL_WIELDING: 0,
    },
    Notes: {
      sections: []
    },
    Compendium: {
      entries: []
    },
    FieldNotes: {},
    AvatarURL: '',
    CharacterImagePath: '',
    Companions: [],
    CombatSettings: {
      twoHandingMainHand: false,
      twoHandingOffHand: false,
      companionActive: false,
      activeCompanionId: null,
      mainHandModifications: { isModified: false },
      offHandModifications: { isModified: false }
    },
    _autoSaveInitialized: false
  } as RootState),

  actions: {
    // Sync current character state to multi-character storage
    save() {
      if (!this.UUID) {
        // No character loaded, nothing to save
        return false
      }

      const characterData: Partial<StoredCharacter> = {
        name: this.Name,
        level: this.Level,
        souls_level: this.Level,
        physical_description: this.PhysicalDescription,

        // Stats
        stats: {
          vitality: this.CharacterStats.Stats.Vitality,
          endurance: this.CharacterStats.Stats.Endurance,
          strength: this.CharacterStats.Stats.Strength,
          dexterity: this.CharacterStats.Stats.Dexterity,
          attunement: this.CharacterStats.Stats.Attunement,
          intelligence: this.CharacterStats.Stats.Intelligence,
          faith: this.CharacterStats.Stats.Faith,
        },

        // Skills
        skills: {
          Athletics: this.CharacterStats.Skills.Athletics,
          Acrobatics: this.CharacterStats.Skills.Acrobatics,
          Perception: this.CharacterStats.Skills.Perception,
          FireKeeping: this.CharacterStats.Skills.FireKeeping,
          Sanity: this.CharacterStats.Skills.Sanity,
          Stealth: this.CharacterStats.Skills.Stealth,
          Precision: this.CharacterStats.Skills.Precision,
          Diplomacy: this.CharacterStats.Skills.Diplomacy,
        },

        // Knowledge
        knowledge: {
          Magics: this.CharacterStats.Knowledge.Magics,
          WorldHistory: this.CharacterStats.Knowledge.WorldHistory,
          Monsters: this.CharacterStats.Knowledge.Monsters,
          Cosmic: this.CharacterStats.Knowledge.Cosmic,
        },

        // HP tracking
        starting_hp: this.StartingHP,
        level_hp: this.LevelHP,
        health_die: this.HealthDie,
        current_hp: this.UserInputValues.CurrentHP,
        current_fp: this.UserInputValues.CurrentFP,
        current_ap: this.UserInputValues.CurrentAP,
        temp_hp: this.UserInputValues.TempHP,
        max_hp_bonus: this.UserInputValues.MaxHPBonus,
        max_fp_bonus: this.UserInputValues.MaxFPBonus,
        max_ap_bonus: this.UserInputValues.MaxAPBonus,

        // Flasks
        hp_flask: this.UserInputValues.HpFlask,
        fp_flask: this.UserInputValues.FpFlask,
        flask_level: this.UserInputValues.FlaskLevel,

        // Dodge tracking
        total_dodges: this.UserInputValues.TotalDodges,
        current_dodges: this.UserInputValues.CurrentDodges,

        // General tracking
        souls: this.Souls,
        undying: this.Undying,
        exhaustion: this.UserInputValues.Exhaustion,
        firekeeping_checks: this.UserInputValues.FirekeepingChecks,
        attunement_slots: this.UserInputValues.AttunementSlots,

        // Calculated attribute overrides
        dodge_cost_override: this.DodgeCostOverride,
        dodge_distance_override: this.DodgeDistanceOverride,
        item_usage_cost_override: this.ItemUsageCostOverride,
        jump_horizontal_override: this.JumpHorizontalOverride,
        jump_vertical_override: this.JumpVerticalOverride,
        running_jump_horizontal_override: this.RunningJumpHorizontalOverride,
        running_jump_vertical_override: this.RunningJumpVerticalOverride,
        max_equip_load_override: this.MaxEquipLoadOverride,

        // Equipment slot toggles
        enable_5th_ring_slot: this.Enable5thRingSlot,
        enable_2nd_artifact_slot: this.Enable2ndArtifactSlot,

        // Status inflictions
        current_statuses: {
          Curse: this.UserInputValues.CurrentStatuses.Curse,
          Frost: this.UserInputValues.CurrentStatuses.Frost,
          Bleed: this.UserInputValues.CurrentStatuses.Bleed,
          Poison: this.UserInputValues.CurrentStatuses.Poison,
          Toxic: this.UserInputValues.CurrentStatuses.Toxic,
          Poise: this.UserInputValues.CurrentStatuses.Poise,
        },

        // Status bonuses
        bonus_statuses: {
          Curse: this.UserInputValues.BonusStatuses.Curse,
          Frost: this.UserInputValues.BonusStatuses.Frost,
          Bleed: this.UserInputValues.BonusStatuses.Bleed,
          Poison: this.UserInputValues.BonusStatuses.Poison,
          Toxic: this.UserInputValues.BonusStatuses.Toxic,
          Poise: this.UserInputValues.BonusStatuses.Poise,
        },

        // Damage Calculator - Bonus Resistances (Primary table)
        bonus_resistances: {
          Physical: this.UserInputValues.BonusResistances.Physical,
          Magic: this.UserInputValues.BonusResistances.Magic,
          Fire: this.UserInputValues.BonusResistances.Fire,
          Lightning: this.UserInputValues.BonusResistances.Lightning,
          Dark: this.UserInputValues.BonusResistances.Dark,
          FlatPhysical: this.UserInputValues.BonusResistances.FlatPhysical,
          FlatMagic: this.UserInputValues.BonusResistances.FlatMagic,
          FlatFire: this.UserInputValues.BonusResistances.FlatFire,
          FlatLightning: this.UserInputValues.BonusResistances.FlatLightning,
          FlatDark: this.UserInputValues.BonusResistances.FlatDark,
        },

        // Damage Calculator - Temporary Bonus Resistances (Bonus table)
        bonus_resistances_temp: {
          Physical: this.UserInputValues.BonusResistancesTemp.Physical,
          Magic: this.UserInputValues.BonusResistancesTemp.Magic,
          Fire: this.UserInputValues.BonusResistancesTemp.Fire,
          Lightning: this.UserInputValues.BonusResistancesTemp.Lightning,
          Dark: this.UserInputValues.BonusResistancesTemp.Dark,
          FlatPhysical: this.UserInputValues.BonusResistancesTemp.FlatPhysical,
          FlatMagic: this.UserInputValues.BonusResistancesTemp.FlatMagic,
          FlatFire: this.UserInputValues.BonusResistancesTemp.FlatFire,
          FlatLightning: this.UserInputValues.BonusResistancesTemp.FlatLightning,
          FlatDark: this.UserInputValues.BonusResistancesTemp.FlatDark,
        },

        // Damage Calculator - Bonus Resistances Active toggle
        bonus_resistances_active: this.UserInputValues.BonusResistancesActive,

        // Resistances
        resistances: {
          Physical: this.CharacterStats.Resistances.Physical,
          Magic: this.CharacterStats.Resistances.Magic,
          Fire: this.CharacterStats.Resistances.Fire,
          Lightning: this.CharacterStats.Resistances.Lightning,
          Dark: this.CharacterStats.Resistances.Dark,
          PhysicalFlat: this.CharacterStats.Resistances.FlatPhysical,
          MagicFlat: this.CharacterStats.Resistances.FlatMagic,
          FireFlat: this.CharacterStats.Resistances.FlatFire,
          LightningFlat: this.CharacterStats.Resistances.FlatLightning,
          DarkFlat: this.CharacterStats.Resistances.FlatDark,
        },

        // Combat settings
        combat_settings: {
          twoHandingMainHand: this.CombatSettings.twoHandingMainHand,
          twoHandingOffHand: this.CombatSettings.twoHandingOffHand,
          activeCompanionId: this.CombatSettings.activeCompanionId,
          mainHandModifications: this.CombatSettings.mainHandModifications,
          offHandModifications: this.CombatSettings.offHandModifications,
        },

        // Field notes
        field_notes: this.FieldNotes,

        // Equipment (all slots)
        equipment: this.Equipment,

        // Inventory
        inventory: this.Inventory,

        // Spell system
        attuned_spells: this.AttunedSpells,
        learned_spells: this.LearnedSpells,
        spell_modifications: this.SpellModifications,

        // Spirit system
        attuned_spirits: this.AttunedSpirits,
        learned_spirits: this.LearnedSpirits,
        spirit_modifications: this.SpiritModifications,

        // Weapon skills
        attuned_weapon_skills: this.AttunedWeaponSkills,
        learned_weapon_skills: this.LearnedWeaponSkills,
        weapon_skill_modifications: this.WeaponSkillModifications,

        // Weapon modifications
        weapon_modifications: this.WeaponModifications,

        // Destined traits
        obtained_destined_traits: this.ObtainedDestinedTraits,
        destined_trait_modifications: this.DestinedTraitModifications,

        // Weapon proficiencies
        weapon_proficiency_points: this.WeaponProficiencyPoints,
        obtained_weapon_prof_feats: this.ObtainedWeaponProfFeats,
        weapon_proficiencies: { ...this.WeaponProficiencies },
        dual_wielding_feat_flags: this.DualWieldingFeatFlags,
        musical_instruments_feat_flags: this.MusicalInstrumentsFeatFlags,
        protege_flags: this.ProtegeFlags,
        temporary_fate_points: this.TemporaryFatePoints,
        fate_points: this.FatePoints,
        destiny_feat_slots: this.DestinyFeatSlots,

        // Notes and Compendium
        notes: this.Notes,
        compendium: this.Compendium,

        // Companions
        companions: this.Companions,

        // Character image
        character_image_path: this.CharacterImagePath,

        // Level up state
        pending_level_up: this.PendingLevelUp,
        has_multi_proficient: this.HasMultiProficient,
        multi_proficient_retroactive_points: this.MultiProficientRetroactivePoints,
      }

      const success = updateCharacter(this.UUID, characterData)
      if (success) {
        console.log('Character saved to localStorage (comprehensive)')
      } else {
        console.error('Failed to save character')
      }
      return success
    },

    // Reset store to default values (clears old character data)
    resetToDefaults() {
      // Reset all fields to initial state
      this.UUID = ''
      this.UserUUID = ''
      this.Name = 'Yah'
      this.Gender = 'Male'
      this.PhysicalDescription = ''
      this.Lineage = 'Human'
      this.Background = 'Knight'
      this.LineageId = null
      this.BackgroundId = null
      this.BloodlineId = null
      this.Undying = 0
      this.Souls = 0
      this.Level = 0
      this.StartingHP = 0
      this.LevelHP = 0
      this.HealthDie = { count: 1, sides: 6 }
      this.PendingLevelUp = null
      this.HasMultiProficient = false
      this.MultiProficientRetroactivePoints = 0

      // Reset inventory and equipment
      this.Inventory = []
      this.Equipment = {
        MainHand: null,
        OffHand: null,
        Armor: null,
        Artifact: null,
        Artifact2: null,
        Ring1: null,
        Ring2: null,
        Ring3: null,
        Ring4: null,
        Ring5: null
      }

      // Reset spells and skills
      this.AttunedSpells = []
      this.LearnedSpells = []
      this.SpellModifications = {}
      this.AttunedSpirits = []
      this.LearnedSpirits = []
      this.SpiritModifications = {}
      this.AttunedWeaponSkills = []
      this.LearnedWeaponSkills = []
      this.WeaponSkillModifications = {}

      // Reset feats
      this.ObtainedDestinedTraits = []
      this.DestinedTraitModifications = {}
      this.ObtainedWeaponProfFeats = []
      this.DualWieldingFeatFlags = {
        skilled_wielder_used: false,
        skilled_wielder_plus_used: false,
        master_wielder_used: false,
        master_wielder_plus_used: false,
        master_wielder_plus_chose_fate: false
      }
      this.MusicalInstrumentsFeatFlags = {
        skilled_artist_used: false,
        master_artist_used: false
      }
      this.ProtegeFlags = {
        protege_1_lv3_obtained: false,
        protege_1_lv5_used: false,
        protege_1_lv5_postponed: false,
        protege_1_postponed_trees: [],
        protege_2_used: false,
        protege_2_postponed: false,
        protege_2_postponed_trees: [],
        protege_3_used: false,
        protege_3_postponed: false,
        protege_3_postponed_trees: []
      }
      this.TemporaryFatePoints = 0
      this.FatePoints = 2

      // Reset proficiencies
      this.WeaponProficiencyPoints = {
        total: 0,
        baseFromLevel: 0,
        customBonus: 0
      }
      this.WeaponProficiencies = {
        FIST: 0,
        DAGGER: 0,
        STRAIGHT_THRUST: 0,
        KATANA_CURVED: 0,
        ULTRA_GREAT_SWORD: 0,
        GREAT_AXE: 0,
        GREAT_HAMMER: 0,
        TWINBLADE: 0,
        SPEAR: 0,
        HALBERD: 0,
        REAPER: 0,
        WHIP: 0,
        CROSS_BOW: 0,
        GREAT_BOW_BALLISTA: 0,
        GUN: 0,
        SHIELD: 0,
        SORCERY: 0,
        MIRACLE: 0,
        PYROMANCY: 0,
        HEX: 0,
        SPIRIT_SUMMONING: 0,
        DUAL_WIELDING: 0
      }

      // Reset stats
      this.CharacterStats = {
        Stats: {
          Vitality: 10,
          Endurance: 10,
          Strength: 10,
          Dexterity: 10,
          Attunement: 10,
          Intelligence: 10,
          Faith: 10
        },
        Skills: {
          Athletics: 0,
          Acrobatics: 0,
          Perception: 0,
          FireKeeping: 0,
          Sanity: 0,
          Stealth: 0,
          Precision: 0,
          Diplomacy: 0
        },
        Knowledge: {
          Magics: 0,
          WorldHistory: 0,
          Monsters: 0,
          Cosmic: 0
        },
        Resistances: {
          Curse: 0,
          Frost: 0,
          Bleed: 0,
          Poison: 0,
          Toxic: 0,
          Poise: 0,
          Physical: 0,
          Magic: 0,
          Fire: 0,
          Lightning: 0,
          Dark: 0,
          FlatPhysical: 0,
          FlatMagic: 0,
          FlatFire: 0,
          FlatLightning: 0,
          FlatDark: 0
        }
      }

      // Reset user input values
      this.UserInputValues = {
        Exhaustion: 0,
        FirekeepingChecks: 0,
        TotalDodges: 0,
        CurrentDodges: 0,
        CurrentHP: 0,
        CurrentFP: 0,
        CurrentAP: 0,
        TempHP: 0,
        MaxHPBonus: 0,
        MaxFPBonus: 0,
        MaxAPBonus: 0,
        HpFlask: 0,
        FpFlask: 0,
        FlaskLevel: 0,
        AttunementSlots: 0,
        DestinyFeatUsages: {},
        WeaponFeatUsages: {},
        CurrentStatuses: {
          Curse: 0,
          Frost: 0,
          Bleed: 0,
          Poison: 0,
          Toxic: 0,
          Poise: 0
        },
        BonusStatuses: {
          Curse: 0,
          Frost: 0,
          Bleed: 0,
          Poison: 0,
          Toxic: 0,
          Poise: 0
        },
        BonusResistances: {
          Physical: 0,
          Magic: 0,
          Fire: 0,
          Lightning: 0,
          Dark: 0,
          FlatPhysical: 0,
          FlatMagic: 0,
          FlatFire: 0,
          FlatLightning: 0,
          FlatDark: 0
        },
        BonusResistancesActive: false,
        BonusResistancesTemp: {
          Physical: 0,
          Magic: 0,
          Fire: 0,
          Lightning: 0,
          Dark: 0,
          FlatPhysical: 0,
          FlatMagic: 0,
          FlatFire: 0,
          FlatLightning: 0,
          FlatDark: 0
        },
        Conditions: {
          ImpairedVision: false,
          Deaf: false,
          ArmFracture: false,
          LegFracture: false,
          Grappled: false,
          Restrained: false,
          Prone: false,
          Dazed: false,
          LockedUp: false,
          Staggered: false,
          Frenzied: false,
          Berzerk: false
        }
      }

      // Reset notes, compendium, companions
      this.Notes = { sections: [] }
      this.Compendium = { entries: [] }
      this.FieldNotes = {}
      this.Companions = []

      // Reset character image
      this.CharacterImagePath = ''

      // Reset combat settings
      this.CombatSettings = {
        twoHandingMainHand: false,
        twoHandingOffHand: false,
        companionActive: false,
        activeCompanionId: null,
        mainHandModifications: { isModified: false },
        offHandModifications: { isModified: false }
      }
    },

    // Load active character from multi-character storage
    loadActiveCharacter() {
      // Run migration first to add weapon_proficiencies field to old characters
      migrateCharacterData()

      const activeChar = getActiveCharacter()
      if (!activeChar) {
        console.log('No active character found')
        return false
      }

      // DO NOT reset to defaults - this was resetting FatePoints on every page load!
      // resetToDefaults() should only be called by the Reset Character modal

      // Basic info
      this.UUID = activeChar.uuid
      this.Name = activeChar.name
      this.Gender = activeChar.gender
      this.PhysicalDescription = activeChar.physical_description || ''
      this.Level = activeChar.level
      this.Souls = activeChar.souls
      this.Undying = activeChar.undying

      // Fate Points
      this.FatePoints = (activeChar as any).fate_points !== undefined ? (activeChar as any).fate_points : 2
      this.DestinyFeatSlots = (activeChar as any).destiny_feat_slots !== undefined ? (activeChar as any).destiny_feat_slots : 1

      // Creation data
      this.LineageId = activeChar.lineage_id
      this.BackgroundId = activeChar.background_id
      this.BloodlineId = activeChar.bloodline_id

      // Stats
      this.CharacterStats.Stats.Vitality = activeChar.stats.vitality
      this.CharacterStats.Stats.Endurance = activeChar.stats.endurance
      this.CharacterStats.Stats.Strength = activeChar.stats.strength
      this.CharacterStats.Stats.Dexterity = activeChar.stats.dexterity
      this.CharacterStats.Stats.Attunement = activeChar.stats.attunement
      this.CharacterStats.Stats.Intelligence = activeChar.stats.intelligence
      this.CharacterStats.Stats.Faith = activeChar.stats.faith

      // Skills
      if (activeChar.skills) {
        this.CharacterStats.Skills.Athletics = activeChar.skills.Athletics
        this.CharacterStats.Skills.Acrobatics = activeChar.skills.Acrobatics
        this.CharacterStats.Skills.Perception = activeChar.skills.Perception
        this.CharacterStats.Skills.FireKeeping = activeChar.skills.FireKeeping
        this.CharacterStats.Skills.Sanity = activeChar.skills.Sanity
        this.CharacterStats.Skills.Stealth = activeChar.skills.Stealth
        this.CharacterStats.Skills.Precision = activeChar.skills.Precision
        this.CharacterStats.Skills.Diplomacy = activeChar.skills.Diplomacy
      }

      // Knowledge
      if (activeChar.knowledge) {
        this.CharacterStats.Knowledge.Magics = activeChar.knowledge.Magics
        this.CharacterStats.Knowledge.WorldHistory = activeChar.knowledge.WorldHistory
        this.CharacterStats.Knowledge.Monsters = activeChar.knowledge.Monsters
        this.CharacterStats.Knowledge.Cosmic = activeChar.knowledge.Cosmic
      }

      // HP tracking
      this.StartingHP = activeChar.starting_hp || 0
      this.LevelHP = activeChar.level_hp || 0

      // Health Die
      if (activeChar.health_die) {
        this.HealthDie.count = activeChar.health_die.count || 1
        this.HealthDie.sides = activeChar.health_die.sides || 6
      }

      this.UserInputValues.CurrentHP = activeChar.current_hp
      this.UserInputValues.CurrentFP = activeChar.current_fp
      this.UserInputValues.CurrentAP = activeChar.current_ap || 0
      this.UserInputValues.TempHP = activeChar.temp_hp || 0
      this.UserInputValues.MaxHPBonus = activeChar.max_hp_bonus || 0
      this.UserInputValues.MaxFPBonus = activeChar.max_fp_bonus || 0
      this.UserInputValues.MaxAPBonus = activeChar.max_ap_bonus || 0

      // Flasks
      this.UserInputValues.HpFlask = activeChar.hp_flask || 0
      this.UserInputValues.FpFlask = activeChar.fp_flask || 0
      this.UserInputValues.FlaskLevel = activeChar.flask_level || 0

      // Dodge tracking
      this.UserInputValues.TotalDodges = activeChar.total_dodges || 0
      this.UserInputValues.CurrentDodges = activeChar.current_dodges || 0

      // General tracking
      this.UserInputValues.Exhaustion = activeChar.exhaustion || 0
      this.UserInputValues.FirekeepingChecks = activeChar.firekeeping_checks || 0
      this.UserInputValues.AttunementSlots = activeChar.attunement_slots || 0

      // Calculated attribute overrides
      this.DodgeCostOverride = (activeChar as any).dodge_cost_override ?? null
      this.DodgeDistanceOverride = (activeChar as any).dodge_distance_override ?? null
      this.ItemUsageCostOverride = (activeChar as any).item_usage_cost_override ?? null
      this.JumpHorizontalOverride = (activeChar as any).jump_horizontal_override ?? null
      this.JumpVerticalOverride = (activeChar as any).jump_vertical_override ?? null
      this.RunningJumpHorizontalOverride = (activeChar as any).running_jump_horizontal_override ?? null
      this.RunningJumpVerticalOverride = (activeChar as any).running_jump_vertical_override ?? null
      this.MaxEquipLoadOverride = (activeChar as any).max_equip_load_override ?? null

      // Equipment slot toggles
      this.Enable5thRingSlot = (activeChar as any).enable_5th_ring_slot ?? false
      this.Enable2ndArtifactSlot = (activeChar as any).enable_2nd_artifact_slot ?? false

      // Status inflictions
      if (activeChar.current_statuses) {
        this.UserInputValues.CurrentStatuses.Curse = activeChar.current_statuses.Curse || 0
        this.UserInputValues.CurrentStatuses.Frost = activeChar.current_statuses.Frost || 0
        this.UserInputValues.CurrentStatuses.Bleed = activeChar.current_statuses.Bleed || 0
        this.UserInputValues.CurrentStatuses.Poison = activeChar.current_statuses.Poison || 0
        this.UserInputValues.CurrentStatuses.Toxic = activeChar.current_statuses.Toxic || 0
        this.UserInputValues.CurrentStatuses.Poise = activeChar.current_statuses.Poise || 0
      }

      // Status bonuses
      if (activeChar.bonus_statuses) {
        this.UserInputValues.BonusStatuses.Curse = activeChar.bonus_statuses.Curse || 0
        this.UserInputValues.BonusStatuses.Frost = activeChar.bonus_statuses.Frost || 0
        this.UserInputValues.BonusStatuses.Bleed = activeChar.bonus_statuses.Bleed || 0
        this.UserInputValues.BonusStatuses.Poison = activeChar.bonus_statuses.Poison || 0
        this.UserInputValues.BonusStatuses.Toxic = activeChar.bonus_statuses.Toxic || 0
        this.UserInputValues.BonusStatuses.Poise = activeChar.bonus_statuses.Poise || 0
      }

      // Damage Calculator - Bonus Resistances (Primary table)
      if ((activeChar as any).bonus_resistances) {
        this.UserInputValues.BonusResistances.Physical = (activeChar as any).bonus_resistances.Physical || 0
        this.UserInputValues.BonusResistances.Magic = (activeChar as any).bonus_resistances.Magic || 0
        this.UserInputValues.BonusResistances.Fire = (activeChar as any).bonus_resistances.Fire || 0
        this.UserInputValues.BonusResistances.Lightning = (activeChar as any).bonus_resistances.Lightning || 0
        this.UserInputValues.BonusResistances.Dark = (activeChar as any).bonus_resistances.Dark || 0
        this.UserInputValues.BonusResistances.FlatPhysical = (activeChar as any).bonus_resistances.FlatPhysical || 0
        this.UserInputValues.BonusResistances.FlatMagic = (activeChar as any).bonus_resistances.FlatMagic || 0
        this.UserInputValues.BonusResistances.FlatFire = (activeChar as any).bonus_resistances.FlatFire || 0
        this.UserInputValues.BonusResistances.FlatLightning = (activeChar as any).bonus_resistances.FlatLightning || 0
        this.UserInputValues.BonusResistances.FlatDark = (activeChar as any).bonus_resistances.FlatDark || 0
      }

      // Damage Calculator - Temporary Bonus Resistances (Bonus table)
      if ((activeChar as any).bonus_resistances_temp) {
        this.UserInputValues.BonusResistancesTemp.Physical = (activeChar as any).bonus_resistances_temp.Physical || 0
        this.UserInputValues.BonusResistancesTemp.Magic = (activeChar as any).bonus_resistances_temp.Magic || 0
        this.UserInputValues.BonusResistancesTemp.Fire = (activeChar as any).bonus_resistances_temp.Fire || 0
        this.UserInputValues.BonusResistancesTemp.Lightning = (activeChar as any).bonus_resistances_temp.Lightning || 0
        this.UserInputValues.BonusResistancesTemp.Dark = (activeChar as any).bonus_resistances_temp.Dark || 0
        this.UserInputValues.BonusResistancesTemp.FlatPhysical = (activeChar as any).bonus_resistances_temp.FlatPhysical || 0
        this.UserInputValues.BonusResistancesTemp.FlatMagic = (activeChar as any).bonus_resistances_temp.FlatMagic || 0
        this.UserInputValues.BonusResistancesTemp.FlatFire = (activeChar as any).bonus_resistances_temp.FlatFire || 0
        this.UserInputValues.BonusResistancesTemp.FlatLightning = (activeChar as any).bonus_resistances_temp.FlatLightning || 0
        this.UserInputValues.BonusResistancesTemp.FlatDark = (activeChar as any).bonus_resistances_temp.FlatDark || 0
      }

      // Damage Calculator - Bonus Resistances Active toggle
      if ((activeChar as any).bonus_resistances_active !== undefined) {
        this.UserInputValues.BonusResistancesActive = (activeChar as any).bonus_resistances_active
      }

      // Resistances
      if (activeChar.resistances) {
        this.CharacterStats.Resistances.Physical = activeChar.resistances.Physical || 0
        this.CharacterStats.Resistances.Magic = activeChar.resistances.Magic || 0
        this.CharacterStats.Resistances.Fire = activeChar.resistances.Fire || 0
        this.CharacterStats.Resistances.Lightning = activeChar.resistances.Lightning || 0
        this.CharacterStats.Resistances.Dark = activeChar.resistances.Dark || 0
        this.CharacterStats.Resistances.FlatPhysical = activeChar.resistances.PhysicalFlat || 0
        this.CharacterStats.Resistances.FlatMagic = activeChar.resistances.MagicFlat || 0
        this.CharacterStats.Resistances.FlatFire = activeChar.resistances.FireFlat || 0
        this.CharacterStats.Resistances.FlatLightning = activeChar.resistances.LightningFlat || 0
        this.CharacterStats.Resistances.FlatDark = activeChar.resistances.DarkFlat || 0
      }

      // Combat settings
      if (activeChar.combat_settings) {
        this.CombatSettings.twoHandingMainHand = activeChar.combat_settings.twoHandingMainHand || false
        this.CombatSettings.twoHandingOffHand = activeChar.combat_settings.twoHandingOffHand || false
        this.CombatSettings.activeCompanionId = activeChar.combat_settings.activeCompanionId || null
        this.CombatSettings.mainHandModifications = activeChar.combat_settings.mainHandModifications || { isModified: false }
        this.CombatSettings.offHandModifications = activeChar.combat_settings.offHandModifications || { isModified: false }
      }

      // Field notes
      this.FieldNotes = activeChar.field_notes || {}

      // Equipment (all slots)
      if (activeChar.equipment) {
        this.Equipment = activeChar.equipment
      }

      // Inventory
      if (activeChar.inventory) {
        this.Inventory = activeChar.inventory
      }

      // Spell system
      if (activeChar.attuned_spells) {
        this.AttunedSpells = activeChar.attuned_spells
      }
      if (activeChar.learned_spells) {
        this.LearnedSpells = activeChar.learned_spells
      }
      if (activeChar.spell_modifications) {
        this.SpellModifications = activeChar.spell_modifications
      }

      // Spirit system
      if (activeChar.attuned_spirits) {
        this.AttunedSpirits = activeChar.attuned_spirits
      }
      if (activeChar.learned_spirits) {
        this.LearnedSpirits = activeChar.learned_spirits
      }
      if (activeChar.spirit_modifications) {
        this.SpiritModifications = activeChar.spirit_modifications
      }

      // Weapon skills
      if (activeChar.attuned_weapon_skills) {
        this.AttunedWeaponSkills = activeChar.attuned_weapon_skills
      }
      if (activeChar.learned_weapon_skills) {
        this.LearnedWeaponSkills = activeChar.learned_weapon_skills
      }
      if (activeChar.weapon_skill_modifications) {
        this.WeaponSkillModifications = activeChar.weapon_skill_modifications
      }

      // Weapon modifications
      if (activeChar.weapon_modifications) {
        this.WeaponModifications = activeChar.weapon_modifications
      }

      // Destined traits
      if (activeChar.obtained_destined_traits) {
        this.ObtainedDestinedTraits = activeChar.obtained_destined_traits
      }
      if (activeChar.destined_trait_modifications) {
        this.DestinedTraitModifications = activeChar.destined_trait_modifications
      }

      // Weapon proficiencies
      if (activeChar.weapon_proficiency_points) {
        const loaded = activeChar.weapon_proficiency_points as any
        this.WeaponProficiencyPoints = {
          total: loaded.total || this.Level,
          baseFromLevel: loaded.baseFromLevel || this.Level,
          customBonus: loaded.customBonus || 0
        }
      } else {
        // Initialize if not present
        this.WeaponProficiencyPoints = {
          total: this.Level,
          baseFromLevel: this.Level,
          customBonus: 0
        }
      }
      if (activeChar.obtained_weapon_prof_feats) {
        this.ObtainedWeaponProfFeats = activeChar.obtained_weapon_prof_feats
      }
      if (activeChar.weapon_proficiencies) {
        // Create a new object to avoid reference issues
        this.WeaponProficiencies = { ...activeChar.weapon_proficiencies }
      }

      // Cross-tree feat acquisition flags - ALWAYS reset to prevent cross-character contamination
      this.DualWieldingFeatFlags = (activeChar as any).dual_wielding_feat_flags || {
        skilled_wielder_used: false,
        skilled_wielder_plus_used: false,
        master_wielder_used: false,
        master_wielder_plus_used: false,
        master_wielder_plus_chose_fate: false
      }

      this.MusicalInstrumentsFeatFlags = (activeChar as any).musical_instruments_feat_flags || {
        skilled_artist_used: false,
        master_artist_used: false
      }

      this.ProtegeFlags = (activeChar as any).protege_flags || {
        protege_1_lv3_obtained: false,
        protege_1_lv5_used: false,
        protege_1_lv5_postponed: false,
        protege_1_postponed_trees: [],
        protege_2_used: false,
        protege_2_postponed: false,
        protege_2_postponed_trees: [],
        protege_3_used: false,
        protege_3_postponed: false,
        protege_3_postponed_trees: []
      }

      this.TemporaryFatePoints = (activeChar as any).temporary_fate_points !== undefined
        ? (activeChar as any).temporary_fate_points
        : 0

      // Notes and Compendium
      if (activeChar.notes) {
        this.Notes = activeChar.notes
      }
      if (activeChar.compendium) {
        this.Compendium = activeChar.compendium
      }

      // Companions
      if (activeChar.companions) {
        this.Companions = activeChar.companions
      }

      // Character image
      if ((activeChar as any).character_image_path) {
        this.CharacterImagePath = (activeChar as any).character_image_path
      }

      // Level up state
      if ((activeChar as any).pending_level_up) {
        this.PendingLevelUp = (activeChar as any).pending_level_up
      }

      // Multi Proficient tracking
      if ((activeChar as any).has_multi_proficient !== undefined) {
        this.HasMultiProficient = (activeChar as any).has_multi_proficient
      }
      if ((activeChar as any).multi_proficient_retroactive_points !== undefined) {
        this.MultiProficientRetroactivePoints = (activeChar as any).multi_proficient_retroactive_points
      }

      console.log('Active character loaded (comprehensive):', activeChar.name)
      return true
    },

    // Export current character as downloadable file
    exportCharacter() {
      if (!this.UUID) {
        console.error('Cannot export character without UUID')
        return
      }
      downloadCharacterAsFile(this.UUID)
    },

    // Spell management
    attuneSpell(spellUUID: string) {
      const compendiumStore = useCompendiumStore()
      // const spell = compendiumStore.Spells.find(i => i.UUID === spellUUID)
      // if (!spell) return
      // this.AttunedSpells.push(JSON.parse(JSON.stringify(spell)))
    },

    unattuneSpell(index: number) {
      if (!this.AttunedSpells[index]) return
      this.AttunedSpells.splice(index, 1)
      this.save()
    },

    // Item management
    createItem(item: Item) {
      const compendiumStore = useCompendiumStore()
      compendiumStore.Items.push(item)
    },

    addInventoryItem(itemData: { id: number, category: string }) {
      const compendiumStore = useCompendiumStore()

      // Check if item already exists in inventory using id + category
      const existingItem = this.Inventory.find(i =>
        i.id === itemData.id && i.category === itemData.category
      )
      if (existingItem) {
        // Item exists, increment quantity
        existingItem.Quantity = (existingItem.Quantity || 0) + 1
        this.save()
        return
      }

      // Find item from correct compendium source based on category
      let item: any = null

      switch (itemData.category) {
        case 'misc':
        case 'tools':
          item = compendiumStore.Items.find(i => i.id === itemData.id)
          break
        case 'weapon':
          item = compendiumStore.Weapons.find(w => w.id === itemData.id)
          break
        case 'armor':
          item = compendiumStore.Armors.find(a => a.id === itemData.id)
          break
        case 'ring':
          item = compendiumStore.Rings.find(r => r.id === itemData.id)
          break
        case 'artifact':
          item = compendiumStore.Artifacts.find(a => a.id === itemData.id)
          break
      }

      if (!item) {
        console.error('Item not found:', itemData)
        return
      }

      // Add new item with Quantity = 1 and ensure category is set
      const newItem = JSON.parse(JSON.stringify(item))
      newItem.Quantity = 1
      newItem.category = itemData.category // Explicitly set category
      console.log('Adding to inventory:', { name: newItem.name, category: newItem.category, id: newItem.id })
      this.Inventory.push(newItem)
      this.save()
    },

    removeInventoryItem(itemData: { id: number, category: string }) {
      const itemIndex = this.Inventory.findIndex(i =>
        i.id === itemData.id && i.category === itemData.category
      )
      if (itemIndex === -1) return

      // Check if item is equipped and auto-unequip it
      Object.keys(this.Equipment).forEach(slotName => {
        const slot = slotName as keyof Equipment
        const equippedItem = this.Equipment[slot]
        if (equippedItem && equippedItem.id === itemData.id && equippedItem.category === itemData.category) {
          this.Equipment[slot] = null
          console.log(`Auto-unequipped ${equippedItem.name} from ${slotName}`)
        }
      })

      this.Inventory.splice(itemIndex, 1)
      this.save()
    },

    increaseItemQuantity(itemData: { id: number, category: string }) {
      const item = this.Inventory.find(i =>
        i.id === itemData.id && i.category === itemData.category
      )
      if (!item) return
      item.Quantity++
      this.save()
    },

    decreaseItemQuantity(itemData: { id: number, category: string }) {
      const item = this.Inventory.find(i =>
        i.id === itemData.id && i.category === itemData.category
      )
      if (!item) return
      item.Quantity--

      // Ensure quantity doesn't go negative
      if (item.Quantity < 0) {
        item.Quantity = 0
      }

      // Check equipped count vs available quantity
      const equippedCount = this.getEquippedCount(itemData.id, itemData.category)
      const availableQuantity = item.Quantity

      if (equippedCount > availableQuantity) {
        // Need to unequip items (equipped count exceeds available)
        const toUnequip = equippedCount - availableQuantity

        // Find all slots with this item equipped
        const equippedSlots = Object.keys(this.Equipment).filter(slotName => {
          const slot = slotName as keyof Equipment
          const equippedItem = this.Equipment[slot]
          return equippedItem && equippedItem.id === itemData.id && equippedItem.category === itemData.category
        })

        // Shuffle slots for random unequipping
        const shuffled = equippedSlots.sort(() => Math.random() - 0.5)

        // Unequip from random slots
        for (let i = 0; i < toUnequip; i++) {
          const slotToUnequip = shuffled[i] as keyof Equipment
          const unequippedItem = this.Equipment[slotToUnequip]
          this.Equipment[slotToUnequip] = null
          console.log(`Auto-unequipped ${unequippedItem?.name} from ${slotToUnequip} (quantity insufficient)`)
        }
      }

      this.save()
    },

    setItemQuantity(itemData: { id: number, category: string }, quantity: number) {
      const item = this.Inventory.find(i =>
        i.id === itemData.id && i.category === itemData.category
      )
      if (!item) return
      item.Quantity = Math.max(0, quantity)

      // Check equipped count vs available quantity
      const equippedCount = this.getEquippedCount(itemData.id, itemData.category)
      const availableQuantity = item.Quantity

      if (equippedCount > availableQuantity) {
        // Need to unequip items (equipped count exceeds available)
        const toUnequip = equippedCount - availableQuantity

        // Find all slots with this item equipped
        const equippedSlots = Object.keys(this.Equipment).filter(slotName => {
          const slot = slotName as keyof Equipment
          const equippedItem = this.Equipment[slot]
          return equippedItem && equippedItem.id === itemData.id && equippedItem.category === itemData.category
        })

        // Shuffle slots for random unequipping
        const shuffled = equippedSlots.sort(() => Math.random() - 0.5)

        // Unequip from random slots
        for (let i = 0; i < toUnequip; i++) {
          const slotToUnequip = shuffled[i] as keyof Equipment
          const unequippedItem = this.Equipment[slotToUnequip]
          this.Equipment[slotToUnequip] = null
          console.log(`Auto-unequipped ${unequippedItem?.name} from ${slotToUnequip} (quantity set too low)`)
        }
      }

      this.save()
    },

    // Setup auto-save watchers
    setupAutoSave() {
      // Guard against duplicate initialization
      if (this._autoSaveInitialized) {
        console.log('Auto-save already initialized, skipping duplicate setup')
        return
      }

      // Mark as initialized
      this._autoSaveInitialized = true

      // Hybrid auto-save system:
      // 1. User action debounce: 2s after last interaction
      // 2. Periodic backup: Every 30s regardless of activity

      let saveTimeout: ReturnType<typeof setTimeout> | null = null
      let periodicSaveInterval: ReturnType<typeof setInterval> | null = null

      // Debounced save (triggers 2s after last user action)
      const debouncedSave = () => {
        if (saveTimeout) clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => {
          this.save()
          console.log('Auto-save triggered (user action debounce)')
        }, 2000) // 2s delay after last action
      }

      // Periodic backup save (every 30s)
      periodicSaveInterval = setInterval(() => {
        this.save()
        console.log('Auto-save triggered (periodic backup)')
      }, 30000) // 30s interval

      // Watch character stats
      watch(() => this.CharacterStats.Stats, () => {
        debouncedSave()
      }, { deep: true })

      // Watch user input values (HP, FP, AP, etc.)
      watch(() => this.UserInputValues, () => {
        debouncedSave()
      }, { deep: true })

      // Watch level changes and recalculate proficiency points
      watch(() => this.Level, (newLevel, oldLevel) => {
        if (newLevel !== oldLevel) {
          this.recalculateProficiencyPoints()
        }
        debouncedSave()
      })

      // Watch souls, undying, HP values
      watch(() => [this.Souls, this.Undying, this.StartingHP, this.LevelHP], () => {
        debouncedSave()
      })

      // Watch weapon proficiencies
      watch(() => this.WeaponProficiencies, () => {
        debouncedSave()
      }, { deep: true })

      // Watch inventory
      watch(() => this.Inventory, () => {
        debouncedSave()
      }, { deep: true })

      // Watch attuned spells
      watch(() => this.AttunedSpells, () => {
        debouncedSave()
      }, { deep: true })

      // Watch attuned spirits
      watch(() => this.AttunedSpirits, () => {
        debouncedSave()
      }, { deep: true })

      // Watch feats
      watch(() => [this.DestinyFeats, this.WeaponFeats], () => {
        debouncedSave()
      }, { deep: true })

      // Watch field notes
      watch(() => this.FieldNotes, () => {
        debouncedSave()
      }, { deep: true })

      // Watch equipment
      watch(() => this.Equipment, () => {
        debouncedSave()
      }, { deep: true })

      // Watch notes
      watch(() => this.Notes, () => {
        debouncedSave()
      }, { deep: true })

      // Watch compendium
      watch(() => this.Compendium, () => {
        debouncedSave()
      }, { deep: true })

      // Watch companions
      watch(() => this.Companions, () => {
        debouncedSave()
      }, { deep: true })

      // Watch combat settings
      watch(() => this.CombatSettings, () => {
        debouncedSave()
      }, { deep: true })

      // Watch weapon modifications
      watch(() => this.WeaponModifications, () => {
        debouncedSave()
      }, { deep: true })

      console.log('Auto-save watchers initialized: 2s debounce + 30s periodic backup')
    },

    // Update field note
    updateFieldNote(fieldKey: string, note: string) {
      if (!note || note.trim() === '') {
        delete this.FieldNotes[fieldKey]
      } else {
        this.FieldNotes[fieldKey] = note
      }
    },

    // Equipment management
    getEquippedCount(itemId: number, category: string): number {
      return Object.values(this.Equipment).filter(
        slot => slot && slot.id === itemId && slot.category === category
      ).length
    },

    getAvailableQuantity(itemId: number, category: string): number {
      const inventoryItem = this.Inventory.find(
        i => i.id === itemId && i.category === category
      )
      if (!inventoryItem) return 0

      const equippedCount = this.getEquippedCount(itemId, category)
      return inventoryItem.Quantity - equippedCount
    },

    equipItem(slotName: keyof Equipment, item: { id: number; category: string; name: string }) {
      this.Equipment[slotName] = item
      this.save()
    },

    unequipItem(slotName: keyof Equipment) {
      this.Equipment[slotName] = null
      this.save()
    },

    // Spell/Skill modification management
    setSpellModification(spellId: number, modifications: any) {
      this.SpellModifications[spellId] = modifications
      this.save()
    },

    setWeaponSkillModification(skillId: number, modifications: any) {
      this.WeaponSkillModifications[skillId] = modifications
      this.save()
    },

    clearSpellModification(spellId: number) {
      delete this.SpellModifications[spellId]
      this.save()
    },

    setSpiritModification(spiritId: number, modifications: any) {
      this.SpiritModifications[spiritId] = modifications
      this.save()
    },

    clearSpiritModification(spiritId: number) {
      delete this.SpiritModifications[spiritId]
      this.save()
    },

    clearWeaponSkillModification(skillId: number) {
      delete this.WeaponSkillModifications[skillId]
      this.save()
    },

    // Destined Trait modification management
    setDestinedTraitModification(traitId: number, modifications: any) {
      this.DestinedTraitModifications[traitId] = modifications
      this.save()
    },

    clearDestinedTraitModification(traitId: number) {
      delete this.DestinedTraitModifications[traitId]
      this.save()
    },

    // Companion management
    addCompanion() {
      if (this.Companions.length >= 4) {
        console.warn('Cannot add more than 4 companions')
        return
      }

      const newCompanion: Companion = {
        id: crypto.randomUUID(),
        name: '',
        type: '',
        hp: null,
        fp: null,
        ap: null,
        skills: {
          Athletics: 0,
          Acrobatics: 0,
          Perception: 0,
          FireKeeping: 0,
          Sanity: 0,
          Stealth: 0,
          Precision: 0,
          Diplomacy: 0
        },
        resistances: {
          Physical: 0,
          Magic: 0,
          Fire: 0,
          Lightning: 0,
          Dark: 0
        },
        statuses: {
          Frost: 0,
          Bleed: 0,
          Poison: 0,
          Toxic: 0,
          Curse: 0,
          Poise: 0
        },
        notes: ''
      }

      this.Companions.push(newCompanion)

      // If no active companion, set this as active
      if (!this.CombatSettings.activeCompanionId) {
        this.CombatSettings.activeCompanionId = newCompanion.id
      }

      this.save()
    },

    deleteCompanion(id: string) {
      const index = this.Companions.findIndex(c => c.id === id)
      if (index === -1) return

      this.Companions.splice(index, 1)

      // If deleted companion was active, set next available companion as active
      if (this.CombatSettings.activeCompanionId === id) {
        this.CombatSettings.activeCompanionId = this.Companions[0]?.id || null
      }

      this.save()
    },

    setActiveCompanion(id: string) {
      const companion = this.Companions.find(c => c.id === id)
      if (!companion) return

      this.CombatSettings.activeCompanionId = id
      this.save()
    },

    // Notes management actions (no separate functions needed - direct manipulation)
    // Notes are saved automatically via auto-save watchers

    // Compendium management actions (no separate functions needed - direct manipulation)
    // Compendium is saved automatically via auto-save watchers

    // Recalculate proficiency points when level changes
    recalculateProficiencyPoints() {
      if (!this.WeaponProficiencyPoints) {
        this.WeaponProficiencyPoints = {
          total: this.Level,
          baseFromLevel: this.Level,
          customBonus: 0
        }
      } else {
        // Update base from level and total
        this.WeaponProficiencyPoints.baseFromLevel = this.Level
        this.WeaponProficiencyPoints.total = this.Level + this.WeaponProficiencyPoints.customBonus
      }
      this.save()
    },

    // Simplified proficiency points management
    // Get total points spent across all trees
    getTotalSpentPoints(): number {
      return Object.values(this.WeaponProficiencies || {})
        .reduce((sum: number, points) => sum + (points as number), 0)
    },

    // Get available points to spend
    getAvailablePoints(): number {
      const total = this.WeaponProficiencyPoints?.total || 0
      const spent = this.getTotalSpentPoints()
      return Math.max(0, total - spent)
    },

    // Get tree maximum points
    getTreeMax(treeId: string): number {
      const treeLimits: Record<string, number> = {
        GUN: 10,
        SHIELD: 10,
        DUAL_WIELDING: 20
      }
      return treeLimits[treeId] || 25
    },

    // Add a point to a tree (simplified - no type checking)
    addPointToTree(treeId: string): boolean {
      if (!this.WeaponProficiencies || !this.WeaponProficiencyPoints) {
        console.error('WeaponProficiencies or WeaponProficiencyPoints not initialized')
        return false
      }

      if (this.getAvailablePoints() <= 0) {
        console.warn('No proficiency points available to spend')
        return false
      }

      const treeMax = this.getTreeMax(treeId)
      const current = this.WeaponProficiencies[treeId] || 0
      if (current >= treeMax) {
        console.warn(`Tree ${treeId} is at maximum (${treeMax})`)
        return false
      }

      this.WeaponProficiencies[treeId] = current + 1
      this.save()
      return true
    },

    // Remove a point from a tree (simplified)
    removePointFromTree(treeId: string): boolean {
      if (!this.WeaponProficiencies || !this.WeaponProficiencyPoints) {
        console.error('WeaponProficiencies or WeaponProficiencyPoints not initialized')
        return false
      }

      const current = this.WeaponProficiencies[treeId] || 0
      if (current <= 0) {
        console.warn('Tree has no points to remove')
        return false
      }

      // Check if obtained feats would become invalid
      const obtainedFeats = this.ObtainedWeaponProfFeats?.filter(
        (f: any) => f.weapon_tree === treeId
      ) || []
      const maxRequired = Math.max(...obtainedFeats.map((f: any) => f.level), 0)
      if (current - 1 < maxRequired) {
        console.warn(`Cannot remove point: obtained feat requires level ${maxRequired}`)
        return false
      }

      this.WeaponProficiencies[treeId] = current - 1
      this.save()
      return true
    },

    // Level up state
    canLevelUp(): boolean {
      return this.Souls >= (this.Level + 1) * 10
    },

    // Initialize level up process
    initializeLevelUp(): boolean {
      if (!this.canLevelUp()) {
        console.warn('Cannot level up: not enough souls')
        return false
      }

      const targetLevel = this.Level + 1
      const isEven = targetLevel % 2 === 0

      // HP roll logic: check if we can reuse existing roll
      let hpRoll = 0
      let lastHealthDie = { count: this.HealthDie.count, sides: this.HealthDie.sides }

      if (this.PendingLevelUp && this.PendingLevelUp.lastHealthDie) {
        // Check if health die configuration changed
        const dieChanged =
          this.PendingLevelUp.lastHealthDie.count !== this.HealthDie.count ||
          this.PendingLevelUp.lastHealthDie.sides !== this.HealthDie.sides

        if (dieChanged) {
          // Die changed, re-roll
          console.log('Health die changed, re-rolling HP')
          for (let i = 0; i < this.HealthDie.count; i++) {
            hpRoll += Math.floor(Math.random() * this.HealthDie.sides) + 1
          }
        } else {
          // Die same, reuse roll
          hpRoll = this.PendingLevelUp.hpRoll || 0
          console.log('Reusing previous HP roll:', hpRoll)
        }
      } else {
        // First time, roll new
        for (let i = 0; i < this.HealthDie.count; i++) {
          hpRoll += Math.floor(Math.random() * this.HealthDie.sides) + 1
        }
      }

      // Check tertiary points using new tracking system
      const gainsTertiary = targetLevel % 3 === 0 && targetLevel <= 30 && this.HasMultiProficient

      // Add unspent retroactive tertiary points to this level-up
      let tertiaryPointsToSpend = gainsTertiary ? 1 : 0
      if (this.MultiProficientRetroactivePoints > 0) {
        tertiaryPointsToSpend += this.MultiProficientRetroactivePoints
      }

      this.PendingLevelUp = {
        active: true,
        targetLevel,
        isEvenLevel: isEven,

        hpRoll,
        lastHealthDie, // Store current die config
        selectedStat: null,
        oldStatValue: 0,
        newStatValue: 0,
        selectedKnowledge: null,

        primaryToSpend: 1,
        secondaryToSpend: !isEven && targetLevel < 20 ? 1 : 0,
        tertiaryToSpend: tertiaryPointsToSpend,
        primarySpent: 0,
        secondarySpent: 0,
        tertiarySpent: 0,
        tempTreeAllocations: {},

        completed: false
      }

      this.save()
      return true
    },

    // Calculate retroactive tertiary points from Multi Proficient trait
    calculateMultiProficientRetroactive(): number {
      const currentLevel = this.Level

      // Count all levels divisible by 3, from level 3 to current level (max 30)
      // Levels: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30
      let retroactivePoints = 0
      for (let lvl = 3; lvl <= Math.min(currentLevel, 30); lvl += 3) {
        retroactivePoints++
      }

      return retroactivePoints
    },

    // Grant retroactive tertiary points when Multi Proficient is obtained
    grantMultiProficientRetroactive() {
      const retroactivePoints = this.calculateMultiProficientRetroactive()

      if (retroactivePoints > 0 && this.WeaponProficiencyPoints) {
        // Add retroactive points to custom bonus (not baseFromLevel)
        this.WeaponProficiencyPoints.customBonus += retroactivePoints
        this.WeaponProficiencyPoints.total = this.WeaponProficiencyPoints.baseFromLevel + this.WeaponProficiencyPoints.customBonus
        this.save()

        console.log(`Multi Proficient: Granted ${retroactivePoints} retroactive tertiary points`)
      }
    },

    // Complete level up and apply all changes
    completeLevelUp(): boolean {
      if (!this.PendingLevelUp || !this.PendingLevelUp.completed) {
        console.error('Cannot complete level up: not all steps finished')
        return false
      }

      const pending = this.PendingLevelUp

      // Apply level increase
      this.Level = pending.targetLevel

      // Apply HP gain (even levels only) - just the roll, no VIT mod
      const totalHpGain = pending.hpRoll || 0
      if (pending.isEvenLevel) {
        this.LevelHP += totalHpGain
      }

      // Apply stat increase
      if (pending.selectedStat) {
        (this.CharacterStats.Stats as any)[pending.selectedStat] = pending.newStatValue
      }

      // Apply knowledge skill increase (odd levels only)
      if (pending.selectedKnowledge) {
        (this.CharacterStats.Knowledge as any)[pending.selectedKnowledge]++
      }

      // Apply proficiency point allocations
      Object.entries(pending.tempTreeAllocations).forEach(([treeId, points]) => {
        this.WeaponProficiencies[treeId] = (this.WeaponProficiencies[treeId] || 0) + (points as number)
      })

      // Increase total proficiency points (added to baseFromLevel since they come from leveling)
      const totalNewPoints = pending.primaryToSpend + pending.secondaryToSpend + pending.tertiaryToSpend
      if (!this.WeaponProficiencyPoints) {
        this.WeaponProficiencyPoints = {
          total: totalNewPoints,
          baseFromLevel: totalNewPoints,
          customBonus: 0
        }
      } else {
        this.WeaponProficiencyPoints.baseFromLevel += totalNewPoints
        this.WeaponProficiencyPoints.total = this.WeaponProficiencyPoints.baseFromLevel + this.WeaponProficiencyPoints.customBonus
      }

      // Reset retroactive tertiary points after they've been spent
      if (this.MultiProficientRetroactivePoints > 0) {
        console.log(`Resetting ${this.MultiProficientRetroactivePoints} retroactive tertiary points (now spent)`)
        this.MultiProficientRetroactivePoints = 0
      }

      // Deduct souls
      this.Souls -= pending.targetLevel * 10

      // Clear pending level up
      this.PendingLevelUp = null

      this.save()
      return true
    },

    // Reset HP & Stats & Knowledge selections
    resetLevelUpStep1() {
      if (!this.PendingLevelUp) return

      this.PendingLevelUp.selectedStat = null
      this.PendingLevelUp.oldStatValue = 0
      this.PendingLevelUp.newStatValue = 0
      this.PendingLevelUp.selectedKnowledge = null

      this.save()
    },

    // Reset Proficiency selections
    resetLevelUpStep2() {
      if (!this.PendingLevelUp) return

      this.PendingLevelUp.primarySpent = 0
      this.PendingLevelUp.secondarySpent = 0
      this.PendingLevelUp.tertiarySpent = 0
      this.PendingLevelUp.tempTreeAllocations = {}

      this.save()
    },

    // Cancel entire level up
    cancelLevelUp() {
      this.PendingLevelUp = null
      this.save()
    },

    // Check if HP & Stats & Knowledge selections are complete
    isLevelUpStep1Complete(): boolean {
      if (!this.PendingLevelUp) return false

      const hasStatSelection = this.PendingLevelUp.selectedStat !== null
      const hasKnowledgeSelection = this.PendingLevelUp.isEvenLevel ||
                                     this.PendingLevelUp.selectedKnowledge !== null

      return hasStatSelection && hasKnowledgeSelection
    },

    // Check if Proficiency selections are complete
    isLevelUpStep2Complete(): boolean {
      if (!this.PendingLevelUp) return false

      return this.PendingLevelUp.primarySpent === this.PendingLevelUp.primaryToSpend &&
             this.PendingLevelUp.secondarySpent === this.PendingLevelUp.secondaryToSpend &&
             this.PendingLevelUp.tertiarySpent === this.PendingLevelUp.tertiaryToSpend
    },

    // Mark level up as ready to complete
    markLevelUpComplete() {
      if (!this.PendingLevelUp) return

      if (this.isLevelUpStep1Complete() && this.isLevelUpStep2Complete()) {
        this.PendingLevelUp.completed = true
        this.save()
      }
    },

    // ========================================
    // Cross-Tree Feat Acquisition System
    // ========================================

    // Obtain a weapon proficiency feat (with cross-tree acquisition tracking)
    obtainWeaponProfFeat(featId: number, source: ObtainedWeaponProfFeat['source'], sourceFeatId?: number): boolean {
      const compendiumStore = useCompendiumStore()
      const feat = compendiumStore.WeaponFeats.find(f => f.id === featId)

      if (!feat) {
        console.error('Feat not found:', featId)
        return false
      }

      // Check if already obtained
      const alreadyObtained = this.ObtainedWeaponProfFeats.some(
        (obtained: ObtainedWeaponProfFeat) => obtained.feat_id === featId
      )
      if (alreadyObtained) {
        console.warn('Feat already obtained:', feat.name)
        return false
      }

      // Create obtained feat entry
      const obtainedFeat: ObtainedWeaponProfFeat = {
        id: Date.now(), // Generate unique ID
        feat_id: featId,
        weapon_tree: feat.weapon_tree,
        level: feat.level,
        name: feat.name,
        description: feat.description,
        source,
        source_feat_id: sourceFeatId,
        is_greyed_out: source !== 'natural',
        acquisition_note: source !== 'natural' ? this.getAcquisitionNote(source) : undefined
      }

      this.ObtainedWeaponProfFeats.push(obtainedFeat)
      this.save()

      console.log(`Obtained feat: ${feat.name} (source: ${source})`)
      return true
    },

    // Un-obtain a weapon proficiency feat (with cascading removal)
    unobtainWeaponProfFeat(featId: number): boolean {
      const index = this.ObtainedWeaponProfFeats.findIndex(
        (f: ObtainedWeaponProfFeat) => f.feat_id === featId
      )

      if (index === -1) {
        console.warn('Feat not obtained:', featId)
        return false
      }

      const feat = this.ObtainedWeaponProfFeats[index]

      console.log(`Unobtaining feat: ${feat.name} (id: ${feat.id}, feat_id: ${feat.feat_id})`)

      // If this feat granted cross-tree feats, remove them first (cascading removal)
      const dependentFeats = this.ObtainedWeaponProfFeats.filter(
        (f: ObtainedWeaponProfFeat) => {
          const matches = f.source_feat_id === feat.id
          if (matches) {
            console.log(`  Found dependent feat: ${f.name} (source_feat_id: ${f.source_feat_id})`)
          }
          return matches
        }
      )

      if (dependentFeats.length > 0) {
        console.log(`Cascading removal: ${dependentFeats.length} dependent feat(s)`)
        dependentFeats.forEach((depFeat: ObtainedWeaponProfFeat) => {
          this.unobtainWeaponProfFeat(depFeat.feat_id)
        })
      } else {
        console.log(`No dependent feats found for ${feat.name}`)
        // Debug: show all obtained feats and their source_feat_ids
        console.log('All obtained feats:', this.ObtainedWeaponProfFeats.map(f => ({
          name: f.name,
          id: f.id,
          source_feat_id: f.source_feat_id,
          source: f.source
        })))
      }

      // Reset flags if this was a Dual Wielding or Protege feat
      this.resetCrossTreeFlags(feat.feat_id)

      // Remove the feat
      this.ObtainedWeaponProfFeats.splice(index, 1)
      this.save()

      console.log(`Un-obtained feat: ${feat.name}`)
      return true
    },

    // Check if specific Dual Wielding triggers need to fire
    checkDualWieldingTriggers(obtainedFeatId: number): string[] {
      const triggers: string[] = []
      const compendiumStore = useCompendiumStore()
      const feat = compendiumStore.WeaponFeats.find(f => f.id === obtainedFeatId)

      if (!feat || feat.weapon_tree !== 'DUAL_WIELDING') return triggers

      // Check Skilled Wielder (lv10) - specific feat name check
      if (feat.level === 10 && feat.name === 'Skilled Wielder' && !this.DualWieldingFeatFlags.skilled_wielder_used) {
        triggers.push('dual_wielding_skilled')
      }

      // Check Skilled Wielder+ (lv13) - specific feat name check and prerequisite
      if (feat.level === 13 && feat.name.includes('Skilled Wielder+') && !this.DualWieldingFeatFlags.skilled_wielder_plus_used) {
        const hasSkilledWielder = compendiumStore.WeaponFeats.some(f =>
          f.weapon_tree === 'DUAL_WIELDING' && f.level === 10 && f.name === 'Skilled Wielder' &&
          this.ObtainedWeaponProfFeats.some((obtained: ObtainedWeaponProfFeat) => obtained.feat_id === f.id)
        )
        if (hasSkilledWielder) {
          triggers.push('dual_wielding_skilled_plus')
        }
      }

      // Check Master Wielder (lv15) - specific feat name check
      if (feat.level === 15 && feat.name === 'Master Wielder' && !this.DualWieldingFeatFlags.master_wielder_used) {
        triggers.push('dual_wielding_master')
      }

      // Check Master Wielder+ (lv17) - specific feat name check and prerequisite
      if (feat.level === 17 && feat.name.includes('Master Wielder+') && !this.DualWieldingFeatFlags.master_wielder_plus_used) {
        const hasMasterWielder = compendiumStore.WeaponFeats.some(f =>
          f.weapon_tree === 'DUAL_WIELDING' && f.level === 15 && f.name === 'Master Wielder' &&
          this.ObtainedWeaponProfFeats.some((obtained: ObtainedWeaponProfFeat) => obtained.feat_id === f.id)
        )
        if (hasMasterWielder) {
          triggers.push('dual_wielding_master_plus')
        }
      }

      return triggers
    },

    // Helper: Check all immediate triggers (DW + Musical) for a feat
    // Returns object with trigger arrays that need to be processed
    checkImmediateTriggers(obtainedFeatId: number): { dwTriggers: string[], musicalTriggers: string[] } {
      const dwTriggers = this.checkDualWieldingTriggers(obtainedFeatId)
      const musicalTriggers = this.checkMusicalInstrumentTriggers(obtainedFeatId)

      console.log(`[CHECK IMMEDIATE] Feat ID ${obtainedFeatId} - DW: ${dwTriggers}, Musical: ${musicalTriggers}`)

      return { dwTriggers, musicalTriggers }
    },

    // Check if specific Musical Instruments triggers need to fire
    checkMusicalInstrumentTriggers(obtainedFeatId: number): string[] {
      const triggers: string[] = []
      const compendiumStore = useCompendiumStore()
      const feat = compendiumStore.WeaponFeats.find(f => f.id === obtainedFeatId)

      if (!feat || feat.weapon_tree !== 'MUSICAL_INSTRUMENTS') return triggers

      // Check Skilled Artist (lv10)
      if (feat.level === 10 && feat.name === 'Skilled Artist' && !this.MusicalInstrumentsFeatFlags.skilled_artist_used) {
        triggers.push('musical_skilled_artist')
      }

      // Check Master Artist (lv15)
      if (feat.level === 15 && feat.name === 'Master Artist' && !this.MusicalInstrumentsFeatFlags.master_artist_used) {
        triggers.push('musical_master_artist')
      }

      return triggers
    },

    // Check if Protege triggers need to fire
    checkProtegeTrigg(obtainedFeatId: number): string[] {
      const triggers: string[] = []

      // Check if user has Protege traits
      const hasProtege1 = this.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 1')
      const hasProtege2 = this.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 2')
      const hasProtege3 = this.ObtainedDestinedTraits.some((t: any) => t.name === 'Protege 3')

      if (!hasProtege1 && !hasProtege2 && !hasProtege3) return triggers

      const compendiumStore = useCompendiumStore()
      const feat = compendiumStore.WeaponFeats.find(f => f.id === obtainedFeatId)

      if (!feat) return triggers

      // Protege 1: lv3 (immediate, all trees) + lv5 when obtaining lv10 (tree-specific)
      if (hasProtege1 && feat.level === 10) {
        // lv3 is handled in DestinedTraitsTab when obtaining Protege 1
        if (!this.ProtegeFlags.protege_1_lv5_used && !this.ProtegeFlags.protege_1_lv5_postponed) {
          triggers.push('protege_1_lv5')
        }
      }

      // Protege 2: lv10 or lv5 when obtaining lv15
      if (hasProtege2 && feat.level === 15 && !this.ProtegeFlags.protege_2_used && !this.ProtegeFlags.protege_2_postponed) {
        triggers.push('protege_2')
      }

      // Protege 3: lv15 or lv10 when obtaining lv20
      if (hasProtege3 && feat.level === 20 && !this.ProtegeFlags.protege_3_used && !this.ProtegeFlags.protege_3_postponed) {
        triggers.push('protege_3')
      }

      return triggers
    },

    // Get available trees for Protege based on reached milestones
    getProtegeAvailableTrees(milestoneLevel: number): string[] {
      const treesWithMilestone: string[] = []

      // Check each feat to see if we have any at the milestone level
      this.ObtainedWeaponProfFeats.forEach((obtainedFeat: ObtainedWeaponProfFeat) => {
        if (obtainedFeat.level === milestoneLevel && !treesWithMilestone.includes(obtainedFeat.weapon_tree)) {
          treesWithMilestone.push(obtainedFeat.weapon_tree)
        }
      })

      return treesWithMilestone
    },

    // Handle Dual Wielding cross-tree feat selection
    // Returns triggers AND obtained feat IDs that need to be tracked by the UI component
    handleDualWieldingSelection(modalType: string, selection: { featId?: number, featIds?: number[], choseFatePoint?: boolean, treeId?: string }): { dwTriggers: string[], musicalTriggers: string[], obtainedFeatIds: number[] } | null {
      if (selection.choseFatePoint) {
        // Master Wielder+: chose temporary fate point
        this.TemporaryFatePoints += 1
        this.DualWieldingFeatFlags.master_wielder_plus_used = true
        this.DualWieldingFeatFlags.master_wielder_plus_chose_fate = true
        this.save()
        console.log('Granted +1 temporary fate point from Master Wielder+')
        return null // No feats obtained, so no triggers
      }

      // Determine source based on modal type
      let source: ObtainedWeaponProfFeat['source']
      let flagToSet: keyof DualWieldingFeatFlags

      switch (modalType) {
        case 'dual_wielding_skilled':
          source = 'dual_wielding_skilled'
          flagToSet = 'skilled_wielder_used'
          break
        case 'dual_wielding_skilled_plus':
          source = 'dual_wielding_skilled_plus'
          flagToSet = 'skilled_wielder_plus_used'
          break
        case 'dual_wielding_master':
          source = 'dual_wielding_master'
          flagToSet = 'master_wielder_used'
          break
        case 'dual_wielding_master_plus':
          source = 'dual_wielding_master_plus'
          flagToSet = 'master_wielder_plus_used'
          break
        default:
          console.error('Unknown modal type:', modalType)
          return null
      }

      // Find the OBTAINED granting DW feat (not compendium feat)
      const compendiumStore = useCompendiumStore()
      const levelMap: Record<string, number> = {
        dual_wielding_skilled: 10,
        dual_wielding_skilled_plus: 13,
        dual_wielding_master: 15,
        dual_wielding_master_plus: 17
      }

      // Map of modal types to exact feat names for precise matching
      const featNameMap: Record<string, string> = {
        dual_wielding_skilled: 'Skilled Wielder',
        dual_wielding_skilled_plus: 'Skilled Wielder+/Power Stance+',
        dual_wielding_master: 'Master Wielder',
        dual_wielding_master_plus: 'Twin Mind+/Master Wielder+'
      }

      // Find the OBTAINED feat (with auto-generated ID) for cascading removal
      // Use exact name matching to avoid finding the wrong feat with the same level
      const dwObtainedFeat = this.ObtainedWeaponProfFeats.find(
        (f: ObtainedWeaponProfFeat) =>
          f.weapon_tree === 'DUAL_WIELDING' &&
          f.level === levelMap[modalType] &&
          f.name === featNameMap[modalType]
      )

      let obtainedFeatIds: number[] = []

      // Handle multi-feat selection (both feats from one tree)
      if (selection.featIds && selection.featIds.length === 2) {
        selection.featIds.forEach(featId => {
          this.obtainWeaponProfFeat(featId, source, dwObtainedFeat?.id)
          obtainedFeatIds.push(featId)
        })
        console.log(`Obtained 2 feats from cross-tree acquisition: ${source}`)
      }
      // Handle single feat selection
      else if (selection.featId) {
        this.obtainWeaponProfFeat(selection.featId, source, dwObtainedFeat?.id)
        obtainedFeatIds.push(selection.featId)
        console.log(`Obtained feat from cross-tree acquisition: ${source}`)
      } else {
        console.error('No feat selected')
        return null
      }

      // Mark flag as used
      this.DualWieldingFeatFlags[flagToSet] = true
      this.save()

      // Check for immediate triggers (DW + Musical) on ALL newly obtained feats
      // Combine triggers from all feats
      let allDwTriggers: string[] = []
      let allMusicalTriggers: string[] = []

      obtainedFeatIds.forEach(featId => {
        const triggers = this.checkImmediateTriggers(featId)
        allDwTriggers.push(...triggers.dwTriggers)
        allMusicalTriggers.push(...triggers.musicalTriggers)
      })

      console.log(`[DUAL WIELDING] Obtained ${obtainedFeatIds.length} feat(s), triggers:`, { dwTriggers: allDwTriggers, musicalTriggers: allMusicalTriggers })

      return { dwTriggers: allDwTriggers, musicalTriggers: allMusicalTriggers, obtainedFeatIds }
    },

    // Handle Musical Instruments cross-tree feat selection
    // Returns triggers AND obtained feat IDs that need to be tracked by the UI component
    handleMusicalInstrumentSelection(modalType: string, selection: { featId?: number, featIds?: number[] }): { dwTriggers: string[], musicalTriggers: string[], obtainedFeatIds: number[] } | null {
      // Determine source based on modal type
      let source: ObtainedWeaponProfFeat['source']
      let flagToSet: keyof MusicalInstrumentsFeatFlags

      switch (modalType) {
        case 'musical_skilled_artist':
          source = 'musical_skilled_artist'
          flagToSet = 'skilled_artist_used'
          break
        case 'musical_master_artist':
          source = 'musical_master_artist'
          flagToSet = 'master_artist_used'
          break
        default:
          console.error('Unknown modal type:', modalType)
          return null
      }

      // Find the OBTAINED granting Musical Instruments feat
      const levelMap: Record<string, number> = {
        musical_skilled_artist: 10,
        musical_master_artist: 15
      }

      const featNameMap: Record<string, string> = {
        musical_skilled_artist: 'Skilled Artist',
        musical_master_artist: 'Master Artist'
      }

      // Find the OBTAINED feat for cascading removal
      const musicalObtainedFeat = this.ObtainedWeaponProfFeats.find(
        (f: ObtainedWeaponProfFeat) =>
          f.weapon_tree === 'MUSICAL_INSTRUMENTS' &&
          f.level === levelMap[modalType] &&
          f.name === featNameMap[modalType]
      )

      let obtainedFeatIds: number[] = []

      // Handle multi-feat selection (one magic + one other)
      if (selection.featIds && selection.featIds.length === 2) {
        selection.featIds.forEach(featId => {
          this.obtainWeaponProfFeat(featId, source, musicalObtainedFeat?.id)
          obtainedFeatIds.push(featId)
        })
        console.log(`Obtained 2 feats from Musical Instruments: ${source}`)
      }
      // Handle single feat selection
      else if (selection.featId) {
        this.obtainWeaponProfFeat(selection.featId, source, musicalObtainedFeat?.id)
        obtainedFeatIds.push(selection.featId)
        console.log(`Obtained feat from Musical Instruments: ${source}`)
      } else {
        console.error('No feat selected')
        return null
      }

      // Mark flag as used
      this.MusicalInstrumentsFeatFlags[flagToSet] = true
      this.save()

      // Check for immediate triggers (DW + Musical) on ALL newly obtained feats
      // Combine triggers from all feats
      let allDwTriggers: string[] = []
      let allMusicalTriggers: string[] = []

      obtainedFeatIds.forEach(featId => {
        const triggers = this.checkImmediateTriggers(featId)
        allDwTriggers.push(...triggers.dwTriggers)
        allMusicalTriggers.push(...triggers.musicalTriggers)
      })

      console.log(`[MUSICAL INSTRUMENTS] Obtained ${obtainedFeatIds.length} feat(s), triggers:`, { dwTriggers: allDwTriggers, musicalTriggers: allMusicalTriggers })

      return { dwTriggers: allDwTriggers, musicalTriggers: allMusicalTriggers, obtainedFeatIds }
    },

    // Handle Protege cross-tree feat selection
    // Returns triggers AND obtained feat IDs that need to be tracked by the UI component
    handleProtegeSelection(modalType: string, selection: { featId?: number }, treeId?: string): { dwTriggers: string[], musicalTriggers: string[], obtainedFeatIds: number[] } | null {
      if (!selection.featId) {
        console.error('No feat selected')
        return null
      }

      // Determine source and flag based on modal type
      let source: ObtainedWeaponProfFeat['source']
      let flagUpdates: Partial<ProtegeFlags> = {}

      switch (modalType) {
        case 'protege_1_lv3':
          source = 'protege_1'
          flagUpdates.protege_1_lv3_obtained = true
          break
        case 'protege_1_lv5':
          source = 'protege_1'
          flagUpdates.protege_1_lv5_used = true
          flagUpdates.protege_1_lv5_postponed = false
          flagUpdates.protege_1_postponed_trees = []
          break
        case 'protege_2':
          source = 'protege_2'
          flagUpdates.protege_2_used = true
          flagUpdates.protege_2_postponed = false
          flagUpdates.protege_2_postponed_trees = []
          break
        case 'protege_3':
          source = 'protege_3'
          flagUpdates.protege_3_used = true
          flagUpdates.protege_3_postponed = false
          flagUpdates.protege_3_postponed_trees = []
          break
        default:
          console.error('Unknown modal type:', modalType)
          return null
      }

      // Find the granting Protege feat ID (if applicable)
      const protegeTraitId = this.ObtainedDestinedTraits.find((t: any) =>
        t.name === 'Protege 1' || t.name === 'Protege 2' || t.name === 'Protege 3'
      )?.id

      // Obtain the feat
      this.obtainWeaponProfFeat(selection.featId, source, protegeTraitId)

      // Update flags
      Object.assign(this.ProtegeFlags, flagUpdates)
      this.save()

      // Check for immediate triggers (DW + Musical) on the newly obtained feat
      const triggers = this.checkImmediateTriggers(selection.featId)
      console.log(`[PROTEGE] Obtained feat ${selection.featId}, triggers:`, triggers)

      return { ...triggers, obtainedFeatIds: [selection.featId] }
    },

    // Postpone Protege selection
    postponeProtegeSelection(modalType: string, availableTrees: string[]) {
      switch (modalType) {
        case 'protege_1_lv5':
          this.ProtegeFlags.protege_1_lv5_postponed = true
          this.ProtegeFlags.protege_1_postponed_trees = availableTrees
          break
        case 'protege_2':
          this.ProtegeFlags.protege_2_postponed = true
          this.ProtegeFlags.protege_2_postponed_trees = availableTrees
          break
        case 'protege_3':
          this.ProtegeFlags.protege_3_postponed = true
          this.ProtegeFlags.protege_3_postponed_trees = availableTrees
          break
      }
      this.save()
      console.log(`Postponed ${modalType} selection`)
    },

    // Resume postponed Protege selection
    // Recalculates available trees based on CURRENT milestones (not saved trees)
    resumeProtegeSelection(modalType: 'protege_1_lv5' | 'protege_2' | 'protege_3'): string[] {
      // Determine milestone level based on modal type
      let milestoneLevel: number
      switch (modalType) {
        case 'protege_1_lv5':
          milestoneLevel = 10
          break
        case 'protege_2':
          milestoneLevel = 15
          break
        case 'protege_3':
          milestoneLevel = 20
          break
        default:
          return []
      }

      // Recalculate available trees based on current milestones
      return this.getProtegeAvailableTrees(milestoneLevel)
    },

    // Helper: Get acquisition note for display
    getAcquisitionNote(source: ObtainedWeaponProfFeat['source']): string {
      const noteMap: Record<string, string> = {
        natural: '',
        dual_wielding_skilled: '(acquired through Dual Wielding - Skilled Wielder)',
        dual_wielding_skilled_plus: '(acquired through Dual Wielding - Skilled Wielder+)',
        dual_wielding_master: '(acquired through Dual Wielding - Master Wielder)',
        dual_wielding_master_plus: '(acquired through Dual Wielding - Master Wielder+)',
        musical_skilled_artist: '(acquired through Musical Instruments - Skilled Artist)',
        musical_master_artist: '(acquired through Musical Instruments - Master Artist)',
        protege_1: '(acquired through Protege 1)',
        protege_2: '(acquired through Protege 2)',
        protege_3: '(acquired through Protege 3)'
      }
      return noteMap[source] || ''
    },

    // Helper: Get full acquisition chain for nested cross-tree feats
    getFullAcquisitionChain(obtainedFeat: ObtainedWeaponProfFeat): string {
      const chain: string[] = []
      let currentFeat = obtainedFeat

      // Build chain by following source_feat_id links
      while (currentFeat.source_feat_id) {
        const sourceFeat = this.ObtainedWeaponProfFeats.find(
          f => f.id === currentFeat.source_feat_id
        )
        if (!sourceFeat) break

        const note = this.getAcquisitionNote(sourceFeat.source)
        if (note) {
          chain.unshift(note)
        }
        currentFeat = sourceFeat
      }

      return chain.join(' → ')
    },

    // Helper: Reset cross-tree flags when unobtaining granting feat
    resetCrossTreeFlags(featId: number) {
      const compendiumStore = useCompendiumStore()
      const feat = compendiumStore.WeaponFeats.find(f => f.id === featId)

      if (!feat) return

      // Reset Dual Wielding flags
      if (feat.weapon_tree === 'DUAL_WIELDING') {
        if (feat.level === 10) {
          this.DualWieldingFeatFlags.skilled_wielder_used = false
        } else if (feat.level === 13) {
          this.DualWieldingFeatFlags.skilled_wielder_plus_used = false
        } else if (feat.level === 15) {
          this.DualWieldingFeatFlags.master_wielder_used = false
        } else if (feat.level === 17) {
          this.DualWieldingFeatFlags.master_wielder_plus_used = false
          this.DualWieldingFeatFlags.master_wielder_plus_chose_fate = false
          // Remove temporary fate point if it was chosen
          if (this.TemporaryFatePoints > 0) {
            this.TemporaryFatePoints = Math.max(0, this.TemporaryFatePoints - 1)
          }
        }
      }

      // Reset Musical Instruments flags
      if (feat.weapon_tree === 'MUSICAL_INSTRUMENTS') {
        if (feat.level === 10) {
          this.MusicalInstrumentsFeatFlags.skilled_artist_used = false
        } else if (feat.level === 15) {
          this.MusicalInstrumentsFeatFlags.master_artist_used = false
        }
      }

      // NOTE: Protege flag resets are handled in DestinedTraitsTab.vue when un-obtaining Protege Destined Traits
      // This function only handles Weapon Proficiency Feat flag resets (Dual Wielding, Musical Instruments)
    }
  }
})