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
    kind: "Match";
    match: Match<T>;
  } | {
    kind: "Refill";
  };

export type BoardListener<T> = (event: BoardEvent<T>) => void;

export class Board<T> {
    readonly generator: Generator<T>
    readonly height: number
    readonly width: number
    listeners: BoardListener<T>[] = [];
    matches: Match<T>[] = [];
    board: T[][] = [];

    constructor(generator: Generator<T>, width: number, height: number) {
        this.width = width;
        this.height = height;
        this.generator = generator;
        
        this.board = this.generate(generator);

        while (this.findMatch()) {
            this.executeMatch();
        }
    }

    addListener(listener: BoardListener<T>) {
        this.listeners.push(listener);
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
        if (p.row < 0 || p.col < 0) {
            return undefined;
        }

        if (p.row < this.height && p.col < this.width) {
            return this.board[p.row][p.col];
        }

        return undefined;
    }

    canMove(first: Position, second: Position): boolean {
        if (this.piece(first) === undefined 
            || this.piece(second) === undefined
            || this.piece(first) === this.piece(second)) {
            return false;
        }

        if (first.row === second.row || first.col === second.col) {
            
            this.swap(first, second);

            let canSwap: boolean = this.hasMatch(first, second);

            this.swap(first, second);

            return canSwap;
        }

        return false;
    }
    
    move(first: Position, second: Position) {
        if (this.canMove(first, second)) {
            this.swap(first, second);

            while (this.findMatch()) {
                this.executeMatch();
            }
        }
    }

    executeMatch(): void {
        this.matches.forEach(match => {
            const p1 = match.positions[0];
            const p2 = match.positions[1];
            const p3 = match.positions[2];

            this.board[p1.row][p1.col] = undefined;
            this.board[p2.row][p2.col] = undefined;
            this.board[p3.row][p3.col] = undefined;
        });

        this.matches = [];
        this.notify({kind: "Refill"});
        this.refill();
    }

    refill(): void {
        for (let col = 0; col < this.width; col++) {
            for (let row = this.height - 1; row >= 0; row--) {
                if (this.board[row][col] === undefined) {
                    let index = row - 1;

                    while (index >= 0 && this.board[index][col] === undefined) {
                        index--;
                    }

                    if (index >= 0) {
                        this.board[row][col] = this.board[index][col];
                        this.board[index][col] = undefined;
                    }
                }
            }
        }

        for (let col = 0; col < this.width; col++) {
            for (let row = 0; row < this.height; row++) {
                if (this.board[row][col] === undefined) {
                    this.board[row][col] = this.generator.next();
                }
            }
        }
    }

    findMatch(): boolean {
        let foundMatch: boolean = false;

        for (let row = 0; row < this.height; row++) {
            for (let col = 0; col < this.width - 2; col++) {
                if (!foundMatch) {
                    foundMatch = this.findHorizontalMatch(row, col);
                }
            }
        }

        for (let col = 0; col < this.width; col++) {
            for (let row = 0; row < this.height - 2; row++) {
                if (!foundMatch) {
                    foundMatch = this.findVerticalMatch(row, col);
                }
            }
        }

        return foundMatch;
    }

    findVerticalMatch(row: number, col: number): boolean {
        const p1 = {row: row, col: col};
        const p2 = {row: row + 1, col: col};
        const p3 = {row: row + 2, col: col};

        const piece1 = this.piece(p1);
        const piece2 = this.piece(p2);
        const piece3 = this.piece(p3);

        if (piece1 === piece2 && piece2 === piece3) {
            const positions = [p1, p2, p3];
            const match = {matched: piece1, positions: positions};

            this.notify({kind: "Match", match: match});
            this.matches.push(match);

            return true;
        }

        return false;
    }

    findHorizontalMatch(row: number, col: number): boolean {
        const p1 = {row: row, col: col};
        const p2 = {row: row, col: col + 1};
        const p3 = {row: row, col: col + 2};

        const piece1 = this.piece(p1);
        const piece2 = this.piece(p2);
        const piece3 = this.piece(p3);

        if (piece1 === piece2 && piece2 === piece3) {
            const positions = [p1, p2, p3];
            const match = {matched: piece1, positions: positions};

            this.notify({kind: "Match", match: match});
            this.matches.push(match);

            return true;
        }

        return false;
    }

    notify(event: BoardEvent<T>): void {
        console.log(event);
        this.listeners.forEach(listener => listener(event));
    }
    
    swap(first: Position, second: Position) {
        const tempFirst = this.piece(first);
        const tempSecond = this.piece(second);

        this.board[first.row][first.col] = tempSecond;
        this.board[second.row][second.col] = tempFirst;
    }

    generate(generator) {
        let array = [];

        for (let i = 0; i < this.height; i++) {
            let row = [];
            for (let j = 0; j < this.width; j++) {
                row.push(generator.next());
            }
            array.push(row);
        }

        return array;
    }

    hasMatch(first: Position, second: Position): boolean {
        return this.checkHorizontalMatch(first) 
        || this.checkHorizontalMatch(second)
        || this.checkForVerticalMatch(first)
        || this.checkForVerticalMatch(second);
    }

    checkHorizontalMatch(p: Position) {
        let piece = this.piece(p);

        for (let i = p.col - 2; i <= p.col + 2; i++) {
            if (i >= 0 && i + 2 < this.height) {
                if (this.board[p.row][i] === piece
                    && this.board[p.row][i + 1] === piece
                    && this.board[p.row][i + 2] === piece) {
                        return true;
                    }
            }
       }

       return false;
    }

    checkForVerticalMatch(p: Position) {
        let piece = this.piece(p);

        for (let i = p.row - 2; i <= p.row + 2; i++) {
            if (i >= 0 && i + 2 < this.width) {
                if (this.board[i][p.col] === piece
                    && this.board[i + 1][p.col] === piece
                    && this.board[i + 2][p.col] === piece) {
                        return true;
                    }
            }
        }

        return false;
    }
}
