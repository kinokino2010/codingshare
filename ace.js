(function(exports){
    var comparePoints = function(p1, p2) {
        return p1.row - p2.row || p1.column - p2.column;
    };
    var Range = function(startRow, startColumn, endRow, endColumn) {
        this.start = {
            row: startRow,
            column: startColumn
        };

        this.end = {
            row: endRow,
            column: endColumn
        };
    };

    (function() {
        this.isEqual = function(range) {
            return this.start.row === range.start.row &&
                this.end.row === range.end.row &&
                this.start.column === range.start.column &&
                this.end.column === range.end.column;
        };
        this.toString = function() {
            return ("Range: [" + this.start.row + "/" + this.start.column +
                "] -> [" + this.end.row + "/" + this.end.column + "]");
        };

        this.contains = function(row, column) {
            return this.compare(row, column) == 0;
        };
        this.compareRange = function(range) {
            var cmp,
                end = range.end,
                start = range.start;

            cmp = this.compare(end.row, end.column);
            if (cmp == 1) {
                cmp = this.compare(start.row, start.column);
                if (cmp == 1) {
                    return 2;
                } else if (cmp == 0) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (cmp == -1) {
                return -2;
            } else {
                cmp = this.compare(start.row, start.column);
                if (cmp == -1) {
                    return -1;
                } else if (cmp == 1) {
                    return 42;
                } else {
                    return 0;
                }
            }
        };
        this.comparePoint = function(p) {
            return this.compare(p.row, p.column);
        };
        this.containsRange = function(range) {
            return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
        };
        this.intersects = function(range) {
            var cmp = this.compareRange(range);
            return (cmp == -1 || cmp == 0 || cmp == 1);
        };
        this.isEnd = function(row, column) {
            return this.end.row == row && this.end.column == column;
        };
        this.isStart = function(row, column) {
            return this.start.row == row && this.start.column == column;
        };
        this.setStart = function(row, column) {
            if (typeof row == "object") {
                this.start.column = row.column;
                this.start.row = row.row;
            } else {
                this.start.row = row;
                this.start.column = column;
            }
        };
        this.setEnd = function(row, column) {
            if (typeof row == "object") {
                this.end.column = row.column;
                this.end.row = row.row;
            } else {
                this.end.row = row;
                this.end.column = column;
            }
        };
        this.inside = function(row, column) {
            if (this.compare(row, column) == 0) {
                if (this.isEnd(row, column) || this.isStart(row, column)) {
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        };
        this.insideStart = function(row, column) {
            if (this.compare(row, column) == 0) {
                if (this.isEnd(row, column)) {
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        };
        this.insideEnd = function(row, column) {
            if (this.compare(row, column) == 0) {
                if (this.isStart(row, column)) {
                    return false;
                } else {
                    return true;
                }
            }
            return false;
        };
        this.compare = function(row, column) {
            if (!this.isMultiLine()) {
                if (row === this.start.row) {
                    return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
                };
            }

            if (row < this.start.row)
                return -1;

            if (row > this.end.row)
                return 1;

            if (this.start.row === row)
                return column >= this.start.column ? 0 : -1;

            if (this.end.row === row)
                return column <= this.end.column ? 0 : 1;

            return 0;
        };
        this.compareStart = function(row, column) {
            if (this.start.row == row && this.start.column == column) {
                return -1;
            } else {
                return this.compare(row, column);
            }
        };
        this.compareEnd = function(row, column) {
            if (this.end.row == row && this.end.column == column) {
                return 1;
            } else {
                return this.compare(row, column);
            }
        };
        this.compareInside = function(row, column) {
            if (this.end.row == row && this.end.column == column) {
                return 1;
            } else if (this.start.row == row && this.start.column == column) {
                return -1;
            } else {
                return this.compare(row, column);
            }
        };
        this.clipRows = function(firstRow, lastRow) {
            if (this.end.row > lastRow)
                var end = {row: lastRow + 1, column: 0};
            else if (this.end.row < firstRow)
                var end = {row: firstRow, column: 0};

            if (this.start.row > lastRow)
                var start = {row: lastRow + 1, column: 0};
            else if (this.start.row < firstRow)
                var start = {row: firstRow, column: 0};

            return Range.fromPoints(start || this.start, end || this.end);
        };
        this.extend = function(row, column) {
            var cmp = this.compare(row, column);

            if (cmp == 0)
                return this;
            else if (cmp == -1)
                var start = {row: row, column: column};
            else
                var end = {row: row, column: column};

            return Range.fromPoints(start || this.start, end || this.end);
        };

        this.isEmpty = function() {
            return (this.start.row === this.end.row && this.start.column === this.end.column);
        };
        this.isMultiLine = function() {
            return (this.start.row !== this.end.row);
        };
        this.clone = function() {
            return Range.fromPoints(this.start, this.end);
        };
        this.collapseRows = function() {
            if (this.end.column == 0)
                return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
            else
                return new Range(this.start.row, 0, this.end.row, 0)
        };
        this.toScreenRange = function(session) {
            var screenPosStart = session.documentToScreenPosition(this.start);
            var screenPosEnd = session.documentToScreenPosition(this.end);

            return new Range(
                screenPosStart.row, screenPosStart.column,
                screenPosEnd.row, screenPosEnd.column
            );
        };
        this.moveBy = function(row, column) {
            this.start.row += row;
            this.start.column += column;
            this.end.row += row;
            this.end.column += column;
        };

    }).call(Range.prototype);
    Range.fromPoints = function(start, end) {
        return new Range(start.row, start.column, end.row, end.column);
    };
    Range.comparePoints = comparePoints;

    Range.comparePoints = function(p1, p2) {
        return p1.row - p2.row || p1.column - p2.column;
    };

    exports.Range = Range;

    var Document = function(text) {
        this.$lines = [];
        if (text.length == 0) {
            this.$lines = [""];
        } else if (Array.isArray(text)) {
            this._insertLines(0, text);
        } else {
            this.insert({row: 0, column:0}, text);
        }
    };

    (function() {

        // oop.implement(this, EventEmitter);
        // this.setValue = function(text) {
        //     var len = this.getLength();
        //     this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        //     this.insert({row: 0, column:0}, text);
        // };
        this.getValue = function() {
            return this.getAllLines().join(this.getNewLineCharacter());
        };
        // this.createAnchor = function(row, column) {
        //     return new Anchor(this, row, column);
        // };
        if ("aaa".split(/a/).length == 0)
            this.$split = function(text) {
                return text.replace(/\r\n|\r/g, "\n").split("\n");
            }
        else
            this.$split = function(text) {
                return text.split(/\r\n|\r|\n/);
            };


        this.$detectNewLine = function(text) {
            var match = text.match(/^.*?(\r\n|\r|\n)/m);
            this.$autoNewLine = match ? match[1] : "\n";
        };
        this.getNewLineCharacter = function() {
            switch (this.$newLineMode) {
              case "windows":
                return "\r\n";
              case "unix":
                return "\n";
              default:
                return this.$autoNewLine;
            }
        };

        this.$autoNewLine = "\n";
        this.$newLineMode = "auto";
        // this.setNewLineMode = function(newLineMode) {
        //     if (this.$newLineMode === newLineMode)
        //         return;

        //     this.$newLineMode = newLineMode;
        // };
        // this.getNewLineMode = function() {
        //     return this.$newLineMode;
        // };
        this.isNewLine = function(text) {
            return (text == "\r\n" || text == "\r" || text == "\n");
        };
        this.getLine = function(row) {
            return this.$lines[row] || "";
        };
        this.getLines = function(firstRow, lastRow) {
            return this.$lines.slice(firstRow, lastRow + 1);
        };
        this.getAllLines = function() {
            return this.getLines(0, this.getLength());
        };
        this.getLength = function() {
            return this.$lines.length;
        };
        // this.getTextRange = function(range) {
        //     if (range.start.row == range.end.row) {
        //         return this.getLine(range.start.row)
        //             .substring(range.start.column, range.end.column);
        //     }
        //     var lines = this.getLines(range.start.row, range.end.row);
        //     lines[0] = (lines[0] || "").substring(range.start.column);
        //     var l = lines.length - 1;
        //     if (range.end.row - range.start.row == l)
        //         lines[l] = lines[l].substring(0, range.end.column);
        //     return lines.join(this.getNewLineCharacter());
        // };

        this.$clipPosition = function(position) {
            var length = this.getLength();
            if (position.row >= length) {
                position.row = Math.max(0, length - 1);
                position.column = this.getLine(length-1).length;
            } else if (position.row < 0)
                position.row = 0;
            return position;
        };
        this.insert = function(position, text) {
            if (!text || text.length === 0)
                return position;

            position = this.$clipPosition(position);
            if (this.getLength() <= 1)
                this.$detectNewLine(text);

            var lines = this.$split(text);
            var firstLine = lines.splice(0, 1)[0];
            var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

            position = this.insertInLine(position, firstLine);
            if (lastLine !== null) {
                position = this.insertNewLine(position); // terminate first line
                position = this._insertLines(position.row, lines);
                position = this.insertInLine(position, lastLine || "");
            }
            return position;
        };
        this.insertLines = function(row, lines) {
            if (row >= this.getLength())
                return this.insert({row: row, column: 0}, "\n" + lines.join("\n"));
            return this._insertLines(Math.max(row, 0), lines);
        };
        this._insertLines = function(row, lines) {
            if (lines.length == 0)
                return {row: row, column: 0};
            if (lines.length > 0xFFFF) {
                var end = this._insertLines(row, lines.slice(0xFFFF));
                lines = lines.slice(0, 0xFFFF);
            }

            var args = [row, 0];
            args.push.apply(args, lines);
            this.$lines.splice.apply(this.$lines, args);

            var range = new Range(row, 0, row + lines.length, 0);
            var delta = {
                action: "insertLines",
                range: range,
                lines: lines
            };
//            this._emit("change", { data: delta });
            return end || range.end;
        };
        this.insertNewLine = function(position) {
            position = this.$clipPosition(position);
            var line = this.$lines[position.row] || "";

            this.$lines[position.row] = line.substring(0, position.column);
            this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

            var end = {
                row : position.row + 1,
                column : 0
            };

            var delta = {
                action: "insertText",
                range: Range.fromPoints(position, end),
                text: this.getNewLineCharacter()
            };
//            this._emit("change", { data: delta });

            return end;
        };
        this.insertInLine = function(position, text) {
            if (text.length == 0)
                return position;

            var line = this.$lines[position.row] || "";

            this.$lines[position.row] = line.substring(0, position.column) + text
                    + line.substring(position.column);

            var end = {
                row : position.row,
                column : position.column + text.length
            };

            var delta = {
                action: "insertText",
                range: Range.fromPoints(position, end),
                text: text
            };
//            this._emit("change", { data: delta });

            return end;
        };
        this.remove = function(range) {
            if (!range instanceof Range)
                range = Range.fromPoints(range.start, range.end);
            range.start = this.$clipPosition(range.start);
            range.end = this.$clipPosition(range.end);

            if (range.isEmpty())
                return range.start;

            var firstRow = range.start.row;
            var lastRow = range.end.row;

            if (range.isMultiLine()) {
                var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
                var lastFullRow = lastRow - 1;

                if (range.end.column > 0)
                    this.removeInLine(lastRow, 0, range.end.column);

                if (lastFullRow >= firstFullRow)
                    this._removeLines(firstFullRow, lastFullRow);

                if (firstFullRow != firstRow) {
                    this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                    this.removeNewLine(range.start.row);
                }
            }
            else {
                this.removeInLine(firstRow, range.start.column, range.end.column);
            }
            return range.start;
        };
        this.removeInLine = function(row, startColumn, endColumn) {
            if (startColumn == endColumn)
                return;

            var range = new Range(row, startColumn, row, endColumn);
            var line = this.getLine(row);
            var removed = line.substring(startColumn, endColumn);
            var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
            this.$lines.splice(row, 1, newLine);

            var delta = {
                action: "removeText",
                range: range,
                text: removed
            };
//            this._emit("change", { data: delta });
            return range.start;
        };
        this.removeLines = function(firstRow, lastRow) {
            if (firstRow < 0 || lastRow >= this.getLength())
                return this.remove(new Range(firstRow, 0, lastRow + 1, 0));
            return this._removeLines(firstRow, lastRow);
        };

        this._removeLines = function(firstRow, lastRow) {
            var range = new Range(firstRow, 0, lastRow + 1, 0);
            var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

            var delta = {
                action: "removeLines",
                range: range,
                nl: this.getNewLineCharacter(),
                lines: removed
            };
//            this._emit("change", { data: delta });
            return removed;
        };
        this.removeNewLine = function(row) {
            var firstLine = this.getLine(row);
            var secondLine = this.getLine(row+1);

            var range = new Range(row, firstLine.length, row+1, 0);
            var line = firstLine + secondLine;

            this.$lines.splice(row, 2, line);

            var delta = {
                action: "removeText",
                range: range,
                text: this.getNewLineCharacter()
            };
//            this._emit("change", { data: delta });
        };
        // this.replace = function(range, text) {
        //     if (!range instanceof Range)
        //         range = Range.fromPoints(range.start, range.end);
        //     if (text.length == 0 && range.isEmpty())
        //         return range.start;
        //     if (text == this.getTextRange(range))
        //         return range.end;

        //     this.remove(range);
        //     if (text) {
        //         var end = this.insert(range.start, text);
        //     }
        //     else {
        //         end = range.start;
        //     }

        //     return end;
        // };
        this.applyDeltas = function(deltas) {
            for (var i=0; i<deltas.length; i++) {
                var delta = deltas[i];
                var range = Range.fromPoints(delta.range.start, delta.range.end);

                if (delta.action == "insertLines")
                    this.insertLines(range.start.row, delta.lines);
                else if (delta.action == "insertText")
                    this.insert(range.start, delta.text);
                else if (delta.action == "removeLines")
                    this._removeLines(range.start.row, range.end.row - 1);
                else if (delta.action == "removeText")
                    this.remove(range);
            }
        };
        // this.revertDeltas = function(deltas) {
        //     for (var i=deltas.length-1; i>=0; i--) {
        //         var delta = deltas[i];

        //         var range = Range.fromPoints(delta.range.start, delta.range.end);

        //         if (delta.action == "insertLines")
        //             this._removeLines(range.start.row, range.end.row - 1);
        //         else if (delta.action == "insertText")
        //             this.remove(range);
        //         else if (delta.action == "removeLines")
        //             this._insertLines(range.start.row, delta.lines);
        //         else if (delta.action == "removeText")
        //             this.insert(range.start, delta.text);
        //     }
        // };
        // this.indexToPosition = function(index, startRow) {
        //     var lines = this.$lines || this.getAllLines();
        //     var newlineLength = this.getNewLineCharacter().length;
        //     for (var i = startRow || 0, l = lines.length; i < l; i++) {
        //         index -= lines[i].length + newlineLength;
        //         if (index < 0)
        //             return {row: i, column: index + lines[i].length + newlineLength};
        //     }
        //     return {row: l-1, column: lines[l-1].length};
        // };
        // this.positionToIndex = function(pos, startRow) {
        //     var lines = this.$lines || this.getAllLines();
        //     var newlineLength = this.getNewLineCharacter().length;
        //     var index = 0;
        //     var row = Math.min(pos.row, lines.length);
        //     for (var i = startRow || 0; i < row; ++i)
        //         index += lines[i].length + newlineLength;

        //     return index + pos.column;
        // };

    }).call(Document.prototype);

    exports.Document = Document;
})(module.exports);
