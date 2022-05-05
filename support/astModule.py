import ast, sys
from pprint import pprint

def main():
    with open(sys.argv[1], "r") as source:
        tree = ast.parse(source.read())

    analyzer = Analyzer()
    analyzer.visit(tree)
    analyzer.report()

class Analyzer(ast.NodeVisitor):
    def __init__(self):
        self.importCount = 0
        self.functionCount = 0
        self.ifCount = 0
        self.forCount = 0
        self.tryCount = 0
        self.listCount = 0

    def visit_If(self, node):
        self.ifCount += 1
        self.generic_visit(node)

    def visit_For(self, node):
        self.forCount += 1
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.importCount += 1
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        for alias in node.names:
            self.importCount += 1
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self.functionCount += 1
        self.generic_visit(node)

    def visit_Try(self, node):
        self.tryCount += 1
        self.generic_visit(node)

    def visit_List(self, node):
        self.listCount += 1
        self.generic_visit(node)

    def visit_Tuple(self, node):
        self.listCount += 1
        self.generic_visit(node)

    def report(self):
        print("Import Count:", self.importCount)
        print("Function Count:", self.functionCount)
        print("If/Elif Blocks:", self.ifCount)
        print("For Loops:", self.forCount)
        print("Try Catch Blocks:", self.tryCount)
        print("List/Tuple Count:", self.listCount)

if __name__ == "__main__":
    main()