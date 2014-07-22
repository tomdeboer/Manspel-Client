/*jslint browser: true, devel: true, node: true, nomen: true, unparam: true */
/*global primish, emitter, Player, Field */
var Board = primish({
    implement: [emitter],
    constructor: function (game, width, height) {
        this._game   = game;
        this._width  = width;
        this._height = height;
        this._fields = [];
        this.reset();
    },
    getSize: function () {
        return this._width * this._height;
    },
    getField: function (index) {
        return this._fields[index];
    },
    getFieldAtPosition: function (x, y) {
        return this.getField(this.positionToIndex(x, y));
    },
    fieldHasPlayer: function (index) {
        return this._fields[index].getPlayer() instanceof Player;
    },
    getPlayerFields: function (player) {
        var fields = [];
        var i, field;

        for (i = 0; i < this._fields.length; ++i) {
            field = this._fields[i];
            if (field.getPlayer() === player) {
                fields.push(field);
            }
        }

        return fields;
    },
    positionToIndex: function (x, y) {
        if (x < 0) { x += this._width; }
        if (y < 0) { y += this._height; }
        return y * this._width + x;
    },
    indexToPosition: function (index) {
        return {
            x: Math.floor(index / this._width),
            y: index % this._width
        };
    },
    reset: function () {
        var self = this;
        var i;

        // Set fields
        for (i = 0; i < this.getSize(); ++i) {
            this._fields[i] = new Field();
        }

        // Initial setup
        // > Disabled fields
        [
            // Lower right corner
            this.positionToIndex(-1, 0),
            this.positionToIndex(-2, 0),
            this.positionToIndex(-1, 1),
            // Lower left corner
            this.positionToIndex(0, -2),
            this.positionToIndex(0, -1),
            this.positionToIndex(1, -1)
        ].forEach(function (disabledIndex) {
            self.getField(disabledIndex).setDisabled(true);
        });

        // > Player fields
        // TODO: Make dynamic, based on board size
        function fillPlayerFields(player, inverted) {
            var j, index;
            var size = self.getSize();
            var fields = [2, 3, 11, 12, 13, 20, 21, 22, 23, 30, 31, 32];

            for (j = 0; j < fields.length; ++j) {
                index = fields[j];

                if (inverted) {
                    index = size - 1 - index;
                }

                self._fields[index].setPlayer(player);
            }
        }

        fillPlayerFields(this._game.getPlayerOne());
        fillPlayerFields(this._game.getPlayerTwo(), true);
    },
    move: function (player, from, to, _simulate) {
        var simulate = !!_simulate; // Cast to boolean

        var fromField    = this.getField(from);
        var toField      = this.getField(to);

        var fromPosition = this.indexToPosition(from);
        var toPosition   = this.indexToPosition(to);

        if (fromField.getPlayer() !== player || !toField || toField.getPlayer()) {
            // Field is invalid or already taken
            return false;
        }

        var i; // Iterator

        // Set direction to +1 or -1 if target's x is higher or lower than source's x
        var xd = toPosition.x > fromPosition.x ? 1 : -1, // X direction
            yd = toPosition.y > fromPosition.y ? 1 : -1; // Y direction

        if (fromPosition.x === toPosition.x) {
            // Moving along the same x-axis, starting one field ahead

            var x, // X position 
                y, // Y position
                f, // Field
                p; // Player at field


            for (i = fromPosition.y + yd; i !== toPosition.y; i += yd) {
                x = toPosition.x;                  // X position 
                y = i;                             // Y position
                f = this.getFieldAtPosition(x, y); // Field
                p = f.getPlayer();                 // Player at field

                if (p === null) {
                    // Field is empty; if a field between from and to on the same axis,
                    // has no player on it, the player can't skip over it
                    return false;
                }
                if (p !== player && simulate === false) {
                    // Jumping over another player; kills it
                    f.setPlayer(null);
                }
            }
            this._game.turn();

            return true;
        }
        if (fromPosition.y === toPosition.y) {
            // Moving along the same Y-axis

            for (i = fromPosition.x + xd; i !== toPosition.x; i += xd) {
                // If a field between from and to on the same axis has no player on it, you can't skip over it
                if (this.getFieldAtPosition(i, toPosition.y).getPlayer() === null) {
                    return false;
                }
            }
            this._game.turn();

            return true;
        }
        if (Math.abs(fromPosition.x - toPosition.x) === Math.abs(fromPosition.y - toPosition.y)) {
            // Moving diagonally
            for (i = Math.abs(fromPosition.x - toPosition.x) - 1; i !== 0; i -= 1) {
                // If a field between from and to on the same axis has no player on it, you can't skip over it
                if (this.getFieldAtPosition(fromPosition.x + i * xd, fromPosition.y + i * yd).getPlayer() === null) {
                    return false;
                }
            }
            this._game.turn();

            return true;
        }

        return false;
    },
    canMove: function (player, from, to) {
        return this.move(player, from, to, 'simulate');
    }
});

var Player = primish({
    constructor: function (game, number) {
        this._game   = game;
        this._number = number;
    },
    getNumber: function () {
        return this._number;
    },
    isTurn: function () {
        return this._game.getPlayerTurn() === this;
    },
    canMove: function (from, to) {
        return this._game.getBoard().canMove(this, from, to);
    }
});

var Field = primish({
    constructor: function () {
        this._player   = null;
        this._disabled = false;
    },
    setPlayer: function (player) {
        this._player = player;
    },
    getDisabled: function (disabled) {
        return this._disabled;
    },
    setDisabled: function (disabled) {
        this._disabled = disabled;
    },
    getPlayer: function () {
        return this._player;
    },
    isDisabled: function () {
        return this._disabled;
    }
});

var Manspel = primish({
    implement: [emitter],
    constructor: function () {
        this._playerOne  = new Player(this, 1);
        this._playerTwo  = new Player(this, 2);
        this._playerTurn = this._playerOne;
        this._board      = new Board(this, 10, 10);
    },
    getBoard: function () {
        return this._board;
    },
    getPlayerOne: function () {
        return this._playerOne;
    },
    getPlayerTwo: function () {
        return this._playerTwo;
    },
    getPlayerTurn: function () {
        return this._playerTurn;
    },
    otherPlayer: function (player) {
        if (player === undefined) {
            return this.otherPlayer(this._playerTurn);
        }

        return (player === this._playerOne) ? this._playerTwo : this._playerOne;
    },
    isFinished: function () {
        return this._board.getPlayerFields(this._playerOne).length === 0 ||
               this._board.getPlayerFields(this._playerTwo).length === 0;
    },
    getWinner: function () {
        if (!this.isFinished()) {
            return;
        }

        return (this._board.getPlayerFields(this._playerTwo).length === 0) ? this._playerOne : this._playerTwo;
    },
    getLoser: function () {
        if (this.isFinished()) {
            return this.otherPlayer(this.getWinner());
        }
    },
    turn: function () {
        this._playerTurn = this.otherPayer();
        this.trigger('turn');
    }
});
