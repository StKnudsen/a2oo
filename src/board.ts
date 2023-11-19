export type Generator<T>= { next:() => T } 

export type Position = {
    row: number,
    col: number
}

export type Match<T> = {
    matched: T,
    positions: Position[]
}

export type BoardEvent<T> = {};

export type BoardListener<T> = (event: BoardEvent<T>) => void;

export class Board<T> {
    readonly width: number
    readonly height: number
    generator: Generator<T>
    listeners: BoardListener<T>[] = []
    matches: Match<T>[] = []
    board: T[][] = []

    // Constructor here
    constructor(generator: Generator<T>, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.generator = generator;

        this.generateBoard();

        while (this.findMatches()) {}
    }   

    addListener(listener: BoardListener<T>) {
        this.listeners.push(listener);
    }

    positions(): Position[] {
        let positions: Position[] = [];

        for(let row = 0; row < this.height; row++) {
            for(let col = 0; col < this.width; col++) {
                positions.push({row, col})
            }
        }

        return positions;
    }

    piece(p: Position): T | undefined {
        if (p.row < 0 || p.col < 0) return undefined;

        if (p.row < this.height && p.col < this.width) 
            return this.board[p.row][p.col];

        return undefined;
    }

    canMove(first: Position, second: Position): boolean {
        if (this.piece(first) === undefined || this.piece(second) === undefined)
            return false;

        if (first.row === second.row || first.col === second.col) {
            this.swap(first, second);
            const legalMove = this.hasMatch(first, second);
            this.swap(first, second);

            return legalMove;
        }

        return false;
    }

    
    move(first: Position, second: Position) {
        if (this.canMove(first, second)) {
            this.swap(first, second);

            while (this.findMatches()) {}
            // this.findMatches();
        }
    }

    private refill(): void {
        let didRefill = false;
        // clear matches
        this.matches.forEach(match => {
            match.positions.forEach(position => {
                this.board[position.row][position.col] = undefined;
            });
        });

        this.matches = [];

        // move tiles down
        for (let col = 0; col < this.width; col++) {
            for (let row = this.height - 1; row >= 0; row--) {
                if (this.board[row][col] === undefined) {
                    let newRow = row - 1;

                    while (newRow >= 0 && this.board[newRow][col] === undefined) {
                        newRow--;
                    }

                    if (newRow >= 0) {
                        this.board[row][col] = this.board[newRow][col];
                        this.board[newRow][col] = undefined;
                    }
                }
            }
        }

        // refill board
        for (let col = 0; col < this.width; col++) {
            for (let row = 0; row < this.height; row++) {
                if (this.board[row][col] === undefined) {
                    this.board[row][col] = this.generator.next();
                    didRefill = true;
                }
            }
        }

        if (didRefill)
            this.fireEvent({kind: 'Refill'});

        console.log(this.board);

    }

    private findMatches(): boolean {
        let foundMatch = false;

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width; col++) {
                let piece = this.piece({row, col});
                
                // check for row matches
                if (this.piece({row, col: col + 1}) === piece && this.piece({row, col: col + 2}) === piece) {
                    const match = {matched: piece, positions: [{row, col}, {row, col: col + 1}, {row, col: col + 2}]};
                    this.matches.push(match);

                    this.fireEvent({kind: 'Match', match}); 
                    foundMatch = true;
                }

                // check for col matches
                if (this.piece({row: row + 1, col}) === piece && this.piece({row: row + 2, col}) === piece) {
                    const match = {matched: piece, positions: [{row, col}, {row: row + 1, col}, {row: row + 2, col}]};
                    this.matches.push(match);

                    this.fireEvent({kind: 'Match', match}); 
                    foundMatch = true;
                }
            }
        }

        this.refill();

        return foundMatch;
    }

    private fireEvent(event: BoardEvent<T>): void {
        this.listeners.forEach(listener => listener(event));
    }

    private hasMatch(first: Position, second: Position): boolean {
        return this.checkRowMatch(first) || this.checkRowMatch(second) 
        || this.checkColMatch(first) || this.checkColMatch(second);
    }

    private checkRowMatch(p: Position): boolean {
        const piece = this.piece(p);

        for (let col = p.col - 2; col <= p.col + 2; col++) {
            if (col < 0 || col >= this.width) continue;

            if (this.piece({row: p.row, col}) === piece && 
                this.piece({row: p.row, col: col + 1}) === piece &&
                this.piece({row: p.row, col: col + 2}) === piece) 
                return true;
        }

        return false;
    }

    private checkColMatch(p: Position): boolean {
        const piece = this.piece(p);

        for (let row = p.row - 2; row <= p.row + 2; row++) {
            if (row < 0 || row >= this.height) continue;

            if (this.piece({row: row, col: p.col}) === piece && 
                this.piece({row: row + 1, col: p.col}) === piece &&
                this.piece({row: row + 2, col: p.col}) === piece) 
                return true;
        }

        return false;
    }

    private swap(first: Position, second: Position) {
        let temp = this.board[first.row][first.col];

        this.board[first.row][first.col] = this.board[second.row][second.col];
        this.board[second.row][second.col] = temp;
    }

    private generateBoard() {
        for(let i = 0; i < this.height; i++) {
            let row: T[] = []
            
            for(let j = 0; j < this.width; j++)
                row.push(this.generator.next())
            
            this.board.push(row)
        }
    }
}
