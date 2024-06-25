import * as fs from 'fs';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { parse } from '@vue/compiler-sfc';


// ファイルの読み込み
const code = fs.readFileSync('output/unWrapper.vue', 'utf-8');

// Vueファイルの解析
const { descriptor } = parse(code);
const template = descriptor.template
const scriptContent = descriptor.script ? descriptor.script.content : '';
const scriptStart = descriptor.script ? descriptor.script.loc.start.offset : 0;
const scriptEnd = descriptor.script ? descriptor.script.loc.end.offset : 0;


// ASTへのパース
const ast = parser.parse(scriptContent, {
  sourceType: 'module',
  plugins: ['classProperties', 'decorators-legacy', 'typescript']
});

// ASTのトラバースと変換
// ASTを走査して変換を行う

traverse(ast, {
  CallExpression(path) {
    const { node } = path;

    if (
      t.isMemberExpression(node.callee) &&
      t.isThisExpression(node.callee.object) &&
      t.isIdentifier(node.callee.property) &&
      node.callee.property.name === '$wrapper' &&
      node.arguments.length >= 1
    ) {
      const [firstArg, ...restArgs] = node.arguments;

      if (t.isObjectExpression(firstArg) && firstArg.properties.length > 0) {
        const fnProp = firstArg.properties.find(
          (prop): prop is t.ObjectProperty =>
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key) &&
            prop.key.name === 'fn'
        );

        const bindProp = firstArg.properties.find(
          (prop): prop is t.ObjectProperty =>
            t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key) &&
            prop.key.name === 'bind'
        );

        if (fnProp && t.isObjectProperty(fnProp)) {
          if (bindProp && t.isObjectProperty(bindProp)) {
            // メソッド呼び出しの復元
            path.replaceWith(
              t.callExpression(
                t.memberExpression(bindProp.value as t.Expression, fnProp.value as t.Expression),
                restArgs
              )
            );
          } else {
            // 関数呼び出しの復元
            path.replaceWith(
              t.callExpression(fnProp.value as t.Expression, restArgs)
            );
          }
        }
      }
    }
  },
});


console.log(ast)

// 新しいコードの生成
const output = generate(ast, {}, scriptContent);
console.log(output.code);  // 変換後のコードを表示

// 変換後のコードをファイルに書き出す
fs.writeFileSync('converted-component.vue', output.code);
