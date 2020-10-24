<template>
  <div>
    <el-button>默认按钮</el-button>
    <router-link to="/helloWorld">HelloWorld</router-link> &nbsp; <router-link to="/upload">upload</router-link> &nbsp;
    <router-link to="/largeUpload">largeUpload</router-link>
    <router-view />
  </div>
</template>

<script lang="ts">
  // import HelloWorld from '/@/HelloWorld.vue'
  export default {}
</script>

<style scoped lang="scss"></style>
