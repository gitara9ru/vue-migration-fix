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


// ASTへのパース
const ast = parser.parse(scriptContent, {
  sourceType: 'module',
  plugins: ['classProperties', 'decorators-legacy', 'typescript']
});

// ASTのトラバースと変換
// ASTを走査して変換を行う
traverse(ast, {
  CallExpression(path) {
    if (path.findParent((p) => p.isClassMethod())) {
      if (
        t.isIdentifier(path.node.callee) &&
        !t.isMemberExpression(path.node.callee) &&
        path.node.callee.name !== 'wrapper'
      ) {
        // this.wrapper(externalMethod)(arg1, arg2)の形式に変換
        path.replaceWith(
          t.callExpression(
            t.callExpression(
              t.memberExpression(
                t.thisExpression(),
                t.identifier('wrapper')
              ),
              [t.identifier(path.node.callee.name)]
            ),
            path.node.arguments
          )
        );
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