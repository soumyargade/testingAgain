
const esprima = require("esprima");
const escodegen = require("escodegen");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');

let operations = [ ConstantReplacement, nonEmptyString, CloneReturn, ConditionalExpression, ControlFlow, ConditionalBoundaries, Incrementals, NegateConditionals ]

function rewrite( filepath, newPath ) {

    var buf = fs.readFileSync(filepath, "utf8");
    var ast = esprima.parse(buf, options);    

    let op = operations[4];
    
    op(ast);

    let code = escodegen.generate(ast);
    fs.writeFileSync( newPath, code);
}

function NegateConditionals(ast) {

    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && (node.operator === ">" || node.operator === "==")) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === ">" ) {
            if( current === mutateTarget ) {
                node.operator = "<"
                console.log( chalk.red(`Replacing > with < on line ${node.loc.start.line}` ));
            }
            current++;
        }
        if ( node.type === "BinaryExpression" && node.operator === "==" ) {
            if( current === mutateTarget ) {
                node.operator = "!="
                console.log( chalk.red(`Replacing == with != on line ${node.loc.start.line}`));
            }
            current++;
        }

    })

}

function Incrementals(ast) {
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if(node.type === "UpdateExpression" && node.operator === "++") {
            if(node.argument.name === 'j' && node.prefix === true) {
                candidates++;
            }
            if(node.argument.name === 'i' && node.prefix === false) {
                candidates++;
            }
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if (node.type === "UpdateExpression" && node.operator === "++") {
            if(node.argument.name === 'j' && node.prefix === true) {
                if(current === mutateTarget) {
                    node.prefix = false;
                    console.log(chalk.red(`Replacing ++j with j++ on line ${node.loc.start.line}`));
                }
                current++;
            }
            if(node.argument.name === 'i' && node.prefix === false) {
                if(current === mutateTarget) {
                    node.operator = "--";
                    console.log(chalk.red(`Replacing i++ with i-- on line ${node.loc.start.line}`));
                }
                current++;
            }
        }
    })
}

function ConditionalBoundaries(ast) {
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && (node.operator === ">" || node.operator === "<")) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "BinaryExpression" && node.operator === ">" ) {
            if( current === mutateTarget ) {
                node.operator = ">="
                console.log( chalk.red(`Replacing > with >= on line ${node.loc.start.line}` ));
            }
            current++;
        }
        if( node.type === "BinaryExpression" && node.operator === "<" ) {
            if( current === mutateTarget ) {
                node.operator = "<="
                console.log( chalk.red(`Replacing < with <= on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}

//TODO
function ControlFlow(ast) {
    // let candidates = 0;

    // console.log(`AST: \n ${ast}`);

    // let arr = ast.tokens;
    // arr.forEach( token => {
    //     if (token.type === "Keyword") {
    //         console.log(token);
    //     }
    // })

    // for (let i = 0; i < arr.length; i++) {
    //     if (arr[i].type === "Keyword" && arr[i].value === "if") {
    //         if (i == 0 || (i > 0 && arr[i - 1].value != "else")) {
    //         console.log(arr[i]);
    //             candidates++;
    //         arr[i].value = "else";
    //         }
    //     }
    // }

    // for (let i = 0; i < ast.tokens.length; i++) {
    //     if (ast.tokens[i].type === "Keyword" && ast.tokens[i].value === "if") {
    //         if (i == 0 || (i > 0 && ast.tokens[i - 1].value != "else")) {
    //         console.log(ast.tokens[i]);
    //             candidates++;
    //             ast.tokens[i].value = "else";
    //         }
    //     }
    // }

    // let mutateTarget = getRandomInt(candidates);
    // console.log(mutateTarget);
    // //let current = 0;
    // for (let i = 0; i < arr.length; i++) {
    //     if (arr[i].type === "Keyword" && arr[i].value === "if") {
    //         if (i == 0 || (i > 0 && arr[i - 1].value != "else")) {
    //             // if (i === mutateTarget) {
    //                 let lineStart = arr[i].loc.start;
    //                 let lineEnd = arr[i].loc.end;
    //                 let rangeStart = arr[i].range[0];
    //                 let rangeEnd = arr[i].range[1];
    //                 arr[i].range[0] += 5;
    //                 arr[i].range[1] += 5;
    //                 let newToken = {
    //                     type: 'Keyword',
    //                     value: 'else',
    //                     range: [rangeStart, rangeEnd],
    //                     loc: { start: lineStart, end: lineEnd}
    //                 }
    //                 arr.splice(i, 0, newToken);
    //             // }
    //         }
    //     }
    // }

    // for (let i = 0; i < arr.length; i++) {
    //     if (arr[i].type === "Keyword") {
    //         // if (i == 0 || (i > 0 && arr[i - 1].value != "else")) {
    //         console.log(arr[i]);
    //             candidates++;
    //         // }
    //     }
    // }

    //ast.tokens = arr;

    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if (node.type == "IfStatement") {
            // console.log(node.loc.start.line)
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;

    traverseWithParents(ast, (node) => {
        if (node.type == "IfStatement") {
            if (current === mutateTarget) {
                if (node.alternate == null) {
                    node.alternate = node;
                }
                current++;
            }
        console.log(node)
        }
    })
}

function ConditionalExpression(ast) {
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if (node.type == "LogicalExpression" && (node.operator === "&&" || node.operate === "||")) {
                candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "LogicalExpression" && node.operator === "&&" ) {
            if( current === mutateTarget ) {
                node.operator = "||"
                console.log( chalk.red(`Replacing && with || on line ${node.loc.start.line}` ));
            }
            current++;
        }
        if ( node.type === "LogicalExpression" && node.operator === "||" ) {
            if( current === mutateTarget ) {
                node.operator = "&&"
                console.log( chalk.red(`Replacing || with && on line ${node.loc.start.line}`));
            }
            current++;
        }

    })
}

// Randomly insert a copy of the "return embeddedHtml" statement into the function
function CloneReturn(ast) {
    traverseWithParents(ast, (node) => {
        if (node.type === "ReturnStatement" && node.argument.name === "embeddedHtml") {
            let arr = node.parent.parent.body;
            let random = getRandomInt(arr.length);
            let line = arr[random].loc.start.line; // Get line of object that exists where new return statement will be inserted
            arr.splice(random, 0, node); // Insert shallow copy of return statement object into a random spot in the function
            console.log( chalk.red(`Inserting "return embeddedHtml" on line ${line}`));
        }
    })
}

function nonEmptyString(ast) {
    let statement = "<div>Bug</div>";
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if(node.type === "Literal" && node.value === "") {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === "" ) {
            if( current === mutateTarget ) {
                node.value = statement;
                console.log( chalk.red(`Replacing "" with "${statement}" on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })

}

function ConstantReplacement(ast) {
    let constant = 3;
    let candidates = 0;
    traverseWithParents(ast, (node) => {
        if(node.type === "Literal" && node.value === 0) {
            candidates++;
        }
    })

    let mutateTarget = getRandomInt(candidates);
    let current = 0;
    traverseWithParents(ast, (node) => {
        if( node.type === "Literal" && node.value === 0 ) {
            if( current === mutateTarget ) {
                node.value = constant;
                console.log( chalk.red(`Replacing 0 with ${constant} on line ${node.loc.start.line}` ));
            }
            current++;
        }
    })
}

rewrite("../checkbox.io-micro-preview/test.js", 
"../checkbox.io-micro-preview/test-mod.js")


function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

// Helper function for counting children of node.
function childrenLength(node)
{
	var key, child;
	var count = 0;
	for (key in node) 
	{
		if (node.hasOwnProperty(key)) 
		{
			child = node[key];
			if (typeof child === 'object' && child !== null && key != 'parent') 
			{
				count++;
			}
		}
	}	
	return count;
}


// Helper function for checking if a node is a "decision type node"
function isDecision(node)
{
	if( node.type == 'IfStatement' || node.type == 'ForStatement' || node.type == 'WhileStatement' ||
		 node.type == 'ForInStatement' || node.type == 'DoWhileStatement')
	{
		return true;
	}
	return false;
}

// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}
