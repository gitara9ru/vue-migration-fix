import * as fs from 'fs';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { parse } from '@vue/compiler-sfc';

// ファイルの読み込み
const code = fs.readFileSync('output/App.vue', 'utf-8');
// Vueファイルの解析
const { descriptor } = parse(code);
const template = descriptor.template
const scriptContent = descriptor.script ? descriptor.script.content : '';
const scriptStart = descriptor.script ? descriptor.script.loc.start.offset : 0;
const scriptEnd = descriptor.script ? descriptor.script.loc.end.offset : 0;


// Vueファイルをパースする
const ast = parser.parse(scriptContent, {
  sourceType: 'module',
  plugins: ['classProperties', 'decorators-legacy', 'typescript']
});

// ASTを走査する
traverse(ast, {
  // @Componentデコレータを見つける
  Decorator(path) {
    if (
      path.node.expression.type === 'CallExpression' &&
      (path.node.expression.callee as t.Identifier).name === 'Component'
    ) {
      const componentOptions = path.node.expression.arguments[0];

      if (componentOptions && componentOptions.type === 'ObjectExpression') {
        const filtersProperty = componentOptions.properties.find(
          (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name == 'filters'
        );

        if (filtersProperty && t.isObjectProperty(filtersProperty) && t.isObjectExpression(filtersProperty.value)) {
          const filterMethods = filtersProperty.value.properties;

          // filtersオプションを削除する
          componentOptions.properties = componentOptions.properties.filter(      
            (prop) => !t.isObjectProperty(prop) || t.isObjectProperty(prop) && t.isIdentifier(prop.key) && prop.key.name !== 'filters'
          );

          // filterメソッドをVueのメソッドに移動する
          filterMethods.forEach((method) => {
            if(!t.isObjectMethod(method) || !t.isIdentifier(method.key)){
              console.error(`invalid ${method}`)
              return
            }
            if(t.isClassDeclaration(path.parentPath.node)){ 
              path.parentPath.node.body.body.push(
                t.classMethod(
                  'method',
                  t.identifier(method.key.name),
                  method.params,
                  method.body,
                  false,
                  false
                )
              );
            }
          });
        }
      }
    }
  },
});

// 変換後のコードを生成する
const output = generate(ast, {}, scriptContent);

// 変換後のコードを出力する
console.log(output.code);