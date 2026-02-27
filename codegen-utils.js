class CodeWriter {
  constructor (indentString) {
    this.lines = [];
    this.indentString = indentString || '    ';
    this.indentations = [];
  }

  indent () {
    this.indentations.push(this.indentString);
  }

  outdent () {
    this.indentations.pop();
  }

  writeLine (line) {
    if (line) {
      this.lines.push(this.indentations.join('') + line);
    } else {
      this.lines.push('');
    }
  }

  getData () {
    return this.lines.join('\n');
  }
}

exports.CodeWriter = CodeWriter;