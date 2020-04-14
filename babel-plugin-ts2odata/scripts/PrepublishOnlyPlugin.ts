import { NodePath } from '@babel/traverse';
import * as bt from '@babel/types';

export class PluginVisitor {
    Program = function (path: NodePath<bt.Program>, state: any) {
        for (let statement of path.node.body)
            if (bt.isVariableDeclaration(statement))
                for (let declaration of statement.declarations)
                    if (bt.isCallExpression(declaration.init)) {
                        let requireNode: bt.CallExpression = declaration.init;
                        if (bt.isIdentifier(requireNode.callee) && requireNode.callee.name === '__importStar')
                            if (requireNode.arguments.length === 1 && bt.isCallExpression(requireNode.arguments[0]))
                                requireNode = requireNode.arguments[0];

                        if (bt.isIdentifier(requireNode.callee) && requireNode.callee.name === 'require')
                            if (requireNode.arguments.length === 1 && bt.isStringLiteral(requireNode.arguments[0])) {
                                if (requireNode.arguments[0].value.startsWith('../../ts2odata/source/'))
                                    requireNode.arguments[0].value = 'ts2odata';
                                else if ((requireNode.arguments[0].value.startsWith('../../ts2odata-babel/source/')))
                                    requireNode.arguments[0].value = 'ts2odata-babel';
                            }
                    }

        path.skip();
    }
}
