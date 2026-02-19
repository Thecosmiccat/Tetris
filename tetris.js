const cvs = document.getElementById("tetris");
const ctx = cvs.getContext("2d");
const nextCvs = document.getElementById("next");
const nextCtx = nextCvs.getContext("2d");
const scoreElement = document.getElementById("score");
const controlButtons = document.querySelectorAll("[data-action]");
const winOverlay = document.getElementById("winOverlay");
const winMessage = document.getElementById("winMessage");
const winContinue = document.getElementById("winContinue");

const ROW = 20;
const COL = COLUMN = 10;
const SQ = squareSize = 25;
const NEXT_SQ = 20;
const NEXT_COL = nextCvs.width / NEXT_SQ;
const NEXT_ROW = nextCvs.height / NEXT_SQ;
const VACANT = "#0d0d0d"; // color of an empty square
const WIN_SCORE = 1000;

// draw a square
function drawSquare(x,y,color){
    ctx.fillStyle = color;
    ctx.fillRect(x*SQ,y*SQ,SQ,SQ);

    ctx.strokeStyle = "#1f1f1f";
    ctx.strokeRect(x*SQ,y*SQ,SQ,SQ);
}

function drawNextSquare(x,y,color){
    nextCtx.fillStyle = color;
    nextCtx.fillRect(x*NEXT_SQ,y*NEXT_SQ,NEXT_SQ,NEXT_SQ);

    nextCtx.strokeStyle = "#1f1f1f";
    nextCtx.strokeRect(x*NEXT_SQ,y*NEXT_SQ,NEXT_SQ,NEXT_SQ);
}

function clearNextBoard(){
    for(let r = 0; r < NEXT_ROW; r++){
        for(let c = 0; c < NEXT_COL; c++){
            drawNextSquare(c, r, VACANT);
        }
    }
}

// create the board

let board = [];
for( r = 0; r <ROW; r++){
    board[r] = [];
    for(c = 0; c < COL; c++){
        board[r][c] = VACANT;
    }
}

// draw the board
function drawBoard(){
    for( r = 0; r <ROW; r++){
        for(c = 0; c < COL; c++){
            drawSquare(c,r,board[r][c]);
        }
    }
}

drawBoard();

// the pieces and their colors

const PIECES = [
    [Z,"red"],
    [S,"green"],
    [T,"yellow"],
    [O,"blue"],
    [L,"purple"],
    [I,"cyan"],
    [J,"orange"]
];
const AMONG_US_PIECE = [AmongUs, "pink"];
const SECRET_CODE = "sussybaka";
const CLEAR_CODE = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "a", "b"];
const WIN_CODE = "idontwannalose";
const MAX_TYPED_CODE_LENGTH = Math.max(SECRET_CODE.length, WIN_CODE.length);
let typedKeys = "";
let amongUsMode = false;
let clearCodeIndex = 0;
let hasShownWin = false;

// generate random pieces

function randomPiece(){
    if(amongUsMode){
        return new Piece(AMONG_US_PIECE[0], AMONG_US_PIECE[1]);
    }

    let r = randomN = Math.floor(Math.random() * PIECES.length) // 0 -> 6
    return new Piece( PIECES[r][0],PIECES[r][1]);
}

let p = randomPiece();
let nextP = randomPiece();

function drawNextPiece(){
    clearNextBoard();

    const preview = nextP.tetromino[0];
    let minX = preview.length;
    let minY = preview.length;
    let maxX = 0;
    let maxY = 0;

    for(let r = 0; r < preview.length; r++){
        for(let c = 0; c < preview.length; c++){
            if(preview[r][c]){
                minX = Math.min(minX, c);
                minY = Math.min(minY, r);
                maxX = Math.max(maxX, c);
                maxY = Math.max(maxY, r);
            }
        }
    }

    const shapeW = maxX - minX + 1;
    const shapeH = maxY - minY + 1;
    const offsetX = Math.floor((NEXT_COL - shapeW) / 2) - minX;
    const offsetY = Math.floor((NEXT_ROW - shapeH) / 2) - minY;

    for(let r = 0; r < preview.length; r++){
        for(let c = 0; c < preview.length; c++){
            if(preview[r][c]){
                drawNextSquare(c + offsetX, r + offsetY, nextP.color);
            }
        }
    }
}
drawNextPiece();

// The Object Piece

function Piece(tetromino,color){
    this.tetromino = tetromino;
    this.color = color;
    
    this.tetrominoN = 0; // we start from the first pattern
    this.activeTetromino = this.tetromino[this.tetrominoN];
    
    // we need to control the pieces
    this.x = 3;
    this.y = -2;
}

// fill function

Piece.prototype.fill = function(color){
    for( r = 0; r < this.activeTetromino.length; r++){
        for(c = 0; c < this.activeTetromino.length; c++){
            // we draw only occupied squares
            if( this.activeTetromino[r][c]){
                drawSquare(this.x + c,this.y + r, color);
            }
        }
    }
}

// draw a piece to the board

Piece.prototype.draw = function(){
    this.fill(this.color);
}

// undraw a piece


Piece.prototype.unDraw = function(){
    this.fill(VACANT);
}

// move Down the piece

Piece.prototype.moveDown = function(){
    if(!this.collision(0,1,this.activeTetromino)){
        this.unDraw();
        this.y++;
        this.draw();
    }else{
        // we lock the piece and generate a new one
        this.lock();
        p = nextP;
        nextP = randomPiece();
        drawNextPiece();
        p.draw();
    }
    
}

// move Right the piece
Piece.prototype.moveRight = function(){
    if(!this.collision(1,0,this.activeTetromino)){
        this.unDraw();
        this.x++;
        this.draw();
    }
}

// move Left the piece
Piece.prototype.moveLeft = function(){
    if(!this.collision(-1,0,this.activeTetromino)){
        this.unDraw();
        this.x--;
        this.draw();
    }
}

// rotate the piece
Piece.prototype.rotate = function(){
    let nextPattern = this.tetromino[(this.tetrominoN + 1)%this.tetromino.length];
    let kick = 0;
    
    if(this.collision(0,0,nextPattern)){
        if(this.x > COL/2){
            // it's the right wall
            kick = -1; // we need to move the piece to the left
        }else{
            // it's the left wall
            kick = 1; // we need to move the piece to the right
        }
    }
    
    if(!this.collision(kick,0,nextPattern)){
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1)%this.tetromino.length; // (0+1)%4 => 1
        this.activeTetromino = this.tetromino[this.tetrominoN];
        this.draw();
    }
}

let score = 0;

Piece.prototype.lock = function(){
    for( r = 0; r < this.activeTetromino.length; r++){
        for(c = 0; c < this.activeTetromino.length; c++){
            // we skip the vacant squares
            if( !this.activeTetromino[r][c]){
                continue;
            }
            // pieces to lock on top = game over
            if(this.y + r < 0){
                alert("Game Over");
                // stop request animation frame
                gameOver = true;
                break;
            }
            // we lock the piece
            board[this.y+r][this.x+c] = this.color;
        }
    }
    // remove full rows
    for(r = 0; r < ROW; r++){
        let isRowFull = true;
        for( c = 0; c < COL; c++){
            isRowFull = isRowFull && (board[r][c] != VACANT);
        }
        if(isRowFull){
            // if the row is full
            // we move down all the rows above it
            for( y = r; y > 1; y--){
                for( c = 0; c < COL; c++){
                    board[y][c] = board[y-1][c];
                }
            }
            // the top row board[0][..] has no row above it
            for( c = 0; c < COL; c++){
                board[0][c] = VACANT;
            }
            // increment the score
            score += 10;
        }
    }
    // update the board
    drawBoard();
    
    // update the score
    scoreElement.innerHTML = score;
    checkWin();
}

// collision fucntion

Piece.prototype.collision = function(x,y,piece){
    for( r = 0; r < piece.length; r++){
        for(c = 0; c < piece.length; c++){
            // if the square is empty, we skip it
            if(!piece[r][c]){
                continue;
            }
            // coordinates of the piece after movement
            let newX = this.x + c + x;
            let newY = this.y + r + y;
            
            // conditions
            if(newX < 0 || newX >= COL || newY >= ROW){
                return true;
            }
            // skip newY < 0; board[-1] will crush our game
            if(newY < 0){
                continue;
            }
            // check if there is a locked piece alrady in place
            if( board[newY][newX] != VACANT){
                return true;
            }
        }
    }
    return false;
}

function clearEverything(){
    let clearedBlocks = 0;

    for(let r = 0; r < ROW; r++){
        for(let c = 0; c < COL; c++){
            if(board[r][c] != VACANT){
                clearedBlocks++;
            }
            board[r][c] = VACANT;
        }
    }

    // Normal scoring is 10 points per 10 blocks (1 point per block).
    score += clearedBlocks;
    scoreElement.innerHTML = score;
    checkWin();
    drawBoard();

    if(!gameOver){
        p.draw();
    }
}

// CONTROL the piece

document.addEventListener("keydown",CONTROL);

function CONTROL(event){
    if(gameOver){
        return;
    }

    const key = (event.key || "").toLowerCase();
    if(key){
        if(key === CLEAR_CODE[clearCodeIndex]){
            clearCodeIndex++;
            if(clearCodeIndex === CLEAR_CODE.length){
                clearEverything();
                clearCodeIndex = 0;
                alert("U like to cheat, don't you?");
                score = score > 100 ? score - 100 : 0; // penalize the player by reducing the score by 100, but not below 0
                scoreElement.innerHTML = score;
            }
        }else if(key === CLEAR_CODE[0]){
            clearCodeIndex = 1;
        }else{
            clearCodeIndex = 0;
        }
    }

    if(event.key && event.key.length === 1){
        typedKeys = (typedKeys + event.key.toLowerCase()).slice(-MAX_TYPED_CODE_LENGTH);

        if(!amongUsMode && typedKeys.endsWith(SECRET_CODE)){
            amongUsMode = true;
            nextP = randomPiece();
            drawNextPiece();
            alert("Among Us mode enabled");
        }

        if(typedKeys.endsWith(WIN_CODE)){
            score = 9999;
            scoreElement.innerHTML = score;
            showWinOverlay("Congratulations. You won but you suck at the game. Press continue to keep playing.");
        }
    }

    if([37, 38, 39, 40, 65, 68, 83, 87, 82].includes(event.keyCode)){
        event.preventDefault();
    }

    if(event.keyCode == 37 || event.keyCode == 65){
        p.moveLeft();
    }else if(event.keyCode == 38 || event.keyCode == 87 || event.keyCode == 82){
        p.rotate();
    }else if(event.keyCode == 39 || event.keyCode == 68){
        p.moveRight();
    }else if(event.keyCode == 40 || event.keyCode == 83){
        p.moveDown();
    }
}


function runAction(action){
    if(gameOver){
        return;
    }

    if(action === "left"){
        p.moveLeft();
    }else if(action === "rotate"){
        p.rotate();
    }else if(action === "right"){
        p.moveRight();
    }else if(action === "down"){
        p.moveDown();
    }
}

controlButtons.forEach((button) => {
    button.addEventListener("click", function(){
        runAction(button.dataset.action);
    });
});

if(winContinue){
    winContinue.addEventListener("click", function(){
        hideWinOverlay();
    });
}

p.draw();

// drop the piece every 1sec

let dropStart = Date.now();
let gameOver = false;

function showWinOverlay(message){
    if(hasShownWin){
        return;
    }

    hasShownWin = true;
    gameOver = true;

    if(winMessage){
        winMessage.textContent = message || "Congratulations! You win the game! Press continue to keep playing.";
    }

    if(winOverlay){
        winOverlay.classList.add("show");
        winOverlay.setAttribute("aria-hidden", "false");
    }
}

function hideWinOverlay(){
    if(winOverlay){
        winOverlay.classList.remove("show");
        winOverlay.setAttribute("aria-hidden", "true");
    }

    gameOver = false;
    dropStart = Date.now();
    requestAnimationFrame(drop);
}

function checkWin(){
    if(score > WIN_SCORE){
        showWinOverlay("You scored over 1000 points. Press continue to keep going.");
    }
}

function drop(){
    let now = Date.now();
    let delta = now - dropStart;
    if(delta > 1000){
        p.moveDown();
        dropStart = Date.now();
    }
    if( !gameOver){
        requestAnimationFrame(drop);
    }
}

drop();



















