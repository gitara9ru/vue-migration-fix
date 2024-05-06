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
traverse(ast, {
  ImportDeclaration(path) {
    // vue-property-decoratorからvue-facing-decoratorへのインポートの変更
    if (path.node.source.value === 'vue-property-decorator') {
      path.node.source.value = 'vue-facing-decorator';
      const toNativeImport = t.importSpecifier(t.identifier('toNative'), t.identifier('toNative'));
      path.node.specifiers.push(toNativeImport);
    }
  },
  ExportDefaultDeclaration(path) {
    if (path.node.declaration.type === 'ClassDeclaration') {
      path.replaceWith(path.node.declaration);
    }
  },
  ClassDeclaration(path) {
      // toNative の追加、export default をここで行う
      if (path.node.decorators && path.node.decorators.some(d => t.isIdentifier(d.expression) && d.expression.name === 'Component')) {
        const className = path.node.id?.name;
        path.node.decorators = path.node.decorators.filter(d => t.isIdentifier(d.expression) && d.expression.name !== 'Component');
        path.replaceWith(t.exportNamedDeclaration(path.node, []));
        //@ts-ignore
        const toNativeCall = t.callExpression(t.identifier('toNative'), [t.identifier(className)]);
        const exportDefaultDeclaration = t.exportDefaultDeclaration(toNativeCall);
        path.insertAfter(exportDefaultDeclaration);
      }
      
  },
});

console.log(ast)

// 新しいコードの生成
const output = generate(ast, {}, scriptContent);
console.log(output.code);  // 変換後のコードを表示

// 変換後のコードをファイルに書き出す
fs.writeFileSync('converted-component.vue', output.code);
