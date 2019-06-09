
// function to invert coords
function invert_coord(coord) {
    return Math.abs(coord - 7);
}


// function to check if a movement is valid for each piece and movement
function valid_move(origin_cell, destiny_cell){


    // extract coordinates and piece of moving piece
    let ori_row = Number(origin_cell.parentElement.className.split("_")[1]);
    let ori_col = Number(origin_cell.className.split("_")[1]);
    let [ori_player, ori_piece] = origin_cell.querySelector("span").className.split(" ").slice(0,2);


    // extract coordinates and piece of receiving piece
    let dest_row = Number(destiny_cell.parentElement.className.split("_")[1]);
    let dest_col = Number(destiny_cell.className.split("_")[1]);


    // if we take our piece to an empty cell, the recv piece and player are null
    let recv_piece = destiny_cell.querySelector("span");
    let recv_player = null;
    if (recv_piece != null){
        [recv_player, recv_piece] = destiny_cell.querySelector("span").className.split(" ").slice(0,2);
    }


    // let ori_coords = [ori_row, ori_col];
    // let dest_coords = [dest_row, dest_col];
    // console.log(ori_coords);
    // console.log(dest_coords);


    // if we have tried to kill a piece of our own, the movement is not valid
    if (recv_player != null && recv_player === ori_player){
        return false;
    }


    // now lets decide if the movement is valid depending on the type of piece it is
    switch(ori_piece) {
        case "pawn":
            // at the black player's turn, invert coordinate system to a bottom left 0,0 one
            // (this only matters for pawns that can only move forward)
            if (ori_player === "black"){
                ori_row = invert_coord(ori_row);
                ori_col = invert_coord(ori_col);
                dest_row = invert_coord(dest_row);
                dest_col = invert_coord(dest_col);
            }
            if (recv_player == null){
                // pawns can only move forward
                if (ori_col !== dest_col){
                    return false;
                }
                // pawns can move two cells forward the first time TODO fix cant move 2x if someone in the middle
                else if (ori_player === "white" && ori_row === 1){
                    if (Math.abs(dest_row - ori_row > 2)){
                        return false;
                    }
                }
                else if (ori_row - dest_row  > 1){ // pawns can only move 1 cell forward normally
                    return false;
                }
            }
            else{ // in case we attempt to eat another piece with out pawn
                // pawns can only it in diagonal, one cell forward
                if(dest_row - ori_row !== 1){ // can only eat one cell forward
                    return false;
                }
                if (Math.abs(dest_col - ori_col) !== 1){ // can only eat one cell forward
                    return false;
                }
            }

            break;
        case "rook":
            // if both col and row change, movement is illegal. rooks can only move in straight lines
            if (ori_row !== dest_row && ori_col !== dest_col){
                return false;
            }
            // the rook can move in 4 different directions
            if (ori_row < dest_row){ // move forward
                for (i=1;i<dest_row - ori_row;i++){
                    let row2check = (ori_row + i);
                    // console.log(document.querySelector(".row_" + row2check + "> .col_" + ori_col).firstChild);
                    if(document.querySelector(".row_" + row2check + "> .col_" + ori_col).firstChild){
                        return false;
                    }
                }
            }
            else if (ori_row > dest_row){ // move backwards
                for (i=1;i<ori_row - dest_row;i++){
                    let row2check = (ori_row - i);
                    // console.log(document.querySelector(".row_" + row2check + "> .col_" + ori_col).firstChild);
                    if(document.querySelector(".row_" + row2check + "> .col_" + ori_col).firstChild){
                        return false;
                    }
                }
            }
            else if (ori_col < dest_col){ // move right
                for (i=1;i<dest_col - ori_col;i++){
                    let col2check = (ori_col + i);
                    // console.log(document.querySelector(".row_" + ori_row + "> .col_" + col2check).firstChild);
                    if(document.querySelector(".row_" + ori_row + "> .col_" + col2check).firstChild){
                        return false;
                    }
                }
            }
            else if (ori_col > dest_col){ // move left
                for (i=1;i<ori_col - dest_col;i++){
                    let col2check = (ori_col - i);
                    // console.log(document.querySelector(".row_" + ori_row + "> .col_" + col2check).firstChild);
                    if(document.querySelector(".row_" + ori_row + "> .col_" + col2check).firstChild){
                        return false;
                    }
                }
            }
            else {
                console.log("Rook not moving in any of the 4 mandatory dimensions.")
            }

            break;
        case "knight":
            break;
        case "bishop":
            // only if the abs mov is the same in rows and cols, mov is legal. bishops can only move in diagonal
            if (Math.abs(ori_row - dest_row) !== Math.abs(ori_col - dest_col)){
                return false;
            }
            // the bishop can move in 4 different directions
            if (ori_row < dest_row && ori_col < dest_col){ // move north-east
                for (i=1;i<dest_row - ori_row;i++){
                    let row2check = (ori_row + i);
                    let col2check = (ori_col + i);
                    console.log(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild);
                    if(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild){
                        return false;
                    }
                }
            }
            else if (ori_row < dest_row && ori_col > dest_col){ // move north-west
                for (i=1;i<dest_row - ori_row;i++){
                    let row2check = (ori_row + i);
                    let col2check = (ori_col - i);

                    console.log(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild);
                    if(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild){
                        return false;
                    }
                }
            }
            else if (ori_row > dest_row && ori_col < dest_col){ // move south-east
                for (i=1;i<dest_col - ori_col;i++){
                    let row2check = (ori_row - i);
                    let col2check = (ori_col + i);

                    console.log(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild);
                    if(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild){
                        return false;
                    }
                }
            }
            else if (ori_row > dest_row && ori_col > dest_col){ // move south-west
                for (i=1;i<ori_col - dest_col;i++){
                    let row2check = (ori_row - i);
                    let col2check = (ori_col - i);
                    console.log(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild);
                    if(document.querySelector(".row_" + row2check + "> .col_" + col2check).firstChild){
                        return false;
                    }
                }
            }
            else {
                console.log("Rook not moving in any of the 4 mandatory dimensions.")
            }
            break;
        case "king":
            break;
        case "queen":
            break;
    }



    return true;
}


// select all pieces
let pieces = document.querySelectorAll("[class^=\"col\"] > span");
// initialise flag that signal a piece has been dragged to false
let piece_dragged = false;
// initalise variable to store the cell where the piece to be moved lives to null
let ori_cell = null;
// initalise turn
let turn = "white";

// make pieces draggable
for (i=0; i < pieces.length; i++){
    // makes pieces draggable
    pieces[i].setAttribute("draggable", true);
}
// register callback for drag start
document.addEventListener("dragstart", function (event) {
    // we must drag a piece and it must belong to the player to whom the turn belongs
    if (event.target.className.includes("piece") && event.target.className.split(" ")[0]===turn) {
        ori_cell = event.target.parentElement;
        piece_dragged = true;
    }
});

// register callback for drop
document.addEventListener("drop", function (event) {
    event.preventDefault();
    if (piece_dragged){
        // get destination cell, both if it is empty or with a piece inside
        let dest_cell = null;
        if(event.target.className.includes("piece")){ // if we attack another piece
            dest_cell = event.target.parentElement;
        }
        else {
            dest_cell = event.target;
        }

        // now move if the movement is valid
        if (valid_move(ori_cell, dest_cell)){
            dest_cell.innerHTML = ori_cell.querySelector("span").outerHTML;
            ori_cell.innerHTML = "";
            piece_dragged = false;
            reverse_board(document.querySelector("#board"));
            // change turn
            if (turn === "white"){
                turn = "black";
            }
            else{
                turn = "white";
            }
        }
    }
});

// By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element
document.addEventListener("dragover", function(event) {
  event.preventDefault();
});



// register callback to invert board
// function to reverse children of an element
function reverse_board(element){
    for (let i=1;i<element.childNodes.length;i++){
        // reverse each col in row
        for (let j=1;j<element.childNodes[i].childNodes.length;j++) {
            element.childNodes[i].insertBefore(element.childNodes[i].childNodes[j], element.childNodes[i].firstChild);
        }
        // now reverse row
        element.insertBefore(element.childNodes[i], element.firstChild);
    }
}