<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld msg="Hello Vue 3.0 + Vite" />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

let html='<p>'+name+'</p>'
let time='2019'+'/'+'08'+'/'+'20'
console.log(html+time)
export default {
  name: 'App',
  components: {
    HelloWorld
  }
}
</script>
