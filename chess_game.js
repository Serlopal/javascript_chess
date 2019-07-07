

class ChessGame {
    constructor(){
        // create driver
        this.driver = new ChessDriver();
        // select all pieces
        this.pieces = document.querySelectorAll("[class^=\"col\"] > span");
        // initialise flag that signal a piece has been dragged to false
        this.piece_dragged = false;
        // initialise variable to store the cell where the piece to be moved lives to null
        this.ori_cell = null;
        // initialise variable to track rotation of the board and pieces
        this.board_rotated = false;
        // initialise variable to track available moves at each movement, so as to reset their styling after the move
        this.available_moves = null;
        // special reference to this game object to be referenced during event callbacks, since this will refer to the document in that cases
        let self = this;

        this.reverse_board = function() {
            let pcs = document.querySelectorAll("[class^=\"col\"] > span");
            let brd = document.querySelector("#board");

            let deg = this.board_rotated? 0 : 180;

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

            this.board_rotated = !this.board_rotated;
        };

        this.on_drop = function(event){
            event.preventDefault();
            if (self.piece_dragged){
                // get destination cell, both if it is empty or with a piece inside
                let dest_cell = null;
                if(event.target.className.includes("piece")){ // if we attack another piece
                    dest_cell = event.target.parentElement;
                }
                else{
                    dest_cell = event.target;
                }

                // now move if the movement is valid
                if (self.driver.validate_move(self.cell2cords(dest_cell))){

                    // apply_move2board frontend
                    self.update_frontend(self.driver.board);

                    // ENPASSANT if the piece is a pawn, remove piece behind it (never happens with normal moves, removes killed if in en passant)
                    // let [dest_row, dest_col] = cell2cords(dest_cell);
                    // if (dest_row === driver.enpassant_row && dest_col === virtual_board.enpassant_col){
                    //     // en passant move taken, kill piece located at the row before destination
                    //     let [player_dir, start_row] = virtual_board.current_player === "white"? [1, 1]:[-1,6];
                    //     let behind_cell = cell_at(dest_row - player_dir, dest_col);
                    //     behind_cell.innerHTML = "";
                    //     virtual_board.force_erase(dest_row - player_dir, dest_col)
                    // }
                    // unflag drag event
                    self.piece_dragged = false;
                    // reverse board for the next player
                    self.reverse_board(document.querySelector("#board"));
                }

                // remove highlighting of possible moves once this one has finished
                for (let i=0;i<self.available_moves.length;i++){
                    let [row, col] = self.available_moves[i];
                    self.cell_at(row, col).style.backgroundColor = "";
                }
            }
        };

        this.on_drag = function(event){
            // we must drag a piece and it must belong to the player to whom the turn belongs
            if (event.target.className.includes("piece") && event.target.className.split(" ")[0] === self.driver.current_player) {
                // compute available moves and highlight them
                self.ori_cell = event.target.parentElement;
                // we need get_valid_moves to use a external board to use it to check the king is not threaten in the next step
                self.available_moves = self.driver.get_valid_moves(self.cell2cords(self.ori_cell));
                for (let i=0;i<self.available_moves.length;i++){
                    let [row, col] = self.available_moves[i];
                    self.cell_at(row, col).style.backgroundColor = "white";
                }

                // flag we have dragged a piece
                self.piece_dragged = true;
            }
        };

        this.cell_at = function(row, col){
        return document.querySelector(".row_" + row + "> .col_" + col);
    };

        this.piece_at = function(row, col) {
        if (row > 7 || row < 0 || col > 7 || col < 0){
            return null
        }
        return document.querySelector(".row_" + row + "> .col_" + col).firstChild;
    };

        this.cell2cords = function (cell) {
            // extract coordinates and piece of moving piece
            let row = Number(cell.parentElement.className.split("_")[1]);
            let col = Number(cell.className.split("_")[1]);

            return [row, col];
        };

        this.update_frontend = function(board){

            let piece2char = {"pawn": "&#9817",
                              "rook": "&#9820",
                              "knight": "&#9822",
                              "bishop": "&#9821",
                              "queen": "&#9819",
                              "king": "&#9818",
            };

            for(let x=0;x<8;x++) {
                for(let y=0;y<8;y++) {
                    let c = this.cell_at(x, y);
                    let p = board[x][y];

                    if(p){
                        c.innerHTML = `<span class="${p.player} ${p.type} piece">${piece2char[p.type]}</span>`
                    }
                    else{
                        c.innerHTML = "";
                    }
                }
            }


            this.setup_interaction_callbacks()
        };

        this.setup_interaction_callbacks = function ()  {
            // fetch pieces again
            this.pieces = document.querySelectorAll("[class^=\"col\"] > span");

            // make pieces draggable
            for (let i=0; i < this.pieces.length; i++){
                // makes pieces draggable
                this.pieces[i].setAttribute("draggable", true);
            }
            // register callback for drag start
            // TODO change this to add listeners on pieces for drag and cell/pieces for drop
            document.addEventListener("dragstart", this.on_drag);
            // register callback for drop
            document.addEventListener("drop", this.on_drop);
            // By default, data/elements cannot be dropped in other elements. To allow a drop, we must prevent the default handling of the element
            document.addEventListener("dragover", function(event) {event.preventDefault();});
        };
        this.setup_interaction_callbacks()
        
    }
}

class ChessDriver {
    constructor() {

        class ChessPiece {
                constructor(player) {
                    this.player = player;
                    this.hasMoved = false;

                    this.piece_at = function (row, col, board) {
                        return board[row][col];
                    };

                    this.invalid_coords = function (row, col){
                        return row < 0 || row > 7 || col < 0 || col > 7
                    };

                    this.radial_generator = function (coords, board, dirs) {
                        let [row, col] = coords;
                        let valid_moves = [];

                        for(let i=0;i<dirs.length;i++){
                            for (let j=1;j<8;j++){
                                let mov = [row+dirs[i][0]*j, col+dirs[i][1]*j];
                                if(this.invalid_coords(mov[0], mov[1])){
                                    break;
                                }
                                if(this.piece_at(mov[0], mov[1], board)){
                                    if(this.piece_at(mov[0], mov[1], board).player !== this.current_player){
                                        valid_moves.push([mov[0], mov[1]]);
                                    }
                                    break;
                                }
                                valid_moves.push([mov[0], mov[1]]);

                            }
                        }
                        return valid_moves;
                    };
                }
            }
        this.pieces = {

            Pawn:   class extends ChessPiece {
                constructor(player) {
                    super(player);
                    this.type = "pawn";
                    this.dir = player === "white" ? 1:-1;
                    this.start_row = player === "white" ? 1:6;
                    this.enpassant_vulnerable = false;
                    this.enpassant_row = null;
                    this.enpassant_col = null;

                    this.get_valid_moves = function (coords, board, nmoves) {
                        let [row, col] = coords;
                        let valid_moves = [];


                        // Non offensive moves
                        if (!this.piece_at(row + this.dir, col, board)) {
                            valid_moves.push([row + this.dir, col]);
                            // can move double if we are in the start row and there is no one in the dest
                            if (row === this.start_row && !this.piece_at(row + 2*this.dir, col, board)){
                                valid_moves.push([row+this.dir*2, col]);
                                this.enpassant_vulnerable = nmoves;
                            }
                        }

                        // Offensive moves
                        let piece2northeast = this.piece_at(row+this.dir, col+this.dir, board);
                        let piece2northwest = this.piece_at(row+this.dir, col-this.dir, board);

                        // can move diagonally forward-right if it is to attack an enemy
                        if (piece2northeast && piece2northeast.player !== this.current_player){
                            valid_moves.push([row+this.dir, col+this.dir]);
                        }
                        if (piece2northwest && piece2northwest.player !== this.current_player){
                            valid_moves.push([row+this.dir, col-this.dir]);
                        }

                        // EN PASSANT
                        // can also move diagonally if we are in the 5th row and col+1 or col-1 is same as
                        // column flagged as a pawn just moved double
                        if (row === this.start_row + 3*this.dir){
                            let piece2east = this.piece_at(row, col+this.dir, board);
                            let piece2west = this.piece_at(row, col-this.dir, board);

                            if (piece2east && nmoves === piece2east.enpassant_vulnerable + 1){
                                valid_moves.push([row+this.dir, col+this.dir]);
                            }
                            if (piece2west && nmoves === piece2west.enpassant_vulnerable + 1){
                                valid_moves.push([row+this.dir, col-this.dir]);
                            }
                        }
                        return valid_moves;
                    }
                }
            },

            Rook:   class extends ChessPiece {
                constructor(player) {
                    super(player);
                    this.type = "rook";
                    this.dir = player === "white" ? 1:-1;
                    this.start_row = player === "white" ? 1:6;

                    this.get_valid_moves = function(coords, board) {
                        let dirs = [[this.dir, 0], [0, this.dir], [-this.dir, 0], [0, -this.dir]];
                        return this.radial_generator(coords, board, dirs)
                    }

                }
            },

            Knight: class extends ChessPiece {
                constructor(player) {
                    super(player);
                    this.type = "knight";
                    this.dir = player === "white" ? 1:-1;
                    this.start_row = player === "white" ? 1:6;

                    this.get_valid_moves = function (coords, board) {
                        let [row, col] = coords;
                        // check destination coordinates are one of the 8 places the night can go
                        let valid_moves = [];
                        let potential_moves = [[row + 1, col+2],
                                               [row + 1, col-2],
                                               [row - 1, col+2],
                                               [row - 1, col-2],
                                               [row + 2, col+1],
                                               [row + 2, col-1],
                                               [row - 2, col+1],
                                               [row - 2, col-1]];
                        // remove moves that fall out of the board
                        for (let i=0; i<potential_moves.length;i++){
                            if (! this.invalid_coords(...potential_moves[i])) {
                                valid_moves.push(potential_moves[i]);
                            }
                        }
                        return valid_moves
                    }
                }
            },

            Bishop: class extends ChessPiece {
                constructor(player) {
                    super(player);
                    this.type = "bishop";
                    this.dir = player === "white" ? 1:-1;
                    this.start_row = player === "white" ? 1:6;

                    this.get_valid_moves = function (coords, board) {
                        let dirs = [[this.dir, this.dir], [this.dir, -this.dir], [-this.dir, -this.dir], [-this.dir, this.dir]];
                        return this.radial_generator(coords, board, dirs)
                    }
                }
            },

            Queen:  class extends ChessPiece {
                constructor(player) {
                    super(player);
                    this.type = "queen";
                    this.dir = player === "white" ? 1:-1;
                    this.start_row = player === "white" ? 1:6;

                    this.get_valid_moves = function (coords, board) {
                        let dirs = [[this.dir, 0], [0, this.dir], [-this.dir, 0], [0, -this.dir],
                                    [this.dir, this.dir], [this.dir, -this.dir], [-this.dir, -this.dir],
                                    [-this.dir, this.dir]
                                   ];
                        return this.radial_generator(coords, board, dirs)
                    }
                }
            },

            King:   class extends ChessPiece {
                constructor(player) {
                    super(player);
                    this.type = "king";
                    this.dir = player === "white" ? 1:-1;
                    this.start_row = player === "white" ? 1:6;
                    this.get_valid_moves = function(coords, board) {
                        let [row, col] = coords;
                        let [player_dir, start_row] = this.current_player === "white"? [1, 1]:[-1,6];
                        let valid_moves = [];
                        let potential_moves =  [[row + 1, col],
                                                [row + 1, col+1],
                                                [row, col + 1],
                                                [row - 1, col + 1],
                                                [row - 1, col],
                                                [row - 1, col-1],
                                                [row, col-1],
                                                [row + 1, col-1]];
                        // remove moves that fall out of the board
                        for (let i=0; i<potential_moves.length;i++){
                            if (! this.invalid_coords(...potential_moves[i])) {
                                valid_moves.push(potential_moves[i]);
                            }
                        }
                        return valid_moves
                    }

                }
            },
        };
        this.curr_valid_moves = null;
        this.current_player = "white";
        this.move_counter = 0;

        this.board = [[new this.pieces.Rook("white"), new this.pieces.Knight( "white"), new this.pieces.Bishop("white"), new this.pieces.Queen("white"), new this.pieces.King("white"), new this.pieces.Bishop("white"), new this.pieces.Knight("white"), new this.pieces.Rook("white")],
                      [new this.pieces.Pawn("white"), new this.pieces.Pawn("white"), new this.pieces.Pawn("white"), new this.pieces.Pawn("white"), new this.pieces.Pawn("white"), new this.pieces.Pawn("white"), new this.pieces.Pawn("white"), new this.pieces.Pawn("white")],
                      [null, null, null,  null, null, null, null, null],
                      [null, null, null,  null, null, null, null, null],
                      [null, null, null,  null, null, null, null, null],
                      [null, null, null,  null, null, null, null, null],
                      [new this.pieces.Pawn("black"), new this.pieces.Pawn("black"), new this.pieces.Pawn("black"), new this.pieces.Pawn("black"), new this.pieces.Pawn("black"), new this.pieces.Pawn("black"), new this.pieces.Pawn("black"), new this.pieces.Pawn("black")],
                      [new this.pieces.Rook("black"), new this.pieces.Knight( "black"), new this.pieces.Bishop("black"), new this.pieces.Queen("black"), new this.pieces.King("black"), new this.pieces.Bishop("black"), new this.pieces.Knight("black"), new this.pieces.Rook("black")],
                     ];

        // METHODS

        this.move_piece = function (ori, dest) {
            // attempt to move a piece from origin (ori) to destination (dest). returns true if successful false if not
            let valid_moves = this.get_valid_moves(ori, this.clone_board(this.board), false);
            // destination coords must be included in list of valid moves
            for (let i=0;i<this.curr_valid_moves.length;i++){
                if(valid_moves[i][0] === dest[0] &&
                   valid_moves[i][1] === dest[1]){
                    return true;
                }
            }
            return false;
        };

        this.get_valid_moves = function (ori_coords) {
            this.curr_ori_coords = ori_coords;
            this.curr_valid_moves = this._get_valid_moves(ori_coords, this.clone_board(this.board), false);
            return this.curr_valid_moves
        };

        this._get_valid_moves = function (ori_coords, board, isfuture=false) {

            // invert player momentarily if we are looking into the future
            if (isfuture){
                this.invert_turn()
            }

            // fill valid moves using board, player, piece and ori_coords
            let p = this.piece_at(...ori_coords);
            let valid_moves = null;

            if (p.type === "pawn"){
                // pawns need to know the number of turns to deactivate en passant vulnerabilities
                valid_moves = p.get_valid_moves(ori_coords, board, this.move_counter);
            }
            else{
                valid_moves = p.get_valid_moves(ori_coords, board);
            }

            // filter valid moves using the general generator, that discards moves using general rules
            valid_moves = this.general_move_filter(valid_moves, board);


            if (isfuture){
                this.invert_turn()
            }
            else{
                // filter valid moves using the exposed_king filter
                valid_moves = this.exposed_king_filter(ori_coords, this.clone_board(board), valid_moves);
                //store current valid moves
                this.curr_valid_moves = valid_moves;
            }

            return valid_moves


        };

        this.general_move_filter = function (potential_moves, board) {
                        let p = new ChessPiece();

                        let valid_moves = [];
                        for (let i=0; i < potential_moves.length; i++){
                            // check movement is inside board
                            if (p.invalid_coords(potential_moves[i][0], potential_moves[i][1])){
                                    continue;
                                }
                            // check movement is not to a cell occupied by a piece of the same player
                            let recv_piece = p.piece_at(...potential_moves[i], board);
                            if (recv_piece){
                                if (recv_piece.player === this.current_player){
                                    continue;
                                }
                            }

                            valid_moves.push(potential_moves[i]);
                        }
                        return valid_moves;
                    };

        this.exposed_king_filter = function (ori_coords, board, potential_moves){

            let valid_moves = [];
            // after checking move is correct, check king cannot be attacked by any enemy piece
            // for each of these available moves. Remove move from list if any enemy piece threatens
            // king after that movement.

            // for each potentially valid movement
            for(let i=0;i<potential_moves.length;i++){
                // flag to indicate the movement has been identified as invalid
                let is_invalid = false;
                // build the board that movement would end up in
                let after_board = this.apply_move2board(this.clone_board(board), ori_coords, potential_moves[i]);
                // find coords of player's king
                let king_coords = null;
                for(let x=0;x<8;x++) {
                    for(let y=0;y<8;y++) {
                        let p = this.piece_at(x, y, after_board);
                        if(p && p.type === "king" && p.player === this.current_player){
                            king_coords = [x,y];
                        }
                    }
                }

                // for each piece of the opposite player
                for_each_enemy:
                    for(let x=0;x<8;x++) {
                        for(let y=0;y<8;y++) {
                            if(!this.piece_at(x, y, after_board)){continue;}
                            if(this.piece_at(x, y, after_board).player !== this.current_player){
                                // get valid movements for this piece in this possible future board
                                let after_valid_moves = this._get_valid_moves([x,y], after_board, true);
                                // the move is illegal if this piece can move to the kings position next
                                for(let q=0;q<after_valid_moves.length;q++){
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
        };

        this.clone_board = function (board){
            // returns a copy by value of the current state board
            let new_board = [];
            for (let i = 0; i < board.length; i++)
                new_board[i] = board[i].slice();
            return new_board;
        };

        this.invert_turn = function(){
            // inverts this.current player
            if (this.current_player === "white"){
                this.current_player = "black";
            }
            else{
                this.current_player = "white";
            }
        };

        this.piece_at = function (row, col, custom_board=null) {
            // returns
            if (custom_board){
                return custom_board[row][col];
            }
            else {
                return this.board[row][col];
            }

        };

        this.validate_move = function (dest_coords) {
            // destination coords must be included in list of valid moves created at dragstart
            for (let i=0;i<this.curr_valid_moves.length;i++){
                if(this.curr_valid_moves[i][0] === dest_coords[0] &&
                   this.curr_valid_moves[i][1] === dest_coords[1]){

                    this.move_counter++;

                    // apply_move2board board
                    this.board = this.apply_move2board(this.clone_board(this.board), this.curr_ori_coords, dest_coords);
                    // change turn
                    this.invert_turn();
                    // indicate move was successful
                    return true;
                }
            }
            return false;
        };

        this.apply_move2board = function (board, ori_coords, dest_coords) {
            // SPECIAL MOVES
            // check this is pawn double move and activate EN PASSANT flag
            let op = this.piece_at(...ori_coords, board);
            let dp = this.piece_at(...dest_coords, board);

            // en passant
            if (op.type === "pawn" && ori_coords[1] !== dest_coords[1] && !dp ) {
                let enpassant_coords = [dest_coords[0] - op.dir, dest_coords[1]];
                // kill en passant victim
                board[enpassant_coords[0]][enpassant_coords[1]] = null;

            }
            // pawn to queen transformation
            else if(op.type === "pawn" && dest_coords[0] === op.start_row + op.dir*6){
                op = new this.pieces.Queen(op.player)
            }

            // standard moves
            // move piece to destination
            board[dest_coords[0]][dest_coords[1]] = op;
            // remove piece from origin
            board[ori_coords[0]][ori_coords[1]] = null;


            return board
        };
    }
}


let game = new ChessGame();


