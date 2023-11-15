export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = {
    kind: "Match" | "Refill",
    // Match: { matched: 'A', 
    //     positions: 
    //      [{row: 0, col: 0}, {row: 0, col: 1},{row: 0, col: 2}]
    //     },
    // Refill: { 
    //     positions: 
    //     [{row: 0, col: 0}, {row: 0, col: 1},{row: 0, col: 2}]
    // }
  
};

export type BoardListener<T> = {
    // TODO: Define the listener interface here
};

export class Board<T> {
    readonly width: number
    readonly height: number
    readonly generator: Generator<T>
    boardPositions: Position[] = [];
    boardPieces: T[] = [];

    // Constructor here
    constructor(generator, width, height) {
        this.width = width;
        this.height = height;

        this.boardPositions = this.positions();
        this.boardPieces = this.generate(generator);
    }

    addListener(listener: BoardListener<T>) {
    }

    positions(): Position[] {
        let array = [];

        for (let i = 0; i < this.height; i++) {
            for (let j = 0; j < this.width; j++) {
                array.push({row: i, col: j});
            }
        }

        return array;
    }

    piece(p: Position): T | undefined {
        
        for (let i = 0; i < this.boardPositions.length; i++) {
            if (this.boardPositions[i].col === p.col && this.boardPositions[i].row === p.row) {
                return this.boardPieces[i];
            }
        }

        return undefined;
    }

    canMove(first: Position, second: Position): boolean {
        // return this.isNeighbour(first, second);
        if (first.col === second.col && first.row === second.row) {
            return false;
        }

        if (first.col < 0 || first.col >= this.width || 
            first.row < 0 || first.row >= this.height) {    
            return false;
        }

        if (second.col < 0 || second.col >= this.width || 
            second.row < 0 || second.row >= this.height) {    
            return false;
        }

        if (first.col === second.col || first.row === second.row) {
            
            // is there a match?
            return this.hasMatch(first, second);
        }
        
        return false
    }
    
    move(first: Position, second: Position) {
        if (this.canMove(first, second)) {
            let newBoardPieces = [];

            let firstPiece = this.piece(first);
            let secondPiece = this.piece(second);

            for (let i = 0; i < this.boardPositions.length; i++) {
                if (this.boardPositions[i].col === first.col && this.boardPositions[i].row === first.row) {
                    newBoardPieces.push(secondPiece);
                } else if (this.boardPositions[i].col === second.col && this.boardPositions[i].row === second.row) {
                    newBoardPieces.push(firstPiece);
                } else {
                    newBoardPieces.push(this.boardPieces[i]);
                }
            }

            this.boardPieces = newBoardPieces;
        }
    }

    generate(generator) {
        let array = [];

        for (let i = 0; i < this.boardPositions.length; i++) {
            array.push(generator.next());
        }

        return array;
    }

    hasMatch(first: Position, second: Position): boolean {
        return this.checkForHorizontalMatch(first, this.piece(second), second) 
        || this.checkForHorizontalMatch(second, this.piece(first), first)
        || this.checkForVerticalMatch(first, this.piece(second), second)
        || this.checkForVerticalMatch(second, this.piece(first), first);
    }

    checkForHorizontalMatch(to: Position, piece: T, from: Position) {
        // check for horizontal match
        let hRightMatches = 0;
        let hLeftMatches = 0;
        // console.log(this.boardPositions)
        console.log(this.boardPieces)
        
        for (let i = to.row; i < this.width; i++) {
            // console.log(this.piece({row: to.row, col: i}))
            if (this.piece({row: to.row, col: i}) === piece && 
                !(to.row === from.row && i === from.col)) {
                hRightMatches++;
            } 
        }

        for (let i = to.row; i > this.width; i--) {
            // console.log(this.piece({row: to.row, col: i}))
            if (this.piece({row: to.row, col: i}) === piece &&
                !(to.row === from.row && i === from.col)) {
                hLeftMatches++;
            } 
        }

        if (this.piece({row: to.row, col: (to.col + 1) }) === piece &&
            !(to.row === from.row && (to.col + 1) === from.col) &&
            this.piece({row: to.row, col: (to.col - 1) }) === piece &&
            !(to.row === from.row && (to.col - 1) === from.col)) {
                console.log("horizontal match: center" + "("+ hRightMatches + " " + hLeftMatches + ")")
            return true;
        }

        if (hRightMatches >= 2 || hLeftMatches >= 2) {
            console.log("horizontal match: " + hRightMatches + " " + hLeftMatches + "")
            return true;
        }
        return false;
    }

    checkForVerticalMatch(to: Position, piece: T, from: Position) {
        // check for vertical match
        let vUpMatches = 0;
        let vDownMatches = 0;
        // console.log(this.boardPositions)
        console.log(this.boardPieces)
        
        for (let i = to.col; i < this.height; i++) {
            // console.log(this.piece({row: to.row, col: i}))
            if (this.piece({row: i, col: to.col}) === piece && 
                !(i === from.row && to.col === from.col)) {
                console.log("vertical match: " + this.piece({row: i, col: to.col}))
                vUpMatches++;
            } 
        }

        for (let i = to.col; i > this.height; i--) {
            // console.log(this.piece({row: to.row, col: i}))
            if (this.piece({row: i, col: to.col}) === piece &&
                !(i === from.row && to.col === from.col)) {
                vDownMatches++;
            } 
        }

        if (this.piece({row: (to.row + 1), col: to.col }) === piece &&
            !(to.row + 1 === from.row && to.col === from.col) &&
            this.piece({row: (to.row - 1), col: to.col }) === piece &&
            !(to.row - 1 === from.row && to.col === from.col)
            ) {
                console.log("vertical match: center" + "(" + vUpMatches + " " + vDownMatches + ")")
            return true;
        }

        if (vUpMatches >= 2 || vDownMatches >= 2) {
            console.log("vertical match: " + vUpMatches + " " + vDownMatches + "")
            return true;
        }
        return false;
    }

    // isNeighbour(first: Position, second: Position): boolean {
    //     return Math.abs(first.col - second.col) + 
    //             Math.abs(first.row - second.row) === 1;
    // }
}
