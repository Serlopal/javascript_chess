
// function to invert coords
// TODO REMOVE THIS AFTER TRANSFER TO VIRTUAL BOARD GENERATORS
function invert_coord(coord) {
    return Math.abs(coord - 7);
}

// function to get piece in given coordinates of board
function piece_at(row, col) {
    if (row > 7 || row < 0 || col > 7 || col < 0){
        return null
    }
    return document.querySelector(".row_" + row + "> .col_" + col).firstChild;
}

// function to get piece in given coordinates of board
function cell_at(row, col) {
    return document.querySelector(".row_" + row + "> .col_" + col);
}



let virtual_board = {
                        curr_valid_moves: null,

                        board: [["white rook", "white knight", "white bishop", "white king", "white queen", "white bishop", "white knight", "white rook"],
                                ["white pawn", "white pawn", "white pawn", "white pawn", "white pawn", "white pawn", "white pawn", "white pawn"],
                                [null, null, null,  null, null, null, null, null],
                                [null, null, null,  null, null, null, null, null],
                                [null, null, null,  null, null, null, null, null],
                                [null, null, null,  null, null, null, null, null],
                                ["black pawn", "black pawn", "black pawn", "black pawn", "black pawn", "black pawn", "black pawn", "black pawn"],
                                ["black rook", "black knight", "black bishop", "black king", "black queen", "black bishop", "black knight", "black rook"],
                               ],

                        current_player: "white",


                        // METHODS

                        // invert turn method
                        invert_turn: function(){
                            if (this.current_player === "white"){
                                this.current_player = "black";
                            }
                            else{
                                this.current_player = "white";
                            }
                        },

                        // function to get piece in given coordinates of board
                        piece_at: function (row, col) {
                            return this.board[row][col];
                        },

                        piece2player: function (piece){
                            return piece.split(" ")[0];
                        },

                        validate_move: function (dest_cell) {
                            let dest_coords = this.cell2cords(dest_cell);

                            // destination coords must be included in list of valid moves created at dragstart
                            for (i=0;i<this.curr_valid_moves.length;i++){
                                if(this.curr_valid_moves[i][0] === dest_coords[0] &&
                                   this.curr_valid_moves[i][1] === dest_coords[1]){
                                    return true;
                                }
                            }
                            return false;

                        },

                        get_valid_moves: function(ori_cell, board){
                                let ori_coords = this.cell2cords(ori_cell);
                                // get piece type in the selected coordinates
                                let [player, piece] = board[ori_coords[0]][ori_coords[1]].split(" ");

                                // fill valid moves using board, player, piece and ori_coords
                                let valid_moves = this[piece + "_generator"](ori_coords, board);
                                // filter valid moves using the general generator, that discards moves using general rules
                                valid_moves = this.general_move_filter(valid_moves);


                                // after checking move is correct, check king cannot be attacked by any enemy piece
                                // for each of these available moves. Remove move from list if any enemy piece threatens
                                // king after that movement.
                                    // build new board after movement

                                    // call get_valid_moves with that new board for all enemy pieces and check
                                    // no piece can move to the kings position in that board


                                //store current valid moves
                                this.curr_valid_moves = valid_moves;
                                return valid_moves
                        },

                        cell2cords: function (cell) {
                            // extract coordinates and piece of moving piece
                            let row = Number(cell.parentElement.className.split("_")[1]);
                            let col = Number(cell.className.split("_")[1]);

                            let coords = [row, col];

                            return coords;

                        },

                        coords_outof_board: function(row, col) {
                            return row < 0 || row > 7 || col < 0 || col > 7
                        },

                        update: function (ori_cell, dest_cell) {
                            ori_coords = this.cell2cords(ori_cell);
                            dest_coords = this.cell2cords(dest_cell);
                            // move piece to destination
                            this.board[dest_coords[0]][dest_coords[1]] = this.board[ori_coords[0]][ori_coords[1]];
                            // remove piece from origin
                            this.board[ori_coords[0]][ori_coords[1]] = "";

                        },


                        // methods to obtain available moves for a piece and a certain board
                        "pawn_generator":   function (coords, board) {
                            let [row, col] = coords;
                            let [player_dir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];

                            let valid_moves = [];

                            // can move forward if it is empty
                            if (!this.piece_at(row + player_dir, col)) {
                                valid_moves.push([row + player_dir, col]);
                                // can move double if we are in the start row
                                if (row === start_row){
                                    valid_moves.push([row+player_dir*2, col]);
                                }
                            }
                            // can move diagonally forward-right if it is to attack an enemy
                            let piece2theright = this.piece_at(row+player_dir, col+player_dir);
                            let piece2theleft = this.piece_at(row+player_dir, col-player_dir);
                            if (piece2theright && this.piece2player(piece2theright) !== this.current_player){
                                valid_moves.push([row+player_dir, col+player_dir]);
                            }
                            if (piece2theleft && this.piece2player(piece2theleft) !== this.current_player){
                                valid_moves.push([row+player_dir, col-player_dir]);
                            }

                            return valid_moves;

                            },
                        "rook_generator":   function (coords, board) {
                            let [pdir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            let dirs = [[pdir, 0], [0, pdir], [-pdir, 0], [0, -pdir]];
                            return this.radial_generator(coords, board, dirs)
                        },
                        "knight_generator":  function (coords, board) {
                            let [row, col] = coords;
                            // check destination coordinates are one of the 8 places the night can go
                            let valid_moves = [ [row + 1, col+2],
                                                [row + 1, col-2],
                                                [row - 1, col+2],
                                                [row - 1, col-2],
                                                [row + 2, col+1],
                                                [row + 2, col-1],
                                                [row - 2, col+1],
                                                [row - 2, col-1]];
                            return valid_moves;
                        },
                        "bishop_generator": function (coords, board) {
                            let [pdir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            let dirs = [[pdir, pdir], [pdir, -pdir], [-pdir, -pdir], [-pdir, pdir]];
                            return this.radial_generator(coords, board, dirs)
                        },
                        "king_generator":   function (coords, board) {
                            let [row, col] = coords;
                            let [player_dir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            let valid_moves = [ [row + 1, col],
                                                [row + 1, col+1],
                                                [row, col + 1],
                                                [row - 1, col + 1],
                                                [row - 1, col],
                                                [row - 1, col-1],
                                                [row, col-1],
                                                [row + 1, col-1]];
                            return valid_moves;
                        },
                        "queen_generator":  function (coords, board) {
                            let [pdir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            let dirs = [[pdir, 0], [0, pdir], [-pdir, 0], [0, -pdir],
                                        [pdir, pdir], [pdir, -pdir], [-pdir, -pdir], [-pdir, pdir]];
                            return this.radial_generator(coords, board, dirs)
                        },
                        // method to filter out invalid moves based on general rules that aply to all pieces
                        general_move_filter: function (potential_moves) {
                            let valid_moves = [];
                            for (let i=0; i < potential_moves.length; i++){
                                // check movement is inside board
                                if (this.coords_outof_board(potential_moves[i][0], potential_moves[i][1])){
                                        continue;
                                    }
                                // check movement is not to a cell occupied by a piece of the same player
                                let recv_piece = this.piece_at(potential_moves[i][0], potential_moves[i][1]);
                                if (recv_piece){
                                    if (this.piece2player(recv_piece) === this.current_player){
                                        continue;
                                    }
                                }

                                valid_moves.push(potential_moves[i]);

                            }
                            return valid_moves;
                        },
                        // method to generate radial movements using custom radiuses for rooks, bishops and queen
                        radial_generator: function (coords, board, dirs) {
                            let [row, col] = coords;
                            let valid_moves = [];

                            for(i=0;i<dirs.length;i++){
                                for (j=1;j<8;j++){
                                    let mov = [row+dirs[i][0]*j, col+dirs[i][1]*j];
                                    if(this.coords_outof_board(mov[0], mov[1])){
                                        break;
                                    }
                                    if(this.piece_at(mov[0], mov[1])){
                                        if(this.piece2player(this.piece_at(mov[0], mov[1])) !== this.current_player){
                                            valid_moves.push([mov[0], mov[1]]);
                                        }
                                        break;
                                    }
                                    valid_moves.push([mov[0], mov[1]]);

                                }
                            }
                            return valid_moves;
                        }
                    };


// select all pieces
let pieces = document.querySelectorAll("[class^=\"col\"] > span");
// initialise flag that signal a piece has been dragged to false
let piece_dragged = false;
// initialise variable to store the cell where the piece to be moved lives to null
let ori_cell = null;
// initialise variable to track rotation of the board and pieces
let board_rotated = false;
// initialise variable to track available moves at each movement, so as to reset their styling after the move
let available_moves = null;

// make pieces draggable
for (let i=0; i < pieces.length; i++){
    // makes pieces draggable
    pieces[i].setAttribute("draggable", true);
}
// register callback for drag start
document.addEventListener("dragstart", function (event) {
    // we must drag a piece and it must belong to the player to whom the turn belongs
    if (event.target.className.includes("piece") && event.target.className.split(" ")[0]===virtual_board.current_player) {
        // compute available moves and highlight them
        ori_cell = event.target.parentElement;
        // we need get_valid_moves to use a external board to use it to check the king is not threaten in the next step
        available_moves = virtual_board.get_valid_moves(ori_cell, virtual_board.board);
        for (i=0;i<available_moves.length;i++){
            let [row, col] = available_moves[i];
            cell_at(row, col).style.backgroundColor = "green";
        }

        // flag we have dragged a piece
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
        if (virtual_board.validate_move(dest_cell)){
            // move piece to desination
            dest_cell.innerHTML = ori_cell.querySelector("span").outerHTML;
            // remove piece from origin
            ori_cell.innerHTML = "";
            // update virtual board
            virtual_board.update(ori_cell, dest_cell);
            // unflag drag event
            piece_dragged = false;
            // reverse board for the next player
            reverse_board(document.querySelector("#board"));
            // change turn
            virtual_board.invert_turn()
        }

        // remove highlighting of possible moves once this one has finished
        for (i=0;i<available_moves.length;i++){
            let [row, col] = available_moves[i];
            cell_at(row, col).style.backgroundColor = "";
        }
    }
});

// By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element
document.addEventListener("dragover", function(event) {
  event.preventDefault();
});



// register callback to invert board
// function to reverse children of an element

function reverse_board() {
    let pcs = document.querySelectorAll("[class^=\"col\"] > span");
    let brd = document.querySelector("#board");

    let deg = board_rotated? 0 : 180;

    brd.style.mozTransform    = 'rotate('+deg+'deg)';
    brd.style.msTransform     = 'rotate('+deg+'deg)';
    brd.style.oTransform      = 'rotate('+deg+'deg)';
    brd.style.transform       = 'rotate('+deg+'deg)';

    for (let i=0; i < pcs.length; i++){
        pcs[i].style.mozTransform    = 'rotate('+deg+'deg)';
        pcs[i].style.msTransform     = 'rotate('+deg+'deg)';
        pcs[i].style.oTransform      = 'rotate('+deg+'deg)';
        pcs[i].style.transform       = 'rotate('+deg+'deg)';
    }

    board_rotated = !board_rotated;
}





// function reverse_board(element){
//     for (let i=1;i<element.childNodes.length;i++){
//         // reverse each col in row
//         for (let j=1;j<element.childNodes[i].childNodes.length;j++) {
//             element.childNodes[i].insertBefore(element.childNodes[i].childNodes[j], element.childNodes[i].firstChild);
//         }
//         // now reverse row
//         element.insertBefore(element.childNodes[i], element.firstChild);
//     }
// }