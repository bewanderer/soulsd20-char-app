<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content create-item-modal">
      <h2 class="modal-title">{{ isEditMode ? 'Edit' : 'Create Custom' }} {{ itemTypeLabel }}</h2>

      <!-- Campaign selector (if multiple) -->
      <div v-if="campaigns && campaigns.length > 1" class="form-group">
        <label>Campaign</label>
        <select v-model="selectedCampaignId" class="form-input">
          <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Item Type selector (locked in edit mode) -->
      <div class="form-group">
        <label>Type</label>
        <select v-model="itemType" class="form-input" :disabled="isEditMode">
          <option value="weapon">Weapon</option>
          <option value="armor">Armor</option>
          <option value="ring">Ring</option>
          <option value="artifact">Artifact</option>
          <option value="item">Item</option>
        </select>
      </div>

      <div class="form-divider"></div>

      <!-- Common fields -->
      <div class="form-group">
        <label>Name *</label>
        <input v-model="form.name" class="form-input" placeholder="Item name" />
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea v-model="form.description" class="form-input" rows="3" placeholder="Item description"></textarea>
      </div>

      <!-- ==================== WEAPON FIELDS ==================== -->
      <template v-if="itemType === 'weapon'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Weapon Properties</h3>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>Weapon Type *</label>
            <select v-model="form.weapon_type" class="form-input">
              <option v-for="wt in weaponTypes" :key="wt.value" :value="wt.value">{{ wt.label }}</option>
            </select>
          </div>
          <div class="form-group flex-2">
            <label>Second Type {{ form.is_trick ? '' : '(enable Trick Weapon)' }}</label>
            <select v-model="form.second_type" class="form-input" :disabled="!form.is_trick">
              <option :value="null">None</option>
              <option v-for="wt in weaponTypes" :key="wt.value" :value="wt.value">{{ wt.label }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>AP Cost</label>
            <input v-model.number="form.ap" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>Durability</label>
            <input v-model.number="form.durability" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>Infusion</label>
            <select v-model="form.infusion" class="form-input">
              <option :value="null">None</option>
              <option value="DARK">Dark</option>
              <option value="MAGIC">Magic</option>
              <option value="FIRE">Fire</option>
              <option value="LIGHTNING">Lightning</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Primary Skill (optional)</label>
            <select v-model="form.skill_primary" class="form-input">
              <option :value="null">None</option>
              <option v-for="skill in weaponSkills" :key="skill.id" :value="skill.id">{{ skill.name }}</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Secondary Skill (optional)</label>
            <select v-model="form.skill_secondary" class="form-input">
              <option :value="null">None</option>
              <option v-for="skill in weaponSkills" :key="skill.id" :value="skill.id">{{ skill.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-row checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_trick" @change="onTrickToggle" /> Trick Weapon
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_twin" /> Twin Weapon
          </label>
        </div>

        <!-- Secondary form fields (trick weapons only) -->
        <template v-if="form.is_trick">
          <div class="form-divider"></div>
          <h4 class="form-subsection-title">Secondary Form (Trick)</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Secondary AP</label>
              <input v-model.number="form.second_ap" type="number" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Secondary Infusion</label>
              <select v-model="form.second_infusion" class="form-input">
                <option :value="null">None</option>
                <option value="DARK">Dark</option>
                <option value="MAGIC">Magic</option>
                <option value="FIRE">Fire</option>
                <option value="LIGHTNING">Lightning</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Secondary Form Primary Skill</label>
              <select v-model="form.second_skill_primary" class="form-input">
                <option :value="null">None</option>
                <option v-for="skill in weaponSkills" :key="skill.id" :value="skill.id">{{ skill.name }}</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label>Secondary Form Secondary Skill</label>
              <select v-model="form.second_skill_secondary" class="form-input">
                <option :value="null">None</option>
                <option v-for="skill in weaponSkills" :key="skill.id" :value="skill.id">{{ skill.name }}</option>
              </select>
            </div>
          </div>
        </template>

        <!-- Requirements (Primary Form) -->
        <h4 class="form-subsection-title">{{ form.is_trick ? 'Primary Form Requirements' : 'Requirements' }}</h4>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>STR</label>
            <input v-model.number="form.requirements.str" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>DEX</label>
            <input v-model.number="form.requirements.dex" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>INT</label>
            <input v-model.number="form.requirements.int" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>FAI</label>
            <input v-model.number="form.requirements.fai" type="number" class="form-input" />
          </div>
        </div>

        <!-- Secondary Form Requirements (trick weapons only) -->
        <template v-if="form.is_trick">
          <h4 class="form-subsection-title">Secondary Form Requirements</h4>
          <div class="form-row">
            <div class="form-group flex-1">
              <label>STR</label>
              <input v-model.number="form.secondary_requirements.str" type="number" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>DEX</label>
              <input v-model.number="form.secondary_requirements.dex" type="number" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>INT</label>
              <input v-model.number="form.secondary_requirements.int" type="number" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>FAI</label>
              <input v-model.number="form.secondary_requirements.fai" type="number" class="form-input" />
            </div>
          </div>
        </template>

        <!-- Dice -->
        <h4 class="form-subsection-title">Damage Dice</h4>
        <div v-for="(d, i) in form.dice" :key="'dice-'+i" class="repeatable-row">
          <select v-model="d.type" class="form-input-sm">
            <option v-for="et in elementTypes" :key="et" :value="et">{{ et }}</option>
          </select>
          <input v-model.number="d.count" type="number" class="form-input-sm num-sm" placeholder="#" />
          <span class="dice-d">d</span>
          <input v-model.number="d.value" type="number" class="form-input-sm num-sm" placeholder="6" />
          <select v-model="d.form" class="form-input-sm">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
          <button @click="form.dice.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.dice.push({ type: 'PHYSICAL', count: 1, value: 6, form: 'primary' })" class="btn-add-row">+ Add Die</button>

        <!-- Scaling -->
        <h4 class="form-subsection-title">Scaling</h4>
        <div v-for="(s, i) in form.scaling" :key="'scale-'+i" class="repeatable-row">
          <select v-model="s.type" class="form-input-sm">
            <option v-for="et in elementTypes" :key="et" :value="et">{{ et }}</option>
          </select>
          <select v-model="s.stat" class="form-input-sm">
            <option v-for="st in statChoices" :key="st" :value="st">{{ st }}</option>
          </select>
          <select v-model="s.value" class="form-input-sm">
            <option v-for="g in scalingGrades" :key="g" :value="g">{{ g }}</option>
          </select>
          <select v-model="s.form" class="form-input-sm">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
          <button @click="form.scaling.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.scaling.push({ type: 'PHYSICAL', stat: 'STR', value: 'D', form: 'primary' })" class="btn-add-row">+ Add Scaling</button>

        <!-- Spell Scaling -->
        <h4 class="form-subsection-title">Spell Scaling</h4>
        <div v-for="(ss, i) in form.spell_scaling" :key="'sspell-'+i" class="repeatable-row">
          <select v-model="ss.stat" class="form-input-sm">
            <option v-for="st in spellStatChoices" :key="st" :value="st">{{ st }}</option>
          </select>
          <input v-model.number="ss.requirement" type="number" class="form-input-sm num-sm" placeholder="Req" />
          <select v-model="ss.value" class="form-input-sm">
            <option v-for="g in scalingGrades" :key="g" :value="g">{{ g }}</option>
          </select>
          <select v-model="ss.form" class="form-input-sm">
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
          </select>
          <button @click="form.spell_scaling.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.spell_scaling.push({ stat: 'INT', requirement: 0, value: 'D', form: 'primary' })" class="btn-add-row">+ Add Spell Scaling</button>

        <!-- Bonuses -->
        <h4 class="form-subsection-title">Bonuses</h4>
        <div v-for="(b, i) in form.bonuses" :key="'bonus-'+i" class="repeatable-row">
          <select v-model="b.type" class="form-input-sm">
            <option v-for="bt in bonusTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="b.value" type="number" class="form-input-sm num-sm" placeholder="Value" />
          <button @click="form.bonuses.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.bonuses.push({ type: 'MAX_HP', value: 0 })" class="btn-add-row">+ Add Bonus</button>
      </template>

      <!-- ==================== ARMOR FIELDS ==================== -->
      <template v-if="itemType === 'armor'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Armor Properties</h3>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Armor Type *</label>
            <select v-model="form.armor_type" class="form-input">
              <option value="LIGHT">Light</option>
              <option value="MEDIUM">Medium</option>
              <option value="HEAVY">Heavy</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Durability</label>
            <input v-model.number="form.durability" type="number" class="form-input" />
          </div>
        </div>

        <!-- Requirements -->
        <h4 class="form-subsection-title">Requirements</h4>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>STR</label>
            <input v-model.number="form.requirements.str" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>DEX</label>
            <input v-model.number="form.requirements.dex" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>INT</label>
            <input v-model.number="form.requirements.int" type="number" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>FAI</label>
            <input v-model.number="form.requirements.fai" type="number" class="form-input" />
          </div>
        </div>

        <!-- Bonuses -->
        <h4 class="form-subsection-title">Bonuses</h4>
        <div v-for="(b, i) in form.bonuses" :key="'abonus-'+i" class="repeatable-row">
          <select v-model="b.type" class="form-input-sm">
            <option v-for="bt in bonusTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="b.value" type="number" class="form-input-sm num-sm" placeholder="Value" />
          <label class="checkbox-label-sm">
            <input type="checkbox" v-model="b.is_innate" /> Innate
          </label>
          <button @click="form.bonuses.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.bonuses.push({ type: 'MAX_HP', value: 0, is_innate: false })" class="btn-add-row">+ Add Bonus</button>
      </template>

      <!-- ==================== RING FIELDS ==================== -->
      <template v-if="itemType === 'ring'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Ring Properties</h3>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Tier *</label>
            <input v-model.number="form.tier" type="number" min="1" max="4" class="form-input" />
          </div>
        </div>

        <!-- Bonuses -->
        <h4 class="form-subsection-title">Bonuses</h4>
        <div v-for="(b, i) in form.bonuses" :key="'rbonus-'+i" class="repeatable-row">
          <select v-model="b.type" class="form-input-sm">
            <option v-for="bt in bonusTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="b.value" type="number" class="form-input-sm num-sm" placeholder="Value" />
          <button @click="form.bonuses.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.bonuses.push({ type: 'MAX_HP', value: 0 })" class="btn-add-row">+ Add Bonus</button>
      </template>

      <!-- ==================== ARTIFACT FIELDS ==================== -->
      <template v-if="itemType === 'artifact'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Artifact Properties</h3>

        <!-- Bonuses -->
        <h4 class="form-subsection-title">Bonuses</h4>
        <div v-for="(b, i) in form.bonuses" :key="'artbonus-'+i" class="repeatable-row">
          <select v-model="b.type" class="form-input-sm">
            <option v-for="bt in bonusTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="b.value" type="number" class="form-input-sm num-sm" placeholder="Value" />
          <button @click="form.bonuses.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.bonuses.push({ type: 'MAX_HP', value: 0 })" class="btn-add-row">+ Add Bonus</button>

        <!-- Upgrades -->
        <h4 class="form-subsection-title">Upgrades</h4>
        <div v-for="(u, i) in form.upgrades" :key="'upgrade-'+i" class="upgrade-block">
          <div class="form-group">
            <label>Upgrade Name</label>
            <input v-model="u.name" class="form-input" placeholder="Upgrade name" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="u.description" class="form-input" rows="2" placeholder="What this upgrade does"></textarea>
          </div>
          <div class="form-group">
            <label>Unlock Requirements</label>
            <textarea v-model="u.unlock_requirements" class="form-input" rows="2" placeholder="How to unlock"></textarea>
          </div>
          <div class="form-row checkbox-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="u.visible" /> Visible to Player
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="u.requirements_visible" /> Requirements Visible
            </label>
          </div>
          <button @click="form.upgrades.splice(i, 1)" class="btn-remove-row full-width">Remove Upgrade</button>
        </div>
        <button @click="form.upgrades.push({ name: '', description: '', unlock_requirements: '', visible: false, requirements_visible: false })" class="btn-add-row">+ Add Upgrade</button>
      </template>

      <!-- ==================== ITEM FIELDS ==================== -->
      <template v-if="itemType === 'item'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Item Properties</h3>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Item Type</label>
            <select v-model="form.item_type" class="form-input">
              <option value="MISC">Miscellaneous</option>
              <option value="TOOL">Tool</option>
              <option value="AMMO">Ammunition</option>
              <option value="MATERIAL">Crafting Material</option>
              <option value="BOOK">Book</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Range (optional)</label>
            <input v-model="form.range" class="form-input" placeholder="e.g. 30ft" />
          </div>
          <div class="form-group flex-1">
            <label>Duration (optional)</label>
            <input v-model="form.duration" class="form-input" placeholder="e.g. 1 turn" />
          </div>
        </div>

        <!-- Bonuses -->
        <h4 class="form-subsection-title">Bonuses</h4>
        <div v-for="(b, i) in form.bonuses" :key="'ibonus-'+i" class="repeatable-row">
          <select v-model="b.type" class="form-input-sm">
            <option v-for="bt in bonusTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="b.value" type="number" class="form-input-sm num-sm" placeholder="Value" />
          <button @click="form.bonuses.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.bonuses.push({ type: 'MAX_HP', value: 0 })" class="btn-add-row">+ Add Bonus</button>
      </template>

      <!-- Error message -->
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- Actions -->
      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">Cancel</button>
        <button @click="submitItem" :disabled="!form.name.trim() || isSubmitting" class="btn-submit">
          {{ isSubmitting ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useCompendiumStore } from '~/store/compendium'

const props = defineProps<{
  campaignId: string
  campaigns?: Array<{ id: string; name: string }>
  editItem?: any  // If set, modal is in edit mode
}>()

const emit = defineEmits<{
  close: []
  created: [item: any]
  updated: [item: any]
}>()

const api = useApi()
const compendiumStore = useCompendiumStore()
const isSubmitting = ref(false)
const errorMsg = ref('')

const isEditMode = computed(() => !!props.editItem)
const itemType = ref(props.editItem?.type || 'weapon')
const selectedCampaignId = ref(props.campaignId)

// Weapon skills from compendium for dropdown
const weaponSkills = computed(() => {
  return (compendiumStore as any).WeaponSkills || []
})

const itemTypeLabel = computed(() => {
  const labels: Record<string, string> = { weapon: 'Weapon', armor: 'Armor', ring: 'Ring', artifact: 'Artifact', item: 'Item' }
  return labels[itemType.value] || 'Item'
})

// Enum options
const weaponTypes = [
  { value: 'FIST', label: 'Fist' }, { value: 'DAGGER', label: 'Dagger' },
  { value: 'STRAIGHT', label: 'Straight Sword' }, { value: 'THRUST', label: 'Thrusting Sword' },
  { value: 'KATANA', label: 'Katana' }, { value: 'CURVED', label: 'Curved Sword' },
  { value: 'GREAT_SWORD', label: 'Great Sword' }, { value: 'ULTRA_GREAT_SWORD', label: 'Ultra Great Sword' },
  { value: 'AXE', label: 'Axe' }, { value: 'GREAT_AXE', label: 'Great Axe' },
  { value: 'HAMMER', label: 'Hammer' }, { value: 'GREAT_HAMMER', label: 'Great Hammer' },
  { value: 'TWINBLADE', label: 'Twinblade' }, { value: 'SPEAR', label: 'Spear' },
  { value: 'HALBERD', label: 'Halberd' }, { value: 'REAPER', label: 'Reaper' },
  { value: 'WHIP', label: 'Whip' }, { value: 'CROSSBOW', label: 'Crossbow' },
  { value: 'BOW', label: 'Bow' }, { value: 'GREAT_BOW', label: 'Great Bow' },
  { value: 'BALLISTA', label: 'Ballista' }, { value: 'GUN', label: 'Gun Sidearm' },
  { value: 'SHIELD', label: 'Shield' }, { value: 'GREAT_SHIELD', label: 'Great Shield' },
  { value: 'STAFF', label: 'Staff' }, { value: 'TALISMAN', label: 'Talisman' },
  { value: 'PYRO', label: 'Pyromancy Flame' }, { value: 'CRUCIBLE', label: 'Crucible' },
  { value: 'WIND_INSTRUMENT', label: 'Wind Instrument' }, { value: 'STRING_INSTRUMENT', label: 'String Instrument' },
  { value: 'PERCUSSION_INSTRUMENT', label: 'Percussion Instrument' }, { value: 'TONGUE_INSTRUMENT', label: 'Tongue Instrument' },
  { value: 'HORN_INSTRUMENT', label: 'Horn Instrument' },
]

const elementTypes = ['PHYSICAL', 'MAGIC', 'FIRE', 'LIGHTNING', 'DARK']
const statChoices = ['STR', 'DEX', 'INT', 'FAI']
const spellStatChoices = ['STR', 'DEX', 'INT', 'FAI']
const scalingGrades = ['SS', 'S', 'A', 'B', 'C', 'D', 'E']
const bonusTypes = [
  'MAX_HP', 'MAX_AP', 'MAX_FP',
  'VIT', 'END', 'STR', 'DEX', 'ATT', 'INT', 'FAI',
  'ATH', 'ACR', 'PER', 'FIR', 'SAN', 'STE', 'PRE', 'DIP',
  'RES_PHYS', 'RES_MAG', 'RES_FIRE', 'RES_LTN', 'RES_DARK',
  'POISE', 'EQUIP_LOAD', 'DODGE_DIST', 'DODGE_COST',
  'ATT_SLOTS', 'FATE_POINTS', 'FLASK_HP', 'FLASK_FP',
]

const form = reactive({
  name: '',
  description: '',
  // Weapon
  weapon_type: 'FIST',
  second_type: null as string | null,
  ap: 3,
  durability: 10,
  infusion: null as string | null,
  skill_primary: null as number | null,
  skill_secondary: null as number | null,
  is_trick: false,
  is_twin: false,
  // Trick weapon secondary form
  second_ap: 3,
  second_infusion: null as string | null,
  second_skill_primary: null as number | null,
  second_skill_secondary: null as number | null,
  // Ring
  tier: 1,
  // Armor
  armor_type: 'MEDIUM',
  // Item
  item_type: 'MISC',
  range: '',
  duration: '',
  // Shared
  requirements: { str: 0, dex: 0, int: 0, fai: 0 },
  secondary_requirements: { str: 0, dex: 0, int: 0, fai: 0 },
  dice: [] as Array<{ type: string; count: number; value: number; form: string }>,
  scaling: [] as Array<{ type: string; stat: string; value: string; form: string }>,
  spell_scaling: [] as Array<{ stat: string; requirement: number; value: string; form: string }>,
  bonuses: [] as Array<{ type: string; value: number; is_innate?: boolean }>,
  upgrades: [] as Array<{ name: string; description: string; unlock_requirements: string; visible: boolean; requirements_visible: boolean }>,
})

function onTrickToggle() {
  if (!form.is_trick) {
    // Clear secondary form data when trick is disabled
    form.second_type = null
    form.second_ap = 3
    form.second_infusion = null
    form.second_skill_primary = null
    form.second_skill_secondary = null
    form.secondary_requirements = { str: 0, dex: 0, int: 0, fai: 0 }
  }
}

async function submitItem() {
  if (!form.name.trim()) return

  isSubmitting.value = true
  errorMsg.value = ''

  const campaignId = selectedCampaignId.value
  const payload: Record<string, any> = {
    type: itemType.value,
    name: form.name.trim(),
    description: form.description.trim(),
  }

  // Type-specific fields
  if (itemType.value === 'weapon') {
    payload.weapon_type = form.weapon_type
    payload.second_type = form.second_type
    payload.ap = form.ap
    payload.durability = form.durability
    payload.infusion = form.infusion
    payload.skill_primary = form.skill_primary
    payload.skill_secondary = form.skill_secondary
    payload.is_trick = form.is_trick
    payload.is_twin = form.is_twin
    if (form.is_trick) {
      payload.second_ap = form.second_ap
      payload.second_infusion = form.second_infusion
      payload.second_skill_primary = form.second_skill_primary
      payload.second_skill_secondary = form.second_skill_secondary
      payload.secondary_requirements = form.secondary_requirements
    }
    payload.requirements = form.requirements
    payload.dice = form.dice
    payload.scaling = form.scaling
    payload.spell_scaling = form.spell_scaling
    payload.bonuses = form.bonuses
  } else if (itemType.value === 'armor') {
    payload.armor_type = form.armor_type
    payload.durability = form.durability
    payload.requirements = form.requirements
    payload.bonuses = form.bonuses
  } else if (itemType.value === 'ring') {
    payload.tier = form.tier
    payload.bonuses = form.bonuses
  } else if (itemType.value === 'artifact') {
    payload.bonuses = form.bonuses
    payload.upgrades = form.upgrades
  } else if (itemType.value === 'item') {
    payload.item_type = form.item_type
    payload.range = form.range
    payload.duration = form.duration
    payload.bonuses = form.bonuses
  }

  let response
  if (isEditMode.value && props.editItem) {
    // PATCH existing item
    response = await api.patch(`/api/campaigns/${campaignId}/items/${props.editItem.id}/`, payload)
  } else {
    // POST new item
    response = await api.post(`/api/campaigns/${campaignId}/items/`, payload)
  }

  isSubmitting.value = false

  if (response.ok) {
    if (isEditMode.value) {
      emit('updated', response.data)
    } else {
      emit('created', response.data)
    }
  } else {
    errorMsg.value = (response.error as any)?.message || (isEditMode.value ? 'Failed to save changes' : 'Failed to create item')
  }
}

// Load compendium if not already loaded (needed for skill dropdowns on campaign management page)
// Compendium is loaded by plugins/compendium.client.ts on startup
onMounted(() => {
  if (props.editItem) {
    const item = props.editItem
    form.name = item.name || ''
    form.description = item.description || ''

    if (item.type === 'weapon') {
      form.weapon_type = item.weapon_type || 'FIST'
      form.second_type = item.second_type || null
      form.ap = item.ap ?? 3
      form.durability = item.durability ?? 10
      form.infusion = item.infusion || null
      form.skill_primary = item.skill_primary || null
      form.skill_secondary = item.skill_secondary || null
      form.is_trick = item.is_trick || false
      form.is_twin = item.is_twin || false
      form.second_ap = item.second_ap ?? 3
      form.second_infusion = item.second_infusion || null
      form.second_skill_primary = item.second_skill_primary || null
      form.second_skill_secondary = item.second_skill_secondary || null
      form.dice = item.dice || []
      form.scaling = item.scaling || []
      form.spell_scaling = item.spell_scaling || []
      form.requirements = item.requirements || { str: 0, dex: 0, int: 0, fai: 0 }
      form.secondary_requirements = item.secondary_requirements || { str: 0, dex: 0, int: 0, fai: 0 }
      form.bonuses = item.bonuses || []
    } else if (item.type === 'armor') {
      form.armor_type = item.armor_type || 'MEDIUM'
      form.durability = item.durability ?? 10
      form.requirements = item.requirements || { str: 0, dex: 0, int: 0, fai: 0 }
      form.bonuses = item.bonuses || []
    } else if (item.type === 'artifact') {
      form.bonuses = item.bonuses || []
      form.upgrades = item.upgrades || []
    } else if (item.type === 'item') {
      form.item_type = item.item_type || 'MISC'
      form.range = item.range || ''
      form.duration = item.duration || ''
      form.bonuses = item.bonuses || []
    }
  }
})
</script>

<style scoped>
.create-item-modal {
  max-width: clamp(32rem, 50vw, 42rem);
  max-height: 85vh;
  overflow-y: auto;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  padding: clamp(1.5rem, 2.5vw, 1.875rem);
  width: 95%;
}

.modal-title {
  color: var(--color-gold-primary);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0 0 1em 0;
}

.form-divider {
  height: 0.0625rem;
  background: rgba(255, 215, 0, 0.15);
  margin: 1em 0;
}

.form-section-title {
  color: var(--color-gold-primary);
  font-size: clamp(0.95rem, 1.1vw, 1.05rem);
  margin: 0 0 0.75em 0;
}

.form-subsection-title {
  color: #ccc;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  margin: 1em 0 0.5em 0;
  padding-top: 0.5em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.05);
}

.form-group {
  margin-bottom: 0.75em;
}

.form-group label {
  display: block;
  color: #aaa;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  margin-bottom: 0.25em;
}

.form-input {
  width: 100%;
  padding: 0.5em 0.75em;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #fff;
  font-size: clamp(0.85rem, 1vw, 0.95rem);
  box-sizing: border-box;
}

select.form-input,
select.form-input-sm {
  background-color: #1a1a1e;
}

select.form-input option,
select.form-input-sm option {
  background: #1a1a1e;
  color: #fff;
}

.form-input:disabled,
select.form-input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-gold-primary);
}

.form-row {
  display: flex;
  gap: 0.75em;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.checkbox-row {
  display: flex;
  gap: 1.5em;
  margin-bottom: 0.75em;
}

.checkbox-label, .checkbox-label-sm {
  display: flex;
  align-items: center;
  gap: 0.375em;
  color: #ccc;
  font-size: clamp(0.8rem, 0.95vw, 0.85rem);
  cursor: pointer;
}

/* Repeatable rows */
.repeatable-row {
  display: flex;
  gap: 0.375em;
  align-items: center;
  margin-bottom: 0.375em;
}

.form-input-sm {
  padding: 0.375em 0.5em;
  background: rgba(0, 0, 0, 0.4);
  border: 0.0625rem solid rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  color: #fff;
  font-size: 0.8em;
  flex: 1;
  min-width: 0;
}

.form-input-sm:focus {
  outline: none;
  border-color: var(--color-gold-primary);
}

.num-sm {
  max-width: 3.5em;
  text-align: center;
  flex: 0 0 3.5em;
}

.dice-d {
  color: #888;
  font-size: 0.85em;
}

.btn-add-row {
  padding: 0.25em 0.75em;
  background: transparent;
  border: 0.0625rem dashed rgba(255, 215, 0, 0.3);
  border-radius: 0.25rem;
  color: var(--color-gold-primary);
  font-size: 0.8em;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.25em;
}

.btn-add-row:hover {
  background: rgba(255, 215, 0, 0.05);
  border-color: rgba(255, 215, 0, 0.5);
}

.btn-remove-row {
  padding: 0.25em 0.5em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 107, 107, 0.3);
  border-radius: 0.25rem;
  color: #ff8585;
  font-size: 0.75em;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-remove-row:hover {
  border-color: #ff6b6b;
}

.btn-remove-row.full-width {
  width: 100%;
  margin-top: 0.375em;
}

/* Upgrade blocks */
.upgrade-block {
  background: rgba(255, 255, 255, 0.02);
  border: 0.0625rem solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  padding: 0.75em;
  margin-bottom: 0.75em;
}

.error-msg {
  color: #ff8585;
  font-size: 0.85em;
  margin: 0.75em 0;
}

/* Modal actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75em;
  margin-top: 1.25em;
  padding-top: 0.75em;
  border-top: 0.0625rem solid rgba(255, 255, 255, 0.1);
}

.btn-cancel {
  padding: 0.5em 1.25em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #ccc;
  cursor: pointer;
}

.btn-cancel:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-submit {
  padding: 0.5em 1.25em;
  background: var(--color-btn-primary-border);
  border: 2px solid var(--color-gold-dim);
  border-radius: 0.375rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover:not(:disabled) {
  border-color: var(--color-gold-primary);
  box-shadow: var(--shadow-gold-medium);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar */
.create-item-modal::-webkit-scrollbar {
  width: 6px;
}

.create-item-modal::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.create-item-modal::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.3);
  border-radius: 3px;
}
</style>
