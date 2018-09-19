var board;
window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};
$(document).ready(function () {
    newGame('easy');
    $('#difficulty li').click(function (eventObject) {
        $('#difficulty li').removeClass('selected');
        $(this).addClass('selected');
        var difficulty = $(this).attr('id');
        newGame(difficulty);
    });
    $('#new-game').click(function (eventObject) {
        var difficulty = $('#difficulty li.selected').attr('id');
        $("#myModal").hide();
        newGame(difficulty);
    });
    $('#close-modal').click(function () {
         $("#myModal").hide();
    });
});
function newGame(difficulty) {
    switch (difficulty) {
        case 'easy':
            board = new Board(7,7);
            break;
        case 'hard':
            board = new Board(13, 13);
            break;
        case 'medium':
            board = new Board(10, 10);
            break;
        default:
            board = new Board(10, 10);
            break;
    }
    board.render();
    board.gameOver = false;

    $('.space').mousedown(function (eventObject) {
        if(eventObject.which == 1) {
            board.click(eventObject.target);
        } else if (eventObject.which == 3) {
            eventObject.preventDefault();
            board.flag(eventObject.target);
        }
    });

    return board;
}

//Space Object
function Space(explored, holds, flagged) {
    this.explored = explored;
    this.holds = holds;
    this.flagged = flagged;
}
// Board Object
function Board(row, col){
    this.row = row;
    this.col = col;   
    this.meta_board = [];   // 2 dim array used to store the information of the board 
    this.gameOver = false;
    this.cellsCleared = 0;
    this.bombCount = 0;
    
    
    var countBombs = function(row, col) {
        let sum = 0;
        if (this.meta_board[row][col].holds == -1) {
            return -1;
        }
        sum +=  getValue.call(this, row - 1, col - 1) + 
                getValue.call(this, row - 1, col) + 
                getValue.call(this, row - 1, col + 1) + 
                getValue.call(this, row, col - 1) + 
                getValue.call(this, row, col + 1) + 
                getValue.call(this, row + 1, col - 1) + 
                getValue.call(this, row + 1, col) + 
                getValue.call(this, row + 1, col + 1);

        return sum;
    }

    function getValue(row, col) {
        if (row < 0 || row >= this.row || col < 0 || col >= this.col) {
            return 0;
        } else if(this.meta_board[row][col].holds == -1){
            return 1;
        } else {
            return 0;
        }
    }
    
    this.render = function() {
        var boxes = "";
        for (i = 1; i <= row; i++) {
            for (j = 1; j <= col; j++) {
                boxes = boxes.concat('<div class="space" data-row="' + i + '" data-col="' + j + '">&nbsp;</div>');
            }
            boxes = boxes.concat('<br />');
        }
        $('#game-board').empty();
        $('#game-board').append(boxes);
    }

    this.click = function (target_elem) {
        var row = $(target_elem).attr("data-row");
        var col = $(target_elem).attr("data-col");

        if(this.meta_board[row-1][col-1].flagged) {
            return;
        }
        if (this.gameOver === true || this.meta_board[row - 1][col - 1].explored) {
            return;
        }
        if (this.meta_board[row - 1][col - 1].holds == -1) {
           this.bombFound();
        } else if (this.meta_board[row - 1][col - 1].holds == 0) {
            this.clearCell(row - 1, col - 1);
            uncoverSurrounding.call(this, row - 1, col - 1);
        } else {
            this.clearCell(row - 1, col - 1);
        }
    }
    this.flag = function(target_elem) {
        if($(target_elem).hasClass('fa-flag')) {
            target_elem = $(target_elem).parent()[0];
        }
        var row = $(target_elem).attr("data-row");
        var col = $(target_elem).attr("data-col");
        if (this.gameOver === true || this.meta_board[row-1][col-1].explored) {
            return;
        }
        if(this.meta_board[row - 1][col - 1].flagged) {
            this.meta_board[row - 1][col - 1].flagged = false;
            $(target_elem).html('&nbsp;');
        } else {
            this.meta_board[row - 1][col - 1].flagged = true;
            $(target_elem).html('<i class="fas fa-flag" style="line-height: unset !important;"></i>'); 
        }
    }

    this.clearCell = function (row, col) {
        var dom_target = 'div[data-row="' + (row + 1) + '"][data-col="' + (col + 1) + '"]';
        $(dom_target).addClass('safe');
        if( this.meta_board[row][col].holds > 0) {
            $(dom_target).text(this.meta_board[row][col].holds);
        } else {
            $(dom_target).html('&nbsp');
        }
        this.cellsCleared++;
        this.meta_board[row][col].explored = true;
        checkForSuccess.call(this);
    }
    this.bombFound = function() {
        for (i = 0; i < this.row; i++) {
            for (j = 0; j < this.col; j++) {
                if (this.meta_board[i][j].holds == -1) {
                    var dom_target = 'div[data-row="' + (i + 1) + '"][data-col="' + (j + 1) + '"]';
                    $(dom_target).html('<i class="fa fa-bomb" style="line-height: unset !important;"></i>');
                }
            }
        }
        this.gameOver = true;
        $('#message').text("Sorry! You lost the game!!");
        setTimeout(function(){ $("#myModal").show(); }, 1000);
        
    }

    function checkForSuccess(){
        if(this.row * this.col - this.cellsCleared === this.bombCount ) {
            for (i = 0; i < this.row; i++) {
                for (j = 0; j < this.col; j++) {
                    if (this.meta_board[i][j].holds == -1) {
                        var bomb_target = 'div[data-row="' + (i + 1) + '"][data-col="' + (j + 1) + '"]';
                        $(bomb_target).html('<i class="far fa-grin-hearts" style="line-height: unset !important;"></i>');
                    }
                }
            }
            this.gameOver = true;
            $('#message').text("Congratulations! You won the game!!");
            setTimeout(function(){ $("#myModal").show(); }, 1000);
        }
    }

    function uncoverSurrounding(row, col) {
        checkCell.call(this, row - 1, col - 1); checkCell.call(this, row - 1, col); checkCell.call(this, row - 1, col + 1);
        checkCell.call(this, row, col - 1); checkCell.call(this, row, col + 1);
        checkCell.call(this, row + 1, col - 1); checkCell.call(this, row + 1, col); checkCell.call(this, row + 1, col + 1);
        checkForSuccess.call(this);
    }

    function checkCell(row, col) {
        if (row < 0 || row >= this.row || col < 0 || col >= this.col || this.meta_board[row][col].explored == true) {
            return;
        } else if (this.meta_board[row][col].holds >= 0) {
            this.clearCell(row, col);
            if (this.meta_board[row][col].holds == 0) {
                uncoverSurrounding.call(this, row, col);
                return;
            }
        }
    }
    //Initializing the Game with bombs and calculating numbers for cells
       if (this.meta_board !== undefined) {
        this.meta_board = new Array(this.row);
        for (i = 0; i < this.row; i++) {
            this.meta_board[i] = new Array(this.col);
            for (j = 0; j < this.col; j++) {
                this.meta_board[i][j] = new Space(false, 0, false);
            }
        }
        switch(this.row) {
            case 7 : this.bombCount = 7; break;
            case 10 : this.bombCount = 12; break;
            case 13 : this.bombCount = 20; break;
        }
        $('#value').html(this.bombCount);
        var max = this.row * this.col;
        var generatedList = [];
        generatedList.push(Math.round(Math.random() * (max - 1)));
        for(k = 0 ; generatedList.length < this.bombCount ; k++ ) {
            let bombIndex = Math.round(Math.random() * (max - 1));
            let redundant = false;
            for( l = 0 ; l < generatedList.length ; l++) {
                if(bombIndex === generatedList[l]) {
                    redundant = true;
                } 
            }
            if(!redundant) {
              generatedList.push(bombIndex);  
            }
        }
        for (i = 0; i < this.bombCount; i++) {
            var x = Math.floor(generatedList[i] / this.col);
            var y = generatedList[i] % this.col;
            this.meta_board[x][y] = new Space(false, -1, false);
        }

        for (i = 0; i < this.row; i++) {
            for (j = 0; j < this.col; j++) {
                this.meta_board[i][j].holds = countBombs.call(this, i, j);
            }
        }
    }
}




