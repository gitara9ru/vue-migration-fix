import * as fs from 'fs';
import * as parser from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
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
      if (!isWrapperCall(path.node)) {
        transformArguments(path);
      }
    }
  },
  NewExpression: {
    exit(path) {
      transformArguments(path);
    }
  }
});

function isWrapperCall(node: t.Node): boolean {
  return (
    t.isCallExpression(node) &&
    t.isMemberExpression(node.callee) &&
    t.isThisExpression(node.callee.object) &&
    t.isIdentifier(node.callee.property) &&
    node.callee.property.name === '$wrapper'
  );
}

function isThisMemberExpression(node: t.Node): boolean {
  if (t.isMemberExpression(node)) {
    if (t.isThisExpression(node.object)) {
      return true;
    }
    return isThisMemberExpression(node.object);
  }
  return false;
}

function transformArguments(path: NodePath<t.CallExpression | t.NewExpression>) {
  const newArgs = path.node.arguments.map((arg:any) => {
    if (isThisMemberExpression(arg)) {
      return t.callExpression(
        t.memberExpression(
          t.thisExpression(),
          t.identifier('$wrapper')
        ),
        [t.cloneNode(arg)]
      );
    }
    return arg;
  });

  if (newArgs.some((arg, index) => arg !== path.node.arguments[index])) {
    path.node.arguments = newArgs;
  }
}


console.log(ast)

// 新しいコードの生成
const output = generate(ast, {}, scriptContent);
console.log(output.code);  // 変換後のコードを表示

// 変換後のコードをファイルに書き出す
fs.writeFileSync('converted-component.vue', output.code);
