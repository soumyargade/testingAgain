
const esprima = require("esprima");
const escodegen = require("escodegen");
const options = {tokens:true, tolerant: true, loc: true, range: true };
const fs = require("fs");
const chalk = require('chalk');

let operations = [ ConstantReplacement, NonEmptyString, CloneReturn, ConditionalExpression, ControlFlow, ConditionalBoundaries, Incrementals, NegateConditionals ]

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

function ControlFlow(ast) {
    let all_ifs = new Map();

    // set up `all_ifs` with buckets corresponding to the parent contexts in which the IfStatements reside
    traverseWithParents(ast, (node) => {
        if (node.type == "IfStatement") {
            if(!all_ifs.has(node.parent)) {
                all_ifs.set(node.parent, new Array());
            }
            all_ifs.get(node.parent).push(node);
        }
    })


 
    //prune all buckets that only have 1 entry, since we can't mutate those
    for( let x of all_ifs.keys() ) {
        if (all_ifs.get(x).length <= 1) {
            all_ifs.delete(x);
        }
    }

    // Choose the context that we want to mutate
    let chosen_context_index = getRandomInt(Array.from(all_ifs.keys()).length);
    let chosen_context = all_ifs.get(Array.from(all_ifs.keys())[chosen_context_index]); //gets the array of IfStatements from that context


    // Select the IfStatement within the chosen context that will recieve another IfStatement under it's `alternate` attribute
    let new_parent_if_index = getRandomInt(chosen_context.length)
    let new_parent_if = chosen_context[new_parent_if_index];
    // if the `alternate` attribute is already filled, continue following the alternate chain until `alternate` is `null`
    while ( new_parent_if.alternate && new_parent_if.alternate !== null ) {
        new_parent_if = new_parent_if.alternate;
    }

    // Select the IfStatement within the chosen context that will be placed under another IfStatement. 
    let if_to_move_index = getRandomInt(chosen_context.length);
    // Keep trying to select one until new_parent_if_index and if_to_move_index are different.
    while (if_to_move_index === new_parent_if_index ) if_to_move_index = getRandomInt(chosen_context.length);
    let if_to_move = chosen_context[if_to_move_index];

    // change from child to alternate of parent (add else)
    new_parent_if.alternate = if_to_move;
    // find the index of if_to_move in its parents array of children
    let idx = 0;
    for (let i = 0; i < if_to_move.parent.length; i++) {
        if (if_to_move.parent[i] == if_to_move) idx = i;
    }
    // remove if_to_move as a child of its former parent
    if_to_move.parent = if_to_move.parent.splice(idx, 1);

    // update the parents of if_to_mode to its new parents
    for (let i = 0; i < if_to_move.parent.length; i++) {
        if_to_move.parent[i] = new_parent_if.parent[i];
    }


    console.log( chalk.red(`Replacing "if" with "else if" on line ${new_parent_if.loc.start.line + 1}`));

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

function NonEmptyString(ast) {
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

rewrite("../checkbox.io-micro-preview/marqdown.js", 
"../checkbox.io-micro-preview/marqdown-mod.js")


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
