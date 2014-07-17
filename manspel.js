
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
    reset: function () {
    	console.log(this);


        var self = this;
        var i;

        // Set fields
        for (i = 0; i < this.getSize(); ++i) {
            this._fields[i] = new Field();
        }

        // Initial setup
        // > Disabled fields
        var disabledFields = [
            // Lower right corner
            this.positionToIndex(-1, 0),
            this.positionToIndex(-2, 0),
            this.positionToIndex(-1, 1),
            // Lower left corner
            this.positionToIndex(0, -2),
            this.positionToIndex(0, -1),
            this.positionToIndex(1, -1)
        ].forEach(function (disabledIndex) {
        	console.log(disabledIndex, self.getField(disabledIndex));
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
    canMove: function (player, from, to) {
        return false;
    },
    move: function (player, from, to) {
        if (!this.canMove(player, from, to)) {
            return false;
        }

        this.trigger('move', player, from, to);
        return true;
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
        if (player === this._playerOne) {
            return this._playerTwo;
        } else if (player === this._playerTwo) {
            return this._playerOne;
        }
    },
    isFinished: function () {
        return  this._board.getPlayerFields(this._playerOne).length === 0 ||
                this._board.getPlayerFields(this._playerTwo).length === 0;
    },
    getWinner: function () {
        if (! this.isFinished()) {
            return;
        }
        if (this._board.getPlayerFields(this._playerTwo).length === 0) {
            return this._playerOne;
        } else {
            return this._playerTwo;
        }
    },
    getLoser: function () {
        if (this.isFinished()) {
            return this.otherPlayer(this.getWinner());
        }
    }
});
