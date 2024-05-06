import { RuleTester } from "eslint";
// import { create, meta } from "../src/gridsystem";
import { create, meta } from "../src/filter";
import * as fs from "fs";

// ファイルの読み込み
const code = fs.readFileSync("test/App.vue", "utf-8");

const ruleTester = new RuleTester({
    parser: require.resolve('vue-eslint-parser'),
    parserOptions: {
      ecmaVersion: 2020,
      parser: {
         // Script parser for `<script>`
         "js": "espree",

         // Script parser for `<script lang="ts">`
        "ts": "@typescript-eslint/parser",

         // Script parser for vue directives (e.g. `v-if=` or `:attribute=`)
         // and vue interpolations (e.g. `{{variable}}`).
         // If not specified, the parser determined by `<script lang ="...">` is used.
        "<template>": "espree",
      },
      sourceType: "module",
      vueFeatures: {
        filter: true,
        interpolationAsNonHTML: true,
        styleCSSVariableInjection: true,
        customMacros: [],
      },
    },
   
  });
  
  
  ruleTester.run('gridsystem', {meta, create}, {
    valid: [
      {
        code: code,
        filename: 'test.vue'
      }
    ],
    invalid: [
      {
        code: code,
        filename: 'test2.vue',
        errors: [{ message: 'v-layout should be replaced with v-row and add "flex-nowrap" class if necessary.' }],
        output: `<template><v-row class="flex-nowrap"></v-row></template>`
      }
    ]
  });