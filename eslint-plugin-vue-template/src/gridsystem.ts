import { Rule } from "eslint";
import { AST } from "vue-eslint-parser";

function create(context: Rule.RuleContext) {
  return context.parserServices.defineTemplateBodyVisitor({
    VElement(node: AST.VElement) {
      const tokens = context.parserServices.getTemplateBodyTokenStore();
      if (node.name === "v-layout") {
        context.report({
          //@ts-ignore
          node: node,
          message: 'Use "v-row" instead of "v-layout"',
          fix(fixer) {
            const wrapAttr = node.startTag.attributes.find(
              (attr) => attr.key.name === "wrap"
            );

            const classAttr = node.startTag.attributes.find(
              (attr) => attr.key.name === "class"
            );
            const startTagFirstToken = tokens.getFirstToken(node.startTag);
            const endTagFirstToken = tokens.getFirstToken(node.endTag);

            const fixes = [
              fixer.replaceText(startTagFirstToken, "<v-row"),
              fixer.replaceText(endTagFirstToken, "</v-row>"),
            ];

            if (!wrapAttr) {
              if (classAttr) {
                if (classAttr.value && classAttr.value.type === "VLiteral") {
                  fixes.push(
                    fixer.replaceText(
                      tokens.getFirstToken(classAttr.value),
                      `"${classAttr.value.value} flex-nowrap"`
                    )
                  );
                } else {
                  fixes.push(
                    fixer.insertTextAfter(
                      tokens.getFirstToken(classAttr),
                      ' class="flex-nowrap"'
                    )
                  );
                }
              } else {
                fixes.push(
                  fixer.insertTextAfter(
                    tokens.getFirstToken(node.startTag),
                    ' class="flex-nowrap"'
                  )
                );
              }
            }
             // Add the "no-gutters" attribute
             fixes.push(
              fixer.insertTextAfter(
                tokens.getFirstToken(node.startTag),
                ' no-gutters'
              )
            );
            return fixes;
          },
        });
      }
    },
  });
}

export const meta = {
  type: "suggestion",
  docs: {
    description:
      'Add "flex-nowrap" class to <v-layout> tags without "row" attribute.',
  },
  fixable: "code",
  schema: [],
} as const;

export { create };
