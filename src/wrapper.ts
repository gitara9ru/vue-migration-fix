import * as fs from 'fs';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { parse } from '@vue/compiler-sfc';


// ファイルの読み込み
const code = fs.readFileSync('output/Wrapper.vue', 'utf-8');

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



traverse(ast, {
  CallExpression: {
    exit(path) {
      const { node } = path;

      // デコレータの場合は変換しない
      if (t.isDecorator(path.parent)) {
        return;
      }

      // すでにthis.$wrapper関数の呼び出しの場合は変換しない
      if (
        t.isMemberExpression(node.callee) &&
        t.isThisExpression(node.callee.object) &&
        t.isIdentifier(node.callee.property) &&
        node.callee.property.name === '$wrapper'
      ) {
        return;
      }

      // this.method() の呼び出しは変換しない
      if (
        t.isMemberExpression(node.callee) &&
        t.isThisExpression(node.callee.object)
      ) {
        return;
      }

      let newNode;
      if (t.isMemberExpression(node.callee)) {
        const { object, property } = node.callee;
        newNode = t.callExpression(
          t.memberExpression(t.thisExpression(), t.identifier('$wrapper')),
          [
            t.objectExpression([
              //@ts-ignore
              t.objectProperty(t.identifier("fn"), property),
              t.objectProperty(t.identifier("bind"), object),
            ]),
            ...node.arguments,
          ]
        );
      } else if (t.isIdentifier(node.callee)) {
        newNode = t.callExpression(
          t.memberExpression(t.thisExpression(), t.identifier('$wrapper')),
          [
            t.objectExpression([
              t.objectProperty(t.identifier("fn"), node.callee),
            ]),
            ...node.arguments,
          ]
        );
      } else {
        return; // その他の形式の呼び出しは変換しない
      }

      path.replaceWith(newNode);
    }
  },
});




console.log(ast)

// 新しいコードの生成
const output = generate(ast, {}, scriptContent);
console.log(output.code);  // 変換後のコードを表示

// 変換後のコードをファイルに書き出す
fs.writeFileSync('converted-component.vue', output.code);



// traverse(ast, {
//   CallExpression(path) {
//     const { node } = path;

//     // すでにwrapper関数内の呼び出しの場合は変換しない
//     // すでにwrapper関数の呼び出しの場合は変換しない
//     if (t.isIdentifier(node.callee) && node.callee.name === 'wrapper') {
//       return;
//     }

//     if (t.isMemberExpression(node.callee)) {
//       const { object, property } = node.callee;

//       // this.method() の呼び出しは変換しない
//       if (t.isThisExpression(object)) {
//         return;
//       }

//       // その他のメソッド呼び出しを変換（外部クラスのメソッドを含む）
//       path.replaceWith(
//         t.callExpression(
//           t.memberExpression(t.thisExpression(), t.identifier('$wrapper')),
//           [
//             t.objectExpression([
//               //@ts-ignore
//               t.objectProperty(t.identifier("fn"), property),
//               t.objectProperty(t.identifier("bind"), object),
//             ]),
//             ...node.arguments,
//           ]
//         )
//       );
//       // 変換後のノードをスキップ
//       path.skip();
//     } else if (t.isIdentifier(node.callee)) {
//       path.replaceWith(
//         t.callExpression(
//           t.memberExpression(t.thisExpression(), t.identifier('$wrapper')),
//           [
//             t.objectExpression([
//               t.objectProperty(t.identifier("fn"), node.callee),
//             ]),
//             ...node.arguments,
//           ]
//         )
//       );
//       path.skip()
//     }
//   },
// });