
import React from 'react';
import SplitPane from 'react-split-pane'
import MonacoEditor from 'react-monaco-editor';
import format from './images/format.png';
import sample from './sample';
import jsonata from 'jsonata';

class Exerciser3 extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            json: JSON.stringify(sample.Invoice.json, null, 2),
            jsonata: sample.Invoice.jsonata,
            result: ''
        };
    }

    componentDidMount() {
        fetch('http://localhost:3000/versions')
          .then(res => res.json())
          .then(
            result => {
                console.log(result);
                const select = document.getElementById('version-select');
                result.releases.forEach(function(tag) {
                    const option = document.createElement("option");
                    option.text = tag;
                    option.value = tag;
                    select.add(option);
                })
            },
            error => {
                console.log(error);
            }
          );

        console.log(this.props.data);
        if(this.props.data) {
            this.setState({json: 'Loading...', jsonata: 'Loading...'});
            // load the data
            fetch("http://localhost:3000/shared/" + this.props.data)
              .then(res => res.json())
              .then(
                result => {
                    console.log(result);
                    this.setState(result);
                    this.eval();
                },
                error => {
                    console.log(error);
                    // this.setState({
                    //     json: error
                    // });
                }
              )
        } else {
            this.eval();
        }
    }

    jsonEditorDidMount(editor, monaco) {
        console.log('editorDidMount', editor);
        this.jsonEditor = editor;
        editor.decorations = [];
        //editor.focus();
    }

    jsonataEditorDidMount(editor, monaco) {
        console.log('editorDidMount', editor);
        this.monaco = monaco;
        this.jsonataEditor = editor;
        editor.decorations = [];
    }

    onChangeData(newValue, e) {
        this.setState({json: newValue});
        console.log('onChangeData', newValue, e);
        clearTimeout(this.timer);
        this.timer = setTimeout(this.eval.bind(this), 500);
        this.clearMarkers();
    }

    onChangeExpression(newValue, e) {
        this.setState({jsonata: newValue});
        console.log('onChangeExpression', newValue, e);
        clearTimeout(this.timer);
        this.timer = setTimeout(this.eval.bind(this), 500);
        this.clearMarkers();
    }

    format() {
        const formatted = JSON.stringify(JSON.parse(this.state.json), null, 2);
        this.setState({json: formatted});
    }

    changeVersion(event) {
        console.log(event.target.value);
    }

    changeSample(event) {
        console.log(event.target.value);
        const data = sample[event.target.value];
        console.log(data);
        this.setState({
            json: JSON.stringify(data.json, null, 2),
            jsonata: data.jsonata
        });
        clearTimeout(this.timer);
        this.timer = setTimeout(this.eval.bind(this), 500);
        this.clearMarkers();
    }

    eval() {
        let input, jsonataResult, jsonataError;

        try {
            input = JSON.parse(this.state.json);
        } catch (err) {
            console.log(err);
            this.setState({result: 'ERROR IN INPUT DATA: ' + err.message});
            const pos = err.message.indexOf('at position ');
            console.log('pos=', pos);
            if(pos !== -1) {
                console.log(err);
                this.errorMarker(parseInt(err.message.substr(pos+12))+1, this.jsonEditor, this.state.json);
            }
            return;
        }

        try {
            if (this.state.jsonata !== "") {
                jsonataResult = this.evalJsonata(input);
                this.setState({result: jsonataResult});
            }
        } catch (err) {
            jsonataError = err;
            this.setState({result: err.message || String(err)});
            console.log(err);
            this.errorMarker(err.position, this.jsonataEditor, this.state.jsonata);
        }
    }

    errorMarker(pos, editor, buffer) {
        let line = 1;
        let column = 1;
        let position = 1;
        while(position < pos) {
            if(buffer.charAt(position) === '\n') {
                line++;
                column = 0;
            } else {
                column++;
            }
            position++;
        }
        console.log(line, column);
        editor.decorations = editor.deltaDecorations(editor.decorations, [
            { range: new this.monaco.Range(line,column,line, column+1), options: { inlineClassName: 'jsonataErrorMarker' }},
            { range: new this.monaco.Range(line,1,line,1), options: { isWholeLine: true, linesDecorationsClassName: 'jsonataErrorMargin' }},
        ]);
    }

    clearMarkers() {
        this.jsonataEditor.decorations = this.jsonataEditor.deltaDecorations(this.jsonataEditor.decorations, []);
        this.jsonEditor.decorations = this.jsonEditor.deltaDecorations(this.jsonEditor.decorations, []);
    }

    evalJsonata(input) {
        const expr = jsonata(this.state.jsonata);

        // // the following uses the 'moment' package to provide date/time support
        // expr.assign('moment', function (arg1, arg2, arg3, arg4) {
        //     return moment(arg1, arg2, arg3, arg4);
        // });

        expr.assign('trace', function(arg) {
            console.log(arg);
        });

        expr.registerFunction('sin', x => Math.sin(x), '<n-:n>');
        expr.registerFunction('cos', x => Math.cos(x), '<n-:n>');

        if(!this.local) {
            //timeboxExpression(expr, 1000, 500);
        }

        let pathresult = expr.evaluate(input);
        if (typeof pathresult === 'undefined') {
            pathresult = '** no match **';
        } else {
            pathresult = JSON.stringify(pathresult, function (key, val) {
                return (typeof val !== 'undefined' && val !== null && val.toPrecision) ? Number(val.toPrecision(13)) :
                  (val && (val._jsonata_lambda === true || val._jsonata_function === true)) ? '{function:' + (val.signature ? val.signature.definition : "") + '}' :
                    (typeof val === 'function') ? '<native function>#' + val.length  : val;
            }, 2);
        }
        return pathresult;
    }

    render() {
        const options = {
            selectOnLineNumbers: true,
            minimap: {
                enabled: false
            },
            lineNumbers: 'off',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            extraEditorClassName: 'editor-pane'
        };

        return <SplitPane split="vertical" minSize={100} defaultSize={'50%'}>
                <div className="pane">
                    <MonacoEditor
                      language="json"
                      theme="vs"
                      value={this.state.json}
                      options={options}
                      onChange={this.onChangeData.bind(this)}
                      editorDidMount={this.jsonEditorDidMount.bind(this)}
                    />
                    <div id="json-label" className="label">JSON</div>
                    <img src={format} id="json-format" title="Format" onClick={this.format.bind(this)}/>
                    <select id="sample-data" onChange={this.changeSample.bind(this)}>
                        <option value="Invoice">Invoice</option>
                        <option value="Address">Address</option>
                        <option value="Schema">Schema</option>
                        <option value="Library">Library</option>
                    </select>
                </div>
                <SplitPane split="horizontal" minSize={50} defaultSize={170}>
                    <div className="pane">
                        <MonacoEditor
                          language="jsonata"
                          theme="vs"
                          value={this.state.jsonata}
                          options={options}
                          onChange={this.onChangeExpression.bind(this)}
                          editorDidMount={this.jsonataEditorDidMount.bind(this)}
                        />
                        <div id="jsonata-label" className="label">JSONata</div>
                        <select id="version-select" onChange={this.changeVersion.bind(this)}></select>
                        <div id="version-label" className="label"></div>
                    </div>
                    <textarea value={this.state.result} readOnly={true}></textarea>
                </SplitPane>
            </SplitPane>;
    }
}

export default Exerciser3;
