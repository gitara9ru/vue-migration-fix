<template>
  <div>
    <p>{{ message }}</p>
    <button @click="increment">Increment</button>
    <v-layout wrap>this is row</v-layout>
    <v-layout v-if="true" class="pa1">this is not row</v-layout>
    <p>
      {{
        (filterConditionLeft || filterConditionRight ? "true" : "false") |
          customFilter
      }}
    </p>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";

@Component({
  filters: {
    customFilter: (val) => {
      return `${val} + 1`;
    },
  },
})
export default class MyComponent extends Vue {
  // 初期値としてプロパティを定義
  @Prop({ default: "Hello, Vue!" }) readonly message!: string;

  // データプロパティ
  count: number = 0;

  // メソッド
  increment() {
    this.count++;
  }

  get filterConditionLeft() {
    return this.count > 0;
  }

  get filterConditionRight() {
    return this.count > 0;
  }

  // ウォッチャー
  @Watch("count")
  onCountChanged(value: number, oldValue: number) {
    console.log(`The count changed from ${oldValue} to ${value}`);
  }
}
</script>
