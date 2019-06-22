
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

                        board: [["white rook", "white knight", "white bishop", "white queen", "white king", "white bishop", "white knight", "white rook"],
                                ["white pawn", "white pawn", "white pawn", "white pawn", "white pawn", "white pawn", "white pawn", "white pawn"],
                                [null, null, null,  null, null, null, null, null],
                                [null, null, null,  null, null, null, null, null],
                                [null, null, null,  null, null, null, null, null],
                                [null, null, null,  null, null, null, null, null],
                                ["black pawn", "black pawn", "black pawn", "black pawn", "black pawn", "black pawn", "black pawn", "black pawn"],
                                ["black rook", "black knight", "black bishop", "black queen", "black king", "black bishop", "black knight", "black rook"],
                               ],

                        current_player: "white",

                        //special moves
                        enpassant_active: false,
                        enpassant_row: null,
                        enpassant_col: null,




                        // METHODS

                        // clone board by value
                        clone_board: function (){
                            let new_board = [];
                            for (var i = 0; i < this.board.length; i++)
                                new_board[i] = this.board[i].slice();
                            return new_board;
                        },

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
                        piece_at: function (row, col, board) {
                            return board[row][col];
                        },

                        piece2player: function (piece){
                            return piece.split(" ")[0];
                        },

                        piece2type: function (piece){
                            return piece.split(" ")[1];
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

                        apply_move: function (board, ori, dest){
                            board[dest[0]][dest[1]] = board[ori[0]][ori[1]];
                            board[ori[0]][ori[1]] = "";
                            return board;
                        },

                        get_valid_moves: function(ori_coords, board, isfuture=false){
                                // invert player momentarily if we are looking into the future
                                if (isfuture){
                                    this.invert_turn()
                                }

                                // get piece type in the selected coordinates
                                let [player, piece] = board[ori_coords[0]][ori_coords[1]].split(" ");

                                // fill valid moves using board, player, piece and ori_coords
                                let valid_moves = this[piece + "_generator"](ori_coords, board);

                                // filter valid moves using the general generator, that discards moves using general rules
                                valid_moves = this.general_move_filter(valid_moves, board);


                                if (isfuture){
                                    // pass
                                    this.invert_turn()
                                }
                                else{
                                    // filter valid moves using the exposed_king filter
                                    valid_moves = this.exposed_king_filter(ori_coords, valid_moves);
                                    //store current valid moves
                                    this.curr_valid_moves = valid_moves;
                                }



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

                        force_erase: function(row, col){
                            this.board[row][col] = null;
                        },

                        update: function (ori_cell, dest_cell) {
                            ori_coords = this.cell2cords(ori_cell);
                            dest_coords = this.cell2cords(dest_cell);


                            // SPECIAL MOVES
                            // check this is pawn double move and activate EN PASSANT flag
                            let [player_dir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            if (this.piece2type(this.piece_at(ori_coords[0], ori_coords[1], this.board)) === "pawn" &&
                                ori_coords[0] === start_row && Math.abs(dest_coords[0] - ori_coords[0]) === 2) {
                                console.log("EN PASSANT ACTIVATED");
                                this.enpassant_active = true;
                                this.enpassant_row = dest_coords[0] - player_dir;
                                this.enpassant_col = dest_coords[1];

                            }
                            // deactivate enpassant after
                            else{
                                this.enpassant_active = false;
                                this.enpassant_row = null;
                                this.enpassant_col = null;
                            }

                            // move piece to destination
                            this.board[dest_coords[0]][dest_coords[1]] = this.piece_at(ori_coords[0], ori_coords[1], this.board);
                            // remove piece from origin
                            this.board[ori_coords[0]][ori_coords[1]] = "";



                        },


                        // methods to obtain available moves for a piece and a certain board
                        "pawn_generator":   function (coords, board) {
                            let [row, col] = coords;
                            let [player_dir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];

                            let valid_moves = [];

                            // can move forward if it is empty
                            if (!this.piece_at(row + player_dir, col, board)) {
                                valid_moves.push([row + player_dir, col]);
                                // can move double if we are in the start row
                                if (row === start_row){
                                    valid_moves.push([row+player_dir*2, col]);
                                }
                            }
                            // can move diagonally forward-right if it is to attack an enemy
                            let piece2theright = this.piece_at(row+player_dir, col+player_dir, board);
                            let piece2theleft = this.piece_at(row+player_dir, col-player_dir, board);
                            if (piece2theright && this.piece2player(piece2theright) !== this.current_player){
                                valid_moves.push([row+player_dir, col+player_dir]);
                            }
                            if (piece2theleft && this.piece2player(piece2theleft) !== this.current_player){
                                valid_moves.push([row+player_dir, col-player_dir]);
                            }

                            // EN PASSANT
                            // can also move diagonally if we are in the 5th row and col+1 or col-1 is same as
                            // column flagged as a pawn just moved double
                            if (row === start_row + 3*player_dir && this.enpassant_active){
                                if(this.enpassant_col === col+player_dir){
                                    valid_moves.push([row+player_dir, col+player_dir]);
                                }
                                else if(this.enpassant_col === col-player_dir){
                                    valid_moves.push([row+player_dir, col-player_dir]);
                                }

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
                            return [[row + 1, col+2],
                                   [row + 1, col-2],
                                   [row - 1, col+2],
                                   [row - 1, col-2],
                                   [row + 2, col+1],
                                   [row + 2, col-1],
                                   [row - 2, col+1],
                                   [row - 2, col-1]];
                        },
                        "bishop_generator": function (coords, board) {
                            let [pdir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            let dirs = [[pdir, pdir], [pdir, -pdir], [-pdir, -pdir], [-pdir, pdir]];
                            return this.radial_generator(coords, board, dirs)
                        },
                        "king_generator":   function (coords, board) {
                            let [row, col] = coords;
                            let [player_dir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            return [[row + 1, col],
                                   [row + 1, col+1],
                                   [row, col + 1],
                                   [row - 1, col + 1],
                                   [row - 1, col],
                                   [row - 1, col-1],
                                   [row, col-1],
                                   [row + 1, col-1]];
                        },
                        "queen_generator":  function (coords, board) {
                            let [pdir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                            let dirs = [[pdir, 0], [0, pdir], [-pdir, 0], [0, -pdir],
                                        [pdir, pdir], [pdir, -pdir], [-pdir, -pdir], [-pdir, pdir]];
                            return this.radial_generator(coords, board, dirs)
                        },
                        // method to filter out invalid moves based on general rules that aply to all pieces
                        general_move_filter: function (potential_moves, board) {
                            let valid_moves = [];
                            for (let i=0; i < potential_moves.length; i++){
                                // check movement is inside board
                                if (this.coords_outof_board(potential_moves[i][0], potential_moves[i][1])){
                                        continue;
                                    }
                                // check movement is not to a cell occupied by a piece of the same player
                                let recv_piece = this.piece_at(potential_moves[i][0], potential_moves[i][1], board);
                                if (recv_piece){
                                    if (this.piece2player(recv_piece) === this.current_player){
                                        continue;
                                    }
                                }

                                valid_moves.push(potential_moves[i]);

                            }
                            return valid_moves;
                        },

                        // method to filter out invalid moves based on whether they leave the king exposed
                        exposed_king_filter: function(ori_coords, potential_moves){
                            let valid_moves = [];
                            // after checking move is correct, check king cannot be attacked by any enemy piece
                            // for each of these available moves. Remove move from list if any enemy piece threatens
                            // king after that movement.

                            // for each potentially valid movement
                            for(let i=0;i<potential_moves.length;i++){
                                // flag to indicate the movement has been identified as invalid
                                let is_invalid = false;
                                // build the board that movement would end up in
                                    let after_board = this.apply_move(this.clone_board(), ori_coords, potential_moves[i]);
                                // find coords of player's king
                                let king_coords = null;
                                for(let x=0;x<8;x++) {
                                    for(let y=0;y<8;y++) {
                                        if(this.piece_at(x, y, after_board) === this.current_player + " king"){
                                            king_coords = [x,y];
                                        }
                                    }
                                }


                                // for each piece of the opposite player
                                for_each_enemy:
                                    for(let x=0;x<8;x++) {
                                        for(let y=0;y<8;y++) {
                                            if(!this.piece_at(x, y, after_board)){continue;}
                                            if(this.piece2player(this.piece_at(x, y, after_board)) !== this.current_player){
                                                // get valid movements for this piece in this possible future board
                                                let after_valid_moves = this.get_valid_moves([x,y], after_board, isfuture=true);
                                                // the move is illegal if this piece can move to the kings position next
                                                for(let q=0;q<after_valid_moves.length;q++) {
                                                    if (after_valid_moves[q][0] === king_coords[0] &&
                                                        after_valid_moves[q][1] === king_coords[1]){
                                                        is_invalid = true;
                                                        break for_each_enemy;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                if (!is_invalid){
                                    valid_moves.push(potential_moves[i])
                                }
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
                                    if(this.piece_at(mov[0], mov[1], board)){
                                        if(this.piece2player(this.piece_at(mov[0], mov[1], board)) !== this.current_player){
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
        available_moves = virtual_board.get_valid_moves(virtual_board.cell2cords(ori_cell), virtual_board.board);
        for (i=0;i<available_moves.length;i++){
            let [row, col] = available_moves[i];
            cell_at(row, col).style.backgroundColor = "white";
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
        else{
            dest_cell = event.target;
        }

        // now move if the movement is valid
        if (virtual_board.validate_move(dest_cell)){
            // move piece to desination
            dest_cell.innerHTML = ori_cell.querySelector("span").outerHTML;
            // remove piece from origin
            ori_cell.innerHTML = "";

            // ENPASSANT if the piece is a pawn, remove piece behind it (never happens with normal moves, removes killed if in en passant)
            let [dest_row, dest_col] = virtual_board.cell2cords(dest_cell);
            if (dest_row === virtual_board.enpassant_row && dest_col === virtual_board.enpassant_col){
                console.log("EN PASSANT TAKEN")
                // en passant move taken, kill piece located at the row before destination
                let [player_dir, start_row] = virtual_board.current_player === "white"? [1, 1]:[-1,6];
                let behind_cell = cell_at(dest_row - player_dir, dest_col);
                behind_cell.innerHTML = "";
                virtual_board.force_erase(dest_row - player_dir, dest_col)
            }




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