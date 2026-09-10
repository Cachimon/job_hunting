<template>
  <div class="form-label">
    <label
      :class="`form-label-content ${props.required ? 'required' : ''}`"
      :for="props.for"
    >
      {{ props.text }}

    </label>
    <div
      v-if="props.tips?.trim()"
      class="form-label-tooltip"
      :data-count="props.tips.length"
      :data-tooltip="props.tips.trim()"
    >
      i
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  text: string
  tips?: string
  for?: string
  required?: boolean
}>()

</script>

<style lang="css">
.form-label {
  display: flex;
  gap: 5px;
}
.form-label-content {
  position: relative;
}
.form-label-content.required::before {
  content: '*';
  color: red;
  position: absolute;
  left: -10px;
  top: 0;
}

.form-label-tooltip {
  position: relative;
  cursor: pointer;
  border: 1px solid #999;
  border-radius: 9px;
  height: 18px;
  flex: 0 0 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  font-size: 13px;
  font-style: italic;
  cursor: pointer;
}
/* 提示框本体 */
.form-label-tooltip::after {
  content: attr(data-tooltip);        /* 读取 data-tooltip 的值 */
  position: absolute;
  bottom: 175%;                       /* 位于元素上方 */
  left: 0;
  transform: translateX(-60px);
  background: #333;
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 13px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  z-index: 1000;
  font-style: normal;
  width: max-content;
  max-width: 500px;
}

/* 小箭头 */
.form-label-tooltip::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #333;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
}

.form-label-tooltip:hover::after,
.form-label-tooltip:hover::before {
  opacity: 1;
  visibility: visible;
}
</style>
