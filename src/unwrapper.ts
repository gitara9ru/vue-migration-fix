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
    if (
      t.isCallExpression(path.node.callee) &&
      t.isMemberExpression(path.node.callee.callee) &&
      t.isThisExpression(path.node.callee.callee.object) &&
      t.isIdentifier(path.node.callee.callee.property) &&
      path.node.callee.callee.property.name === 'wrapper' &&
      path.node.callee.arguments.length === 1 &&
      t.isIdentifier(path.node.callee.arguments[0])
    ) {
      // this.wrapper(externalMethod)(arg1, arg2) を externalMethod(arg1, arg2) に変換
      path.replaceWith(
        t.callExpression(
          path.node.callee.arguments[0],
          path.node.arguments
        )
      );
    }
  },
});


console.log(ast)

// 新しいコードの生成
const output = generate(ast, {}, scriptContent);
console.log(output.code);  // 変換後のコードを表示

// 変換後のコードをファイルに書き出す
fs.writeFileSync('converted-component.vue', output.code);