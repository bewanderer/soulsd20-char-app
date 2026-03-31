<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content create-item-modal">
      <h2 class="modal-title">Create Custom {{ itemTypeLabel }}</h2>

      <!-- Campaign selector (if multiple) -->
      <div v-if="campaigns && campaigns.length > 1" class="form-group">
        <label>Campaign</label>
        <select v-model="selectedCampaignId" class="form-input">
          <option v-for="c in campaigns" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <!-- Item Type selector -->
      <div class="form-group">
        <label>Type</label>
        <select v-model="itemType" class="form-input">
          <option value="spell">Spell</option>
          <option value="spirit">Spirit</option>
          <option value="weapon_skill">Weapon Skill</option>
        </select>
      </div>

      <div class="form-divider"></div>

      <!-- Common fields -->
      <div class="form-group">
        <label>Name *</label>
        <input v-model="form.name" class="form-input" placeholder="Name" />
      </div>
      <div class="form-group">
        <label>Description *</label>
        <textarea v-model="form.description" class="form-input" rows="3" placeholder="Description"></textarea>
      </div>

      <!-- ==================== SPELL FIELDS ==================== -->
      <template v-if="itemType === 'spell'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Spell Properties</h3>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>Category *</label>
            <select v-model="form.category" class="form-input">
              <option v-for="cat in spellCategories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>AP Cost *</label>
            <input v-model.number="form.ap" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>FP Cost *</label>
            <input v-model.number="form.fp" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>Attunement Cost *</label>
            <input v-model.number="form.att_cost" type="number" min="1" class="form-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Cast Time *</label>
            <input v-model="form.cast_time" class="form-input" placeholder="e.g. 1 Action" />
          </div>
          <div class="form-group flex-1">
            <label>Duration</label>
            <input v-model="form.duration" class="form-input" placeholder="e.g. Instantaneous" />
          </div>
        </div>

        <div class="form-row checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_slow" /> Slow Action
          </label>
        </div>

        <!-- Spell Requirements -->
        <h4 class="form-subsection-title">Requirements (default 0)</h4>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>STR</label>
            <input v-model.number="form.requirements.str" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>DEX</label>
            <input v-model.number="form.requirements.dex" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>INT</label>
            <input v-model.number="form.requirements.int" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>FAI</label>
            <input v-model.number="form.requirements.fai" type="number" min="0" class="form-input" />
          </div>
        </div>

        <!-- Spell Dice -->
        <h4 class="form-subsection-title">Spell Dice</h4>
        <div v-for="(d, i) in form.dice" :key="'sdice-'+i" class="repeatable-row">
          <select v-model="d.type" class="form-input-sm">
            <option v-for="et in elementTypes" :key="et" :value="et">{{ et }}</option>
          </select>
          <input v-model.number="d.count" type="number" class="form-input-sm num-sm" placeholder="#" />
          <span class="dice-d">d</span>
          <input v-model.number="d.value" type="number" class="form-input-sm num-sm" placeholder="6" />
          <button @click="form.dice.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.dice.push({ type: 'MAGIC', count: 1, value: 6 })" class="btn-add-row">+ Add Die</button>

        <!-- Spell Bonuses -->
        <h4 class="form-subsection-title">Spell Bonuses</h4>
        <div v-for="(b, i) in form.bonuses" :key="'sbonus-'+i" class="repeatable-row">
          <select v-model="b.type" class="form-input-sm">
            <option v-for="bt in bonusTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="b.value" type="number" class="form-input-sm num-sm" placeholder="Value" />
          <button @click="form.bonuses.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.bonuses.push({ type: 'MAX_HP', value: 0 })" class="btn-add-row">+ Add Bonus</button>

        <!-- Spell Charged -->
        <h4 class="form-subsection-title">Charged Variant</h4>
        <div class="form-row checkbox-row">
          <label class="checkbox-label">
            <input type="checkbox" v-model="hasCharged" /> Has Charged Version
          </label>
        </div>
        <template v-if="hasCharged">
          <div class="form-row">
            <div class="form-group flex-1">
              <label>Charged Cast Time</label>
              <input v-model="form.charged.cast_time" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Charged AP</label>
              <input v-model.number="form.charged.ap" type="number" min="0" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>Charged FP</label>
              <input v-model.number="form.charged.fp" type="number" min="0" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>Charged Description</label>
            <textarea v-model="form.charged.description" class="form-input" rows="2"></textarea>
          </div>
        </template>

        <!-- Protection sections -->
        <h4 class="form-subsection-title">Damage Protections</h4>
        <div v-for="(p, i) in form.damage_protection" :key="'dp-'+i" class="repeatable-row">
          <select v-model="p.type" class="form-input-sm">
            <option v-for="dt in damageTypes" :key="dt" :value="dt">{{ dt }}</option>
          </select>
          <input v-model.number="p.flat" type="number" class="form-input-sm num-sm" placeholder="Flat" />
          <input v-model.number="p.tiers" type="number" class="form-input-sm num-sm" placeholder="Tiers" />
          <input v-model.number="p.duration_turns" type="number" class="form-input-sm num-sm" placeholder="Turns" />
          <button @click="form.damage_protection.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.damage_protection.push({ type: 'PHYSICAL', flat: 0, tiers: 0, dice_count: 0, dice_value: 0, percentage: 0, percentage_timing: 'INITIAL', duration_turns: 0, duration_attacks: 0, apply_to_caster: false, apply_to_target: true, stacking: 'APPEND', scaling_source: {} })" class="btn-add-row">+ Add Damage Protection</button>

        <h4 class="form-subsection-title">Buildup Protections</h4>
        <div v-for="(p, i) in form.buildup_protection" :key="'bp-'+i" class="repeatable-row">
          <select v-model="p.type" class="form-input-sm">
            <option v-for="bt in buildupTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="p.flat" type="number" class="form-input-sm num-sm" placeholder="Flat" />
          <input v-model.number="p.duration_turns" type="number" class="form-input-sm num-sm" placeholder="Turns" />
          <button @click="form.buildup_protection.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.buildup_protection.push({ type: 'BLEED', flat: 0, dice_count: 0, dice_value: 0, percentage: 0, percentage_timing: 'INITIAL', duration_turns: 0, duration_attacks: 0, apply_to_caster: false, apply_to_target: true, stacking: 'APPEND', scaling_source: {} })" class="btn-add-row">+ Add Buildup Protection</button>

        <h4 class="form-subsection-title">Condition Protections</h4>
        <div v-for="(p, i) in form.condition_protection" :key="'cp-'+i" class="repeatable-row">
          <select v-model="p.condition" class="form-input-sm">
            <option v-for="ct in conditionTypes" :key="ct" :value="ct">{{ ct }}</option>
          </select>
          <input v-model.number="p.duration_turns" type="number" class="form-input-sm num-sm" placeholder="Turns" />
          <button @click="form.condition_protection.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.condition_protection.push({ condition: 'GRAPPLED', duration_turns: 0, apply_to_caster: false, apply_to_target: true })" class="btn-add-row">+ Add Condition Protection</button>

        <h4 class="form-subsection-title">Reduce Buildups</h4>
        <div v-for="(r, i) in form.reduce_buildup" :key="'rb-'+i" class="repeatable-row">
          <select v-model="r.buildup_type" class="form-input-sm">
            <option v-for="bt in buildupTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="r.dice_count" type="number" class="form-input-sm num-sm" placeholder="#" />
          <span class="dice-d">d</span>
          <input v-model.number="r.dice_value" type="number" class="form-input-sm num-sm" placeholder="4" />
          <input v-model.number="r.flat_bonus" type="number" class="form-input-sm num-sm" placeholder="Flat" />
          <button @click="form.reduce_buildup.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.reduce_buildup.push({ buildup_type: 'BLEED', dice_count: 0, dice_value: 0, flat_bonus: 0, scaling_source: {} })" class="btn-add-row">+ Add Reduce Buildup</button>

        <h4 class="form-subsection-title">Cure Conditions</h4>
        <div v-for="(c, i) in form.cure_conditions" :key="'cc-'+i" class="repeatable-row">
          <select v-model="c.condition" class="form-input-sm">
            <option v-for="ct in curableConditions" :key="ct" :value="ct">{{ ct }}</option>
          </select>
          <button @click="form.cure_conditions.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.cure_conditions.push({ condition: 'GRAPPLED' })" class="btn-add-row">+ Add Cure Condition</button>

        <h4 class="form-subsection-title">Cure Effects</h4>
        <div v-for="(c, i) in form.cure_effects" :key="'ce-'+i" class="repeatable-row">
          <select v-model="c.effect_type" class="form-input-sm">
            <option v-for="et in statusEffects" :key="et" :value="et">{{ et }}</option>
          </select>
          <button @click="form.cure_effects.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.cure_effects.push({ effect_type: 'BLEED' })" class="btn-add-row">+ Add Cure Effect</button>
      </template>

      <!-- ==================== SPIRIT FIELDS ==================== -->
      <template v-if="itemType === 'spirit'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Spirit Properties</h3>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Tier *</label>
            <select v-model="form.spirit_tier" class="form-input">
              <option value="ONE">Tier I</option>
              <option value="TWO">Tier II</option>
              <option value="THREE">Tier III</option>
              <option value="FOUR">Tier IV</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Creature *</label>
            <input v-model="form.creature" class="form-input" placeholder="e.g. Wolf, Dragon" />
          </div>
          <div class="form-group flex-1">
            <label>Size *</label>
            <select v-model="form.size" class="form-input">
              <option value="TINY">Tiny</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="LARGE">Large</option>
              <option value="MASSIVE">Massive</option>
              <option value="GARGANTUAN">Gargantuan</option>
              <option value="ASTRONOMICAL">Astronomical</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>AP Cost *</label>
            <input v-model.number="form.ap" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>FP Cost *</label>
            <input v-model.number="form.fp" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>Attunement Cost *</label>
            <input v-model.number="form.att_cost" type="number" min="1" class="form-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>Range</label>
            <input v-model="form.range" class="form-input" placeholder="e.g. 30ft" />
          </div>
          <div class="form-group flex-1">
            <label>Condition</label>
            <input v-model="form.condition" class="form-input" placeholder="Summoning condition" />
          </div>
        </div>

        <!-- Spirit Requirements -->
        <h4 class="form-subsection-title">Requirements (default 0)</h4>
        <div class="form-row">
          <div class="form-group flex-1">
            <label>STR</label>
            <input v-model.number="form.requirements.str" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>DEX</label>
            <input v-model.number="form.requirements.dex" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>INT</label>
            <input v-model.number="form.requirements.int" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-1">
            <label>FAI</label>
            <input v-model.number="form.requirements.fai" type="number" min="0" class="form-input" />
          </div>
        </div>

        <!-- Spirit Dice -->
        <h4 class="form-subsection-title">Spirit Dice</h4>
        <div v-for="(d, i) in form.dice" :key="'spdice-'+i" class="repeatable-row">
          <select v-model="d.type" class="form-input-sm">
            <option v-for="et in elementTypes" :key="et" :value="et">{{ et }}</option>
          </select>
          <input v-model.number="d.count" type="number" class="form-input-sm num-sm" placeholder="#" />
          <span class="dice-d">d</span>
          <input v-model.number="d.value" type="number" class="form-input-sm num-sm" placeholder="6" />
          <button @click="form.dice.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.dice.push({ type: 'PHYSICAL', count: 1, value: 6 })" class="btn-add-row">+ Add Die</button>

        <!-- Same protection sections as spell -->
        <h4 class="form-subsection-title">Damage Protections</h4>
        <div v-for="(p, i) in form.damage_protection" :key="'spdp-'+i" class="repeatable-row">
          <select v-model="p.type" class="form-input-sm">
            <option v-for="dt in damageTypes" :key="dt" :value="dt">{{ dt }}</option>
          </select>
          <input v-model.number="p.flat" type="number" class="form-input-sm num-sm" placeholder="Flat" />
          <input v-model.number="p.tiers" type="number" class="form-input-sm num-sm" placeholder="Tiers" />
          <input v-model.number="p.duration_turns" type="number" class="form-input-sm num-sm" placeholder="Turns" />
          <button @click="form.damage_protection.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.damage_protection.push({ type: 'PHYSICAL', flat: 0, tiers: 0, dice_count: 0, dice_value: 0, percentage: 0, percentage_timing: 'INITIAL', duration_turns: 0, duration_attacks: 0, apply_to_caster: false, apply_to_target: true, stacking: 'APPEND', scaling_source: {} })" class="btn-add-row">+ Add Damage Protection</button>

        <h4 class="form-subsection-title">Buildup Protections</h4>
        <div v-for="(p, i) in form.buildup_protection" :key="'spbp-'+i" class="repeatable-row">
          <select v-model="p.type" class="form-input-sm">
            <option v-for="bt in buildupTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="p.flat" type="number" class="form-input-sm num-sm" placeholder="Flat" />
          <input v-model.number="p.duration_turns" type="number" class="form-input-sm num-sm" placeholder="Turns" />
          <button @click="form.buildup_protection.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.buildup_protection.push({ type: 'BLEED', flat: 0, dice_count: 0, dice_value: 0, percentage: 0, percentage_timing: 'INITIAL', duration_turns: 0, duration_attacks: 0, apply_to_caster: false, apply_to_target: true, stacking: 'APPEND', scaling_source: {} })" class="btn-add-row">+ Add Buildup Protection</button>

        <h4 class="form-subsection-title">Condition Protections</h4>
        <div v-for="(p, i) in form.condition_protection" :key="'spcp-'+i" class="repeatable-row">
          <select v-model="p.condition" class="form-input-sm">
            <option v-for="ct in conditionTypes" :key="ct" :value="ct">{{ ct }}</option>
          </select>
          <input v-model.number="p.duration_turns" type="number" class="form-input-sm num-sm" placeholder="Turns" />
          <button @click="form.condition_protection.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.condition_protection.push({ condition: 'GRAPPLED', duration_turns: 0, apply_to_caster: false, apply_to_target: true })" class="btn-add-row">+ Add Condition Protection</button>

        <h4 class="form-subsection-title">Reduce Buildups</h4>
        <div v-for="(r, i) in form.reduce_buildup" :key="'sprb-'+i" class="repeatable-row">
          <select v-model="r.buildup_type" class="form-input-sm">
            <option v-for="bt in buildupTypes" :key="bt" :value="bt">{{ bt }}</option>
          </select>
          <input v-model.number="r.dice_count" type="number" class="form-input-sm num-sm" placeholder="#" />
          <span class="dice-d">d</span>
          <input v-model.number="r.dice_value" type="number" class="form-input-sm num-sm" placeholder="4" />
          <input v-model.number="r.flat_bonus" type="number" class="form-input-sm num-sm" placeholder="Flat" />
          <button @click="form.reduce_buildup.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.reduce_buildup.push({ buildup_type: 'BLEED', dice_count: 0, dice_value: 0, flat_bonus: 0, scaling_source: {} })" class="btn-add-row">+ Add Reduce Buildup</button>

        <h4 class="form-subsection-title">Cure Conditions</h4>
        <div v-for="(c, i) in form.cure_conditions" :key="'spcc-'+i" class="repeatable-row">
          <select v-model="c.condition" class="form-input-sm">
            <option v-for="ct in curableConditions" :key="ct" :value="ct">{{ ct }}</option>
          </select>
          <button @click="form.cure_conditions.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.cure_conditions.push({ condition: 'GRAPPLED' })" class="btn-add-row">+ Add Cure Condition</button>

        <h4 class="form-subsection-title">Cure Effects</h4>
        <div v-for="(c, i) in form.cure_effects" :key="'spce-'+i" class="repeatable-row">
          <select v-model="c.effect_type" class="form-input-sm">
            <option v-for="et in statusEffects" :key="et" :value="et">{{ et }}</option>
          </select>
          <button @click="form.cure_effects.splice(i, 1)" class="btn-remove-row">X</button>
        </div>
        <button @click="form.cure_effects.push({ effect_type: 'BLEED' })" class="btn-add-row">+ Add Cure Effect</button>
      </template>

      <!-- ==================== WEAPON SKILL FIELDS ==================== -->
      <template v-if="itemType === 'weapon_skill'">
        <div class="form-divider"></div>
        <h3 class="form-section-title">Weapon Skill Properties</h3>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>FP Cost *</label>
            <input v-model.number="form.cost_fp" type="number" min="0" class="form-input" />
          </div>
          <div class="form-group flex-2">
            <label>Usage Type *</label>
            <select v-model="form.usage_type" class="form-input">
              <option value="MELEE">Melee Only</option>
              <option value="RANGED">Ranged Only</option>
              <option value="BOTH">Melee and Ranged</option>
              <option value="CAST">Casting Implements Only</option>
              <option value="MCAST">Melee and Casting</option>
              <option value="RCAST">Ranged and Casting</option>
              <option value="BCAST">Both and Casting</option>
              <option value="STANCE">Power Stance</option>
            </select>
          </div>
        </div>
      </template>

      <!-- Error message -->
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- Actions -->
      <div class="modal-actions">
        <button @click="$emit('close')" class="btn-cancel">Cancel</button>
        <button @click="submitItem" :disabled="!isValid || isSubmitting" class="btn-submit">
          {{ isSubmitting ? 'Creating...' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  campaignId: string
  campaigns?: Array<{ id: string; name: string }>
  initialType?: 'spell' | 'spirit' | 'weapon_skill'
}>()

const emit = defineEmits<{
  close: []
  created: [item: any, itemType: string]
}>()

const api = useApi()
const isSubmitting = ref(false)
const errorMsg = ref('')
const hasCharged = ref(false)

const itemType = ref<'spell' | 'spirit' | 'weapon_skill'>(props.initialType || 'spell')
const selectedCampaignId = ref(props.campaignId)

const itemTypeLabel = computed(() => {
  const labels: Record<string, string> = { spell: 'Spell', spirit: 'Spirit', weapon_skill: 'Weapon Skill' }
  return labels[itemType.value] || 'Spell'
})

const isValid = computed(() => {
  if (!form.name.trim() || !form.description.trim()) return false
  if (itemType.value === 'spell') {
    return !!form.cast_time.trim()
  }
  if (itemType.value === 'spirit') {
    return !!form.creature.trim()
  }
  return true // weapon_skill only needs name + description + cost_fp + usage_type (have defaults)
})

// Enum options
const spellCategories = [
  { value: 'SOUL_CRYSTAL', label: 'Soul/Crystal Sorcery' },
  { value: 'FROST', label: 'Frost Sorcery' },
  { value: 'ASSASSIN_LIGHT', label: 'Assassin/Light Sorcery' },
  { value: 'COSMIC', label: 'Cosmic Sorcery' },
  { value: 'DARK', label: 'Dark Hex' },
  { value: 'DEBUFF_HEX', label: 'Debuffing Hex' },
  { value: 'BLOOD', label: 'Blood Hex' },
  { value: 'DEATH', label: 'Death Hex' },
  { value: 'DARKFROST_BLACKFIRE', label: 'Darkfrost/Blackfire Hex' },
  { value: 'HEALING', label: 'Healing Miracle' },
  { value: 'LIGHTNING', label: 'Lightning Miracle' },
  { value: 'BUFF_DEF_MIRACLE', label: 'Buffing/Defensive Miracle' },
  { value: 'FORCE', label: 'Force Miracle' },
  { value: 'FIRE', label: 'Fire Pyromancy' },
  { value: 'DRAGON', label: 'Dragon Pyromancy' },
  { value: 'PESTILENCE', label: 'Pestilence Pyromancy' },
  { value: 'BUFF_DEBUFF_PYRO', label: 'Buffing/Debuffing Pyromancy' },
  { value: 'TIME', label: 'Time Magic' },
]

const elementTypes = ['PHYSICAL', 'MAGIC', 'FIRE', 'LIGHTNING', 'DARK']
const damageTypes = ['PHYSICAL', 'MAGIC', 'FIRE', 'LIGHTNING', 'DARK']
const buildupTypes = ['BLEED', 'POISON', 'TOXIC', 'FROST', 'CURSE', 'POISE']
const conditionTypes = [
  'GRAPPLED', 'RESTRAINED', 'PRONE', 'MOUNTING', 'IMPAIRED_VISION',
  'DEAFENED', 'DAZED', 'LIMB_FRACTURE', 'LOCKED_UP', 'FRENZY',
  'BERSERK', 'EXHAUSTION', 'STAGGERED', 'BLED_OUT', 'POISONED',
  'BADLY_POISONED', 'FROSTBITTEN',
]
const curableConditions = [
  'GRAPPLED', 'RESTRAINED', 'PRONE', 'MOUNTING', 'IMPAIRED_VISION',
  'DEAFENED', 'DAZED', 'LIMB_FRACTURE', 'LOCKED_UP', 'FRENZY',
  'BERSERK', 'EXHAUSTION',
]
const statusEffects = ['BLEED', 'POISON', 'TOXIC', 'FROST', 'CURSE', 'POISE']

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
  // Spell
  category: 'SOUL_CRYSTAL',
  cast_time: '',
  ap: 0,
  fp: 0,
  att_cost: 1,
  duration: '',
  is_slow: false,
  range: '',
  // Spirit
  spirit_tier: 'ONE',
  creature: '',
  size: 'MEDIUM',
  condition: '',
  // Weapon Skill
  cost_fp: 0,
  usage_type: 'MELEE',
  // Shared
  requirements: { str: 0, dex: 0, int: 0, fai: 0 },
  dice: [] as Array<{ type: string; count: number; value: number }>,
  bonuses: [] as Array<{ type: string; value: number }>,
  charged: { cast_time: '', ap: 0, fp: 0, range: '', duration: '', description: '' },
  // Protection fields
  damage_protection: [] as any[],
  buildup_protection: [] as any[],
  condition_protection: [] as any[],
  reduce_buildup: [] as any[],
  cure_conditions: [] as any[],
  cure_effects: [] as any[],
})

async function submitItem() {
  if (!isValid.value) return

  isSubmitting.value = true
  errorMsg.value = ''

  const campaignId = selectedCampaignId.value
  const payload: Record<string, any> = {
    type: itemType.value,
    name: form.name.trim(),
    description: form.description.trim(),
  }

  if (itemType.value === 'spell') {
    payload.category = form.category
    payload.cast_time = form.cast_time
    payload.ap = form.ap
    payload.fp = form.fp
    payload.att_cost = form.att_cost
    payload.duration = form.duration
    payload.is_slow = form.is_slow
    payload.requirements = form.requirements
    payload.dice = form.dice
    payload.bonuses = form.bonuses
    if (hasCharged.value) {
      payload.charged = form.charged
    }
    payload.damage_protection = form.damage_protection
    payload.buildup_protection = form.buildup_protection
    payload.condition_protection = form.condition_protection
    payload.reduce_buildup = form.reduce_buildup
    payload.cure_conditions = form.cure_conditions
    payload.cure_effects = form.cure_effects
  } else if (itemType.value === 'spirit') {
    payload.tier = form.spirit_tier
    payload.creature = form.creature
    payload.size = form.size
    payload.range = form.range
    payload.condition = form.condition
    payload.att_cost = form.att_cost
    payload.ap = form.ap
    payload.fp = form.fp
    payload.requirements = form.requirements
    payload.dice = form.dice
    payload.damage_protection = form.damage_protection
    payload.buildup_protection = form.buildup_protection
    payload.condition_protection = form.condition_protection
    payload.reduce_buildup = form.reduce_buildup
    payload.cure_conditions = form.cure_conditions
    payload.cure_effects = form.cure_effects
  } else if (itemType.value === 'weapon_skill') {
    payload.cost_fp = form.cost_fp
    payload.usage_type = form.usage_type
  }

  const response = await api.post(`/api/campaigns/${campaignId}/items/`, payload)

  isSubmitting.value = false

  if (response.ok) {
    emit('created', response.data, itemType.value)
  } else {
    errorMsg.value = (response.error as any)?.message || 'Failed to create'
  }
}
</script>

<style scoped>
/* Reuse same styles as CreateItemModal */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.create-item-modal {
  background: rgba(25, 25, 30, 0.98);
  border: 0.0625rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0.75rem;
  max-width: clamp(36rem, 50vw, 48rem);
  width: 95%;
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.modal-title {
  color: var(--color-gold-primary, #ffd700);
  font-size: clamp(1.1rem, 1.4vw, 1.3rem);
  margin: 0 0 1rem 0;
}

.form-group { margin-bottom: 0.75rem; }
.form-group label {
  display: block;
  color: #ccc;
  font-size: 0.85em;
  margin-bottom: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.5em 0.75em;
  background: rgba(0, 0, 0, 0.3);
  border: 0.0625rem solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  color: #eee;
  font-size: 0.9em;
}

.form-input:focus { border-color: var(--color-gold-primary, #ffd700); outline: none; }

.form-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-divider {
  border-top: 0.0625rem solid rgba(255, 215, 0, 0.1);
  margin: 1rem 0;
}

.form-section-title {
  color: var(--color-gold-primary, #ffd700);
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
}

.form-subsection-title {
  color: #bbb;
  font-size: 0.9rem;
  margin: 0.75rem 0 0.5rem 0;
}

.repeatable-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.form-input-sm {
  padding: 0.375em 0.5em;
  background: rgba(0, 0, 0, 0.3);
  border: 0.0625rem solid rgba(255, 255, 255, 0.15);
  border-radius: 0.25rem;
  color: #eee;
  font-size: 0.85em;
}

.num-sm { width: 3.5rem; text-align: center; }

.dice-d {
  color: #888;
  font-weight: bold;
}

.btn-remove-row {
  background: rgba(255, 80, 80, 0.15);
  border: 0.0625rem solid rgba(255, 80, 80, 0.3);
  color: #ff6b6b;
  padding: 0.25em 0.5em;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.8em;
}

.btn-add-row {
  background: rgba(100, 200, 100, 0.1);
  border: 0.0625rem solid rgba(100, 200, 100, 0.25);
  color: #8bd88b;
  padding: 0.375em 0.75em;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85em;
  margin-bottom: 0.5rem;
}

.checkbox-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ccc;
  font-size: 0.9em;
  cursor: pointer;
}

.error-msg {
  color: #ff8585;
  font-size: 0.85em;
  margin: 0.5rem 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 0.0625rem solid rgba(255, 215, 0, 0.15);
}

.btn-cancel {
  padding: 0.5em 1.25em;
  background: transparent;
  border: 0.0625rem solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: #ccc;
  cursor: pointer;
}

.btn-submit {
  padding: 0.5em 1.5em;
  background: var(--color-btn-primary-border, rgba(180, 160, 60, 0.3));
  border: 2px solid var(--color-gold-dim, #b4a03c);
  border-radius: 0.375rem;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-submit:hover:not(:disabled) {
  border-color: var(--color-gold-primary, #ffd700);
  box-shadow: var(--shadow-gold-medium, 0 0 10px rgba(255, 215, 0, 0.2));
}
</style>
