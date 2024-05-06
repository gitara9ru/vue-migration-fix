import { Rule } from "eslint";
import { AST } from "vue-eslint-parser";

function create(context: Rule.RuleContext) {
  return context.parserServices.defineTemplateBodyVisitor({
    "VExpressionContainer > VFilterSequenceExpression"(
      node: AST.VFilterSequenceExpression
    ) {
      const tokens = context.parserServices.getTemplateBodyTokenStore();
      context.report({
        //@ts-ignore
        node: node,
        message: "Use method call instead of filter",
        fix(fixer) {
          const sourceCode = context.sourceCode;
          const argExpressionNode = node.expression;
          const methodName = node.filters[0].callee.name;
          //@ts-ignore
          const argExpression = sourceCode.getText(argExpressionNode)

          const fixedExpression = `${methodName}(${argExpression})`;
          //@ts-ignore
          return fixer.replaceText(node, fixedExpression);
        },
      });
    },
  });
}

export const meta = {
  type: "suggestion",
  docs: {
    description: "remove filter expression.",
  },
  fixable: "code",
  schema: [],
} as const;

export { create };
