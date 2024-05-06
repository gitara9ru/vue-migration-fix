<template>
    <div>
      <p>{{ message }}</p>
      <button @click="increment">Increment</button>
      <p>Count: {{ count }}</p>
      <v-layout row>this is row</v-layout>
      <v-layout v-if="true" class="pa1">this is not row</v-layout>

    </div>
  </template>
  
  <script lang="ts">
  import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
  
  @Component
  export default class MyComponent extends Vue {
    // 初期値としてプロパティを定義
    @Prop({ default: 'Hello, Vue!' }) readonly message!: string;
  
    // データプロパティ
    count: number = 0;
  
    // メソッド
    increment() {
      this.count++;
    }
  
    // ウォッチャー
    @Watch('count')
    onCountChanged(value: number, oldValue: number) {
      console.log(`The count changed from ${oldValue} to ${value}`);
    }
  }
  </script>
  