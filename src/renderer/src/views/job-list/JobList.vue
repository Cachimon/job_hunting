<template>
  <div class="job-list">
    <FileList v-if="!detailFilePath" @go-detail="goDetail" />
    <FileDetail v-else :file-path="detailFilePath" @back="goList" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FileList from './FileList.vue'
import FileDetail from './FileDetail.vue'

const detailFilePath = ref<string>()

const goDetail = (path: string): void => {
  detailFilePath.value = path
}

const goList = (): void => {
  detailFilePath.value = ''
}




</script>

<style lang="css" scoped>
.job-list {
  padding: 20px;
  height: 100%;
}
</style>
