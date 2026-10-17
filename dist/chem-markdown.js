/**
 * chem-markdown - Chemical formula rendering library (mhchem compatible)
 * CDN-ready, no build required for users (dist/chem-markdown.js is self-contained)
 *
 * Usage:
 *   <script src="chem-markdown.js"></script>
 *   <script>
 *     ChemMarkdown.toHtml('H2SO4');                     // HTML output (same syntax as mhchem \ce)
 *     ChemMarkdown.toText('H2SO4');                     // Unicode text output
 *     ChemMarkdown.toLatex('H2SO4');                    // LaTeX output (identical to mhchem)
 *     ChemMarkdown.toHtml('123 kJ/mol', { type: 'pu' }); // physical units (mhchem \pu)
 *   </script>
 *
 * Auto rendering (like mermaid): just write
 *   <pre class="chem">2H2 + O2 -> 2H2O</pre>
 * and it is rendered on page load. See README for details.
 *
 * Parsing is done by the official mhchem parser (mhchemParser, Apache-2.0),
 * which is bundled into dist/chem-markdown.js by tools/build.mjs.
 */
(function(global) {
  'use strict';

  // ---- mhchemParser 4.2.1 (https://github.com/mhchem/mhchemParser), Apache-2.0 ----
// License text: vendor/mhchemParser.LICENSE.txt (http://www.apache.org/licenses/LICENSE-2.0)
// Modified by chem-markdown: the CommonJS module lines ("use strict", Object.defineProperty(exports, ...),
// exports.mhchemParser = ...) were removed so that the parser can be embedded in this file. No other changes.
/*!
 *************************************************************************
 *
 *  mhchemParser.ts
 *  4.2.1
 *
 *  Parser for the \ce command and \pu command for MathJax and Co.
 *
 *  mhchem's \ce is a tool for writing beautiful chemical equations easily.
 *  mhchem's \pu is a tool for writing physical units easily.
 *
 *  ----------------------------------------------------------------------
 *
 *  Copyright (c) 2015-2023 Martin Hensel
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *  ----------------------------------------------------------------------
 *
 *  https://github.com/mhchem/mhchemParser
 *
 */
var mhchemParser = (function () {
    function mhchemParser() {
    }
    mhchemParser.toTex = function (input, type) {
        return _mhchemTexify.go(_mhchemParser.go(input, type), type !== "tex");
    };
    return mhchemParser;
}());
function _mhchemCreateTransitions(o) {
    var pattern, state;
    var transitions = {};
    for (pattern in o) {
        for (state in o[pattern]) {
            var stateArray = state.split("|");
            o[pattern][state].stateArray = stateArray;
            for (var i = 0; i < stateArray.length; i++) {
                transitions[stateArray[i]] = [];
            }
        }
    }
    for (pattern in o) {
        for (state in o[pattern]) {
            var stateArray = o[pattern][state].stateArray || [];
            for (var i = 0; i < stateArray.length; i++) {
                var p = o[pattern][state];
                p.action_ = [].concat(p.action_);
                for (var k = 0; k < p.action_.length; k++) {
                    if (typeof p.action_[k] === "string") {
                        p.action_[k] = { type_: p.action_[k] };
                    }
                }
                var patternArray = pattern.split("|");
                for (var j = 0; j < patternArray.length; j++) {
                    if (stateArray[i] === '*') {
                        var t = void 0;
                        for (t in transitions) {
                            transitions[t].push({ pattern: patternArray[j], task: p });
                        }
                    }
                    else {
                        transitions[stateArray[i]].push({ pattern: patternArray[j], task: p });
                    }
                }
            }
        }
    }
    return transitions;
}
;
var _mhchemParser = {
    go: function (input, stateMachine) {
        if (!input) {
            return [];
        }
        if (stateMachine === undefined) {
            stateMachine = 'ce';
        }
        var state = '0';
        var buffer = {};
        buffer['parenthesisLevel'] = 0;
        input = input.replace(/\n/g, " ");
        input = input.replace(/[\u2212\u2013\u2014\u2010]/g, "-");
        input = input.replace(/[\u2026]/g, "...");
        var lastInput;
        var watchdog = 10;
        var output = [];
        while (true) {
            if (lastInput !== input) {
                watchdog = 10;
                lastInput = input;
            }
            else {
                watchdog--;
            }
            var machine = _mhchemParser.stateMachines[stateMachine];
            var t = machine.transitions[state] || machine.transitions['*'];
            iterateTransitions: for (var i = 0; i < t.length; i++) {
                var matches = _mhchemParser.patterns.match_(t[i].pattern, input);
                if (matches) {
                    var task = t[i].task;
                    for (var iA = 0; iA < task.action_.length; iA++) {
                        var o = void 0;
                        if (machine.actions[task.action_[iA].type_]) {
                            o = machine.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
                        }
                        else if (_mhchemParser.actions[task.action_[iA].type_]) {
                            o = _mhchemParser.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
                        }
                        else {
                            throw ["MhchemBugA", "mhchem bug A. Please report. (" + task.action_[iA].type_ + ")"];
                        }
                        _mhchemParser.concatArray(output, o);
                    }
                    state = task.nextState || state;
                    if (input.length > 0) {
                        if (!task.revisit) {
                            input = matches.remainder;
                        }
                        if (!task.toContinue) {
                            break iterateTransitions;
                        }
                    }
                    else {
                        return output;
                    }
                }
            }
            if (watchdog <= 0) {
                throw ["MhchemBugU", "mhchem bug U. Please report."];
            }
        }
    },
    concatArray: function (a, b) {
        if (b) {
            if (Array.isArray(b)) {
                for (var iB = 0; iB < b.length; iB++) {
                    a.push(b[iB]);
                }
            }
            else {
                a.push(b);
            }
        }
    },
    patterns: {
        patterns: {
            'empty': /^$/,
            'else': /^./,
            'else2': /^./,
            'space': /^\s/,
            'space A': /^\s(?=[A-Z\\$])/,
            'space$': /^\s$/,
            'a-z': /^[a-z]/,
            'x': /^x/,
            'x$': /^x$/,
            'i$': /^i$/,
            'letters': /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/,
            '\\greek': /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/,
            'one lowercase latin letter $': /^(?:([a-z])(?:$|[^a-zA-Z]))$/,
            '$one lowercase latin letter$ $': /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/,
            'one lowercase greek letter $': /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/,
            'digits': /^[0-9]+/,
            '-9.,9': /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/,
            '-9.,9 no missing 0': /^[+\-]?[0-9]+(?:[.,][0-9]+)?/,
            '(-)(9.,9)(e)(99)': function (input) {
                var match = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))?(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))\))?(?:(?:([eE])|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
                if (match && match[0]) {
                    return { match_: match.slice(1), remainder: input.substr(match[0].length) };
                }
                return null;
            },
            '(-)(9)^(-9)': /^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/,
            'state of aggregation $': function (input) {
                var a = _mhchemParser.patterns.findObserveGroups(input, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");
                if (a && a.remainder.match(/^($|[\s,;\)\]\}])/)) {
                    return a;
                }
                var match = input.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);
                if (match) {
                    return { match_: match[0], remainder: input.substr(match[0].length) };
                }
                return null;
            },
            '_{(state of aggregation)}$': /^_\{(\([a-z]{1,3}\))\}/,
            '{[(': /^(?:\\\{|\[|\()/,
            ')]}': /^(?:\)|\]|\\\})/,
            ', ': /^[,;]\s*/,
            ',': /^[,;]/,
            '.': /^[.]/,
            '. __* ': /^([.\u22C5\u00B7\u2022]|[*])\s*/,
            '...': /^\.\.\.(?=$|[^.])/,
            '^{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "^{", "", "", "}"); },
            '^($...$)': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "^", "$", "$", ""); },
            '^a': /^\^([0-9]+|[^\\_])/,
            '^\\x{}{}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
            '^\\x{}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", ""); },
            '^\\x': /^\^(\\[a-zA-Z]+)\s*/,
            '^(-1)': /^\^(-?\d+)/,
            '\'': /^'/,
            '_{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "_{", "", "", "}"); },
            '_($...$)': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "_", "$", "$", ""); },
            '_9': /^_([+\-]?[0-9]+|[^\\])/,
            '_\\x{}{}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
            '_\\x{}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", ""); },
            '_\\x': /^_(\\[a-zA-Z]+)\s*/,
            '^_': /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/,
            '{}^': /^\{\}(?=\^)/,
            '{}': /^\{\}/,
            '{...}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "", "{", "}", ""); },
            '{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "{", "", "", "}"); },
            '$...$': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "", "$", "$", ""); },
            '${(...)}$__$(...)$': function (input) {
                return _mhchemParser.patterns.findObserveGroups(input, "${", "", "", "}$") || _mhchemParser.patterns.findObserveGroups(input, "$", "", "", "$");
            },
            '=<>': /^[=<>]/,
            '#': /^[#\u2261]/,
            '+': /^\+/,
            '-$': /^-(?=[\s_},;\]/]|$|\([a-z]+\))/,
            '-9': /^-(?=[0-9])/,
            '- orbital overlap': /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/,
            '-': /^-/,
            'pm-operator': /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/,
            'operator': /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/,
            'arrowUpDown': /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/,
            '\\bond{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\bond{", "", "", "}"); },
            '->': /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/,
            'CMT': /^[CMT](?=\[)/,
            '[(...)]': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "[", "", "", "]"); },
            '1st-level escape': /^(&|\\\\|\\hline)\s*/,
            '\\,': /^(?:\\[,\ ;:])/,
            '\\x{}{}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
            '\\x{}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", ""); },
            '\\ca': /^\\ca(?:\s+|(?![a-zA-Z]))/,
            '\\x': /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/,
            'orbital': /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/,
            'others': /^[\/~|]/,
            '\\frac{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\frac{", "", "", "}", "{", "", "", "}"); },
            '\\overset{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\overset{", "", "", "}", "{", "", "", "}"); },
            '\\underset{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\underset{", "", "", "}", "{", "", "", "}"); },
            '\\underbrace{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\underbrace{", "", "", "}_", "{", "", "", "}"); },
            '\\color{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}"); },
            '\\color{(...)}{(...)}': function (input) {
                return _mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}", "{", "", "", "}") ||
                    _mhchemParser.patterns.findObserveGroups(input, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}");
            },
            '\\ce{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\ce{", "", "", "}"); },
            '\\pu{(...)}': function (input) { return _mhchemParser.patterns.findObserveGroups(input, "\\pu{", "", "", "}"); },
            'oxidation$': /^(?:[+-][IVX]+|(?:\\pm|\$\\pm\$|\+-|\+\/-)\s*0)$/,
            'd-oxidation$': /^(?:[+-]?[IVX]+|(?:\\pm|\$\\pm\$|\+-|\+\/-)\s*0)$/,
            '1/2$': /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/,
            'amount': function (input) {
                var match;
                match = input.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/);
                if (match) {
                    return { match_: match[0], remainder: input.substr(match[0].length) };
                }
                var a = _mhchemParser.patterns.findObserveGroups(input, "", "$", "$", "");
                if (a) {
                    match = a.match_.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/);
                    if (match) {
                        return { match_: match[0], remainder: input.substr(match[0].length) };
                    }
                }
                return null;
            },
            'amount2': function (input) { return this['amount'](input); },
            '(KV letters),': /^(?:[A-Z][a-z]{0,2}|i)(?=,)/,
            'formula$': function (input) {
                if (input.match(/^\([a-z]+\)$/)) {
                    return null;
                }
                var match = input.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
                if (match) {
                    return { match_: match[0], remainder: input.substr(match[0].length) };
                }
                return null;
            },
            'uprightEntities': /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/,
            '/': /^\s*(\/)\s*/,
            '//': /^\s*(\/\/)\s*/,
            '*': /^\s*[*.]\s*/
        },
        findObserveGroups: function (input, begExcl, begIncl, endIncl, endExcl, beg2Excl, beg2Incl, end2Incl, end2Excl, combine) {
            var _match = function (input, pattern) {
                if (typeof pattern === "string") {
                    if (input.indexOf(pattern) !== 0) {
                        return null;
                    }
                    return pattern;
                }
                else {
                    var match_1 = input.match(pattern);
                    if (!match_1) {
                        return null;
                    }
                    return match_1[0];
                }
            };
            var _findObserveGroups = function (input, i, endChars) {
                var braces = 0;
                while (i < input.length) {
                    var a = input.charAt(i);
                    var match_2 = _match(input.substr(i), endChars);
                    if (match_2 !== null && braces === 0) {
                        return { endMatchBegin: i, endMatchEnd: i + match_2.length };
                    }
                    else if (a === "{") {
                        braces++;
                    }
                    else if (a === "}") {
                        if (braces === 0) {
                            throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
                        }
                        else {
                            braces--;
                        }
                    }
                    i++;
                }
                if (braces > 0) {
                    return null;
                }
                return null;
            };
            var match = _match(input, begExcl);
            if (match === null) {
                return null;
            }
            input = input.substr(match.length);
            match = _match(input, begIncl);
            if (match === null) {
                return null;
            }
            var e = _findObserveGroups(input, match.length, endIncl || endExcl);
            if (e === null) {
                return null;
            }
            var match1 = input.substring(0, (endIncl ? e.endMatchEnd : e.endMatchBegin));
            if (!(beg2Excl || beg2Incl)) {
                return {
                    match_: match1,
                    remainder: input.substr(e.endMatchEnd)
                };
            }
            else {
                var group2 = this.findObserveGroups(input.substr(e.endMatchEnd), beg2Excl, beg2Incl, end2Incl, end2Excl);
                if (group2 === null) {
                    return null;
                }
                var matchRet = [match1, group2.match_];
                return {
                    match_: (combine ? matchRet.join("") : matchRet),
                    remainder: group2.remainder
                };
            }
        },
        match_: function (m, input) {
            var pattern = _mhchemParser.patterns.patterns[m];
            if (pattern === undefined) {
                throw ["MhchemBugP", "mhchem bug P. Please report. (" + m + ")"];
            }
            else if (typeof pattern === "function") {
                return _mhchemParser.patterns.patterns[m](input);
            }
            else {
                var match = input.match(pattern);
                if (match) {
                    if (match.length > 2) {
                        return { match_: match.slice(1), remainder: input.substr(match[0].length) };
                    }
                    else {
                        return { match_: match[1] || match[0], remainder: input.substr(match[0].length) };
                    }
                }
                return null;
            }
        }
    },
    actions: {
        'a=': function (buffer, m) { buffer.a = (buffer.a || "") + m; return undefined; },
        'b=': function (buffer, m) { buffer.b = (buffer.b || "") + m; return undefined; },
        'p=': function (buffer, m) { buffer.p = (buffer.p || "") + m; return undefined; },
        'o=': function (buffer, m) { buffer.o = (buffer.o || "") + m; return undefined; },
        'o=+p1': function (buffer, _m, a) { buffer.o = (buffer.o || "") + a; return undefined; },
        'q=': function (buffer, m) { buffer.q = (buffer.q || "") + m; return undefined; },
        'd=': function (buffer, m) { buffer.d = (buffer.d || "") + m; return undefined; },
        'rm=': function (buffer, m) { buffer.rm = (buffer.rm || "") + m; return undefined; },
        'text=': function (buffer, m) { buffer.text_ = (buffer.text_ || "") + m; return undefined; },
        'insert': function (_buffer, _m, a) { return { type_: a }; },
        'insert+p1': function (_buffer, m, a) { return { type_: a, p1: m }; },
        'insert+p1+p2': function (_buffer, m, a) { return { type_: a, p1: m[0], p2: m[1] }; },
        'copy': function (_buffer, m) { return m; },
        'write': function (_buffer, _m, a) { return a; },
        'rm': function (_buffer, m) { return { type_: 'rm', p1: m }; },
        'text': function (_buffer, m) { return _mhchemParser.go(m, 'text'); },
        'tex-math': function (_buffer, m) { return _mhchemParser.go(m, 'tex-math'); },
        'tex-math tight': function (_buffer, m) { return _mhchemParser.go(m, 'tex-math tight'); },
        'bond': function (_buffer, m, k) { return { type_: 'bond', kind_: k || m }; },
        'color0-output': function (_buffer, m) { return { type_: 'color0', color: m }; },
        'ce': function (_buffer, m) { return _mhchemParser.go(m, 'ce'); },
        'pu': function (_buffer, m) { return _mhchemParser.go(m, 'pu'); },
        '1/2': function (_buffer, m) {
            var ret = [];
            if (m.match(/^[+\-]/)) {
                ret.push(m.substr(0, 1));
                m = m.substr(1);
            }
            var n = m.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
            n[1] = n[1].replace(/\$/g, "");
            ret.push({ type_: 'frac', p1: n[1], p2: n[2] });
            if (n[3]) {
                n[3] = n[3].replace(/\$/g, "");
                ret.push({ type_: 'tex-math', p1: n[3] });
            }
            return ret;
        },
        '9,9': function (_buffer, m) { return _mhchemParser.go(m, '9,9'); }
    },
    stateMachines: {
        'tex': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '0': { action_: 'copy' }
                },
                '\\ce{(...)}': {
                    '0': { action_: [{ type_: 'write', option: "{" }, 'ce', { type_: 'write', option: "}" }] }
                },
                '\\pu{(...)}': {
                    '0': { action_: [{ type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                'else': {
                    '0': { action_: 'copy' }
                },
            }),
            actions: {}
        },
        'ce': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'output' }
                },
                'else': {
                    '0|1|2': { action_: 'beginsWithBond=false', revisit: true, toContinue: true }
                },
                'oxidation$': {
                    '0': { action_: 'oxidation-output' }
                },
                'CMT': {
                    'r': { action_: 'rdt=', nextState: 'rt' },
                    'rd': { action_: 'rqt=', nextState: 'rdt' }
                },
                'arrowUpDown': {
                    '0|1|2|as': { action_: ['sb=false', 'output', 'operator'], nextState: '1' }
                },
                'uprightEntities': {
                    '0|1|2': { action_: ['o=', 'output'], nextState: '1' }
                },
                'orbital': {
                    '0|1|2|3': { action_: 'o=', nextState: 'o' }
                },
                '->': {
                    '0|1|2|3': { action_: 'r=', nextState: 'r' },
                    'a|as': { action_: ['output', 'r='], nextState: 'r' },
                    '*': { action_: ['output', 'r='], nextState: 'r' }
                },
                '+': {
                    'o': { action_: 'd= kv', nextState: 'd' },
                    'd|D': { action_: 'd=', nextState: 'd' },
                    'q': { action_: 'd=', nextState: 'qd' },
                    'qd|qD': { action_: 'd=', nextState: 'qd' },
                    'dq': { action_: ['output', 'd='], nextState: 'd' },
                    '3': { action_: ['sb=false', 'output', 'operator'], nextState: '0' }
                },
                'amount': {
                    '0|2': { action_: 'a=', nextState: 'a' }
                },
                'pm-operator': {
                    '0|1|2|a|as': { action_: ['sb=false', 'output', { type_: 'operator', option: '\\pm' }], nextState: '0' }
                },
                'operator': {
                    '0|1|2|a|as': { action_: ['sb=false', 'output', 'operator'], nextState: '0' }
                },
                '-$': {
                    'o|q': { action_: ['charge or bond', 'output'], nextState: 'qd' },
                    'd': { action_: 'd=', nextState: 'd' },
                    'D': { action_: ['output', { type_: 'bond', option: "-" }], nextState: '3' },
                    'q': { action_: 'd=', nextState: 'qd' },
                    'qd': { action_: 'd=', nextState: 'qd' },
                    'qD|dq': { action_: ['output', { type_: 'bond', option: "-" }], nextState: '3' }
                },
                '-9': {
                    '3|o': { action_: ['output', { type_: 'insert', option: 'hyphen' }], nextState: '3' }
                },
                '- orbital overlap': {
                    'o': { action_: ['output', { type_: 'insert', option: 'hyphen' }], nextState: '2' },
                    'd': { action_: ['output', { type_: 'insert', option: 'hyphen' }], nextState: '2' }
                },
                '-': {
                    '0|1|2': { action_: [{ type_: 'output', option: 1 }, 'beginsWithBond=true', { type_: 'bond', option: "-" }], nextState: '3' },
                    '3': { action_: { type_: 'bond', option: "-" } },
                    'a': { action_: ['output', { type_: 'insert', option: 'hyphen' }], nextState: '2' },
                    'as': { action_: [{ type_: 'output', option: 2 }, { type_: 'bond', option: "-" }], nextState: '3' },
                    'b': { action_: 'b=' },
                    'o': { action_: { type_: '- after o/d', option: false }, nextState: '2' },
                    'q': { action_: { type_: '- after o/d', option: false }, nextState: '2' },
                    'd|qd|dq': { action_: { type_: '- after o/d', option: true }, nextState: '2' },
                    'D|qD|p': { action_: ['output', { type_: 'bond', option: "-" }], nextState: '3' }
                },
                'amount2': {
                    '1|3': { action_: 'a=', nextState: 'a' }
                },
                'letters': {
                    '0|1|2|3|a|as|b|p|bp|o': { action_: 'o=', nextState: 'o' },
                    'q|dq': { action_: ['output', 'o='], nextState: 'o' },
                    'd|D|qd|qD': { action_: 'o after d', nextState: 'o' }
                },
                'digits': {
                    'o': { action_: 'q=', nextState: 'q' },
                    'd|D': { action_: 'q=', nextState: 'dq' },
                    'q': { action_: ['output', 'o='], nextState: 'o' },
                    'a': { action_: 'o=', nextState: 'o' }
                },
                'space A': {
                    'b|p|bp': { action_: [] }
                },
                'space': {
                    'a': { action_: [], nextState: 'as' },
                    '0': { action_: 'sb=false' },
                    '1|2': { action_: 'sb=true' },
                    'r|rt|rd|rdt|rdq': { action_: 'output', nextState: '0' },
                    '*': { action_: ['output', 'sb=true'], nextState: '1' }
                },
                '1st-level escape': {
                    '1|2': { action_: ['output', { type_: 'insert+p1', option: '1st-level escape' }] },
                    '*': { action_: ['output', { type_: 'insert+p1', option: '1st-level escape' }], nextState: '0' }
                },
                '[(...)]': {
                    'r|rt': { action_: 'rd=', nextState: 'rd' },
                    'rd|rdt': { action_: 'rq=', nextState: 'rdq' }
                },
                '...': {
                    'o|d|D|dq|qd|qD': { action_: ['output', { type_: 'bond', option: "..." }], nextState: '3' },
                    '*': { action_: [{ type_: 'output', option: 1 }, { type_: 'insert', option: 'ellipsis' }], nextState: '1' }
                },
                '. __* ': {
                    '*': { action_: ['output', { type_: 'insert', option: 'addition compound' }], nextState: '1' }
                },
                'state of aggregation $': {
                    '*': { action_: ['output', 'state of aggregation'], nextState: '1' }
                },
                '{[(': {
                    'a|as|o': { action_: ['o=', 'output', 'parenthesisLevel++'], nextState: '2' },
                    '0|1|2|3': { action_: ['o=', 'output', 'parenthesisLevel++'], nextState: '2' },
                    '*': { action_: ['output', 'o=', 'output', 'parenthesisLevel++'], nextState: '2' }
                },
                ')]}': {
                    '0|1|2|3|b|p|bp|o': { action_: ['o=', 'parenthesisLevel--'], nextState: 'o' },
                    'a|as|d|D|q|qd|qD|dq': { action_: ['output', 'o=', 'parenthesisLevel--'], nextState: 'o' }
                },
                ', ': {
                    '*': { action_: ['output', 'comma'], nextState: '0' }
                },
                '^_': {
                    '*': { action_: [] }
                },
                '^{(...)}|^($...$)': {
                    '0|1|2|as': { action_: 'b=', nextState: 'b' },
                    'p': { action_: 'b=', nextState: 'bp' },
                    '3|o': { action_: 'd= kv', nextState: 'D' },
                    'q': { action_: 'd=', nextState: 'qD' },
                    'd|D|qd|qD|dq': { action_: ['output', 'd='], nextState: 'D' }
                },
                '^a|^\\x{}{}|^\\x{}|^\\x|\'': {
                    '0|1|2|as': { action_: 'b=', nextState: 'b' },
                    'p': { action_: 'b=', nextState: 'bp' },
                    '3|o': { action_: 'd= kv', nextState: 'd' },
                    'q': { action_: 'd=', nextState: 'qd' },
                    'd|qd|D|qD': { action_: 'd=' },
                    'dq': { action_: ['output', 'd='], nextState: 'd' }
                },
                '_{(state of aggregation)}$': {
                    'd|D|q|qd|qD|dq': { action_: ['output', 'q='], nextState: 'q' }
                },
                '_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x': {
                    '0|1|2|as': { action_: 'p=', nextState: 'p' },
                    'b': { action_: 'p=', nextState: 'bp' },
                    '3|o': { action_: 'q=', nextState: 'q' },
                    'd|D': { action_: 'q=', nextState: 'dq' },
                    'q|qd|qD|dq': { action_: ['output', 'q='], nextState: 'q' }
                },
                '=<>': {
                    '0|1|2|3|a|as|o|q|d|D|qd|qD|dq': { action_: [{ type_: 'output', option: 2 }, 'bond'], nextState: '3' }
                },
                '#': {
                    '0|1|2|3|a|as|o': { action_: [{ type_: 'output', option: 2 }, { type_: 'bond', option: "#" }], nextState: '3' }
                },
                '{}^': {
                    '*': { action_: [{ type_: 'output', option: 1 }, { type_: 'insert', option: 'tinySkip' }], nextState: '1' }
                },
                '{}': {
                    '*': { action_: { type_: 'output', option: 1 }, nextState: '1' }
                },
                '{...}': {
                    '0|1|2|3|a|as|b|p|bp': { action_: 'o=', nextState: 'o' },
                    'o|d|D|q|qd|qD|dq': { action_: ['output', 'o='], nextState: 'o' }
                },
                '$...$': {
                    'a': { action_: 'a=' },
                    '0|1|2|3|as|b|p|bp|o': { action_: 'o=', nextState: 'o' },
                    'as|o': { action_: 'o=' },
                    'q|d|D|qd|qD|dq': { action_: ['output', 'o='], nextState: 'o' }
                },
                '\\bond{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'bond'], nextState: "3" }
                },
                '\\frac{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 1 }, 'frac-output'], nextState: '3' }
                },
                '\\overset{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'overset-output'], nextState: '3' }
                },
                '\\underset{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'underset-output'], nextState: '3' }
                },
                '\\underbrace{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'underbrace-output'], nextState: '3' }
                },
                '\\color{(...)}{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'color-output'], nextState: '3' }
                },
                '\\color{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'color0-output'] }
                },
                '\\ce{(...)}': {
                    '*': { action_: [{ type_: 'output', option: 2 }, 'ce'], nextState: '3' }
                },
                '\\,': {
                    '*': { action_: [{ type_: 'output', option: 1 }, 'copy'], nextState: '1' }
                },
                '\\pu{(...)}': {
                    '*': { action_: ['output', { type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }], nextState: '3' }
                },
                '\\x{}{}|\\x{}|\\x': {
                    '0|1|2|3|a|as|b|p|bp|o|c0': { action_: ['o=', 'output'], nextState: '3' },
                    '*': { action_: ['output', 'o=', 'output'], nextState: '3' }
                },
                'others': {
                    '*': { action_: [{ type_: 'output', option: 1 }, 'copy'], nextState: '3' }
                },
                'else2': {
                    'a': { action_: 'a to o', nextState: 'o', revisit: true },
                    'as': { action_: ['output', 'sb=true'], nextState: '1', revisit: true },
                    'r|rt|rd|rdt|rdq': { action_: ['output'], nextState: '0', revisit: true },
                    '*': { action_: ['output', 'copy'], nextState: '3' }
                }
            }),
            actions: {
                'o after d': function (buffer, m) {
                    var ret;
                    if ((buffer.d || "").match(/^[1-9][0-9]*$/)) {
                        var tmp = buffer.d;
                        buffer.d = undefined;
                        ret = this['output'](buffer);
                        ret.push({ type_: 'tinySkip' });
                        buffer.b = tmp;
                    }
                    else {
                        ret = this['output'](buffer);
                    }
                    _mhchemParser.actions['o='](buffer, m);
                    return ret;
                },
                'd= kv': function (buffer, m) {
                    buffer.d = m;
                    buffer.dType = 'kv';
                    return undefined;
                },
                'charge or bond': function (buffer, m) {
                    if (buffer['beginsWithBond']) {
                        var ret = [];
                        _mhchemParser.concatArray(ret, this['output'](buffer));
                        _mhchemParser.concatArray(ret, _mhchemParser.actions['bond'](buffer, m, "-"));
                        return ret;
                    }
                    else {
                        buffer.d = m;
                        return undefined;
                    }
                },
                '- after o/d': function (buffer, m, isAfterD) {
                    var c1 = _mhchemParser.patterns.match_('orbital', buffer.o || "");
                    var c2 = _mhchemParser.patterns.match_('one lowercase greek letter $', buffer.o || "");
                    var c3 = _mhchemParser.patterns.match_('one lowercase latin letter $', buffer.o || "");
                    var c4 = _mhchemParser.patterns.match_('$one lowercase latin letter$ $', buffer.o || "");
                    var hyphenFollows = m === "-" && (c1 && c1.remainder === "" || c2 || c3 || c4);
                    if (hyphenFollows && !buffer.a && !buffer.b && !buffer.p && !buffer.d && !buffer.q && !c1 && c3) {
                        buffer.o = '$' + buffer.o + '$';
                    }
                    var ret = [];
                    if (hyphenFollows) {
                        _mhchemParser.concatArray(ret, this['output'](buffer));
                        ret.push({ type_: 'hyphen' });
                    }
                    else {
                        c1 = _mhchemParser.patterns.match_('digits', buffer.d || "");
                        if (isAfterD && c1 && c1.remainder === '') {
                            _mhchemParser.concatArray(ret, _mhchemParser.actions['d='](buffer, m));
                            _mhchemParser.concatArray(ret, this['output'](buffer));
                        }
                        else {
                            _mhchemParser.concatArray(ret, this['output'](buffer));
                            _mhchemParser.concatArray(ret, _mhchemParser.actions['bond'](buffer, m, "-"));
                        }
                    }
                    return ret;
                },
                'a to o': function (buffer) {
                    buffer.o = buffer.a;
                    buffer.a = undefined;
                    return undefined;
                },
                'sb=true': function (buffer) { buffer.sb = true; return undefined; },
                'sb=false': function (buffer) { buffer.sb = false; return undefined; },
                'beginsWithBond=true': function (buffer) { buffer['beginsWithBond'] = true; return undefined; },
                'beginsWithBond=false': function (buffer) { buffer['beginsWithBond'] = false; return undefined; },
                'parenthesisLevel++': function (buffer) { buffer['parenthesisLevel']++; return undefined; },
                'parenthesisLevel--': function (buffer) { buffer['parenthesisLevel']--; return undefined; },
                'state of aggregation': function (_buffer, m) {
                    return { type_: 'state of aggregation', p1: _mhchemParser.go(m, 'o') };
                },
                'comma': function (buffer, m) {
                    var a = m.replace(/\s*$/, '');
                    var withSpace = (a !== m);
                    if (withSpace && buffer['parenthesisLevel'] === 0) {
                        return { type_: 'comma enumeration L', p1: a };
                    }
                    else {
                        return { type_: 'comma enumeration M', p1: a };
                    }
                },
                'output': function (buffer, _m, entityFollows) {
                    var ret;
                    if (!buffer.r) {
                        ret = [];
                        if (!buffer.a && !buffer.b && !buffer.p && !buffer.o && !buffer.q && !buffer.d && !entityFollows) {
                        }
                        else {
                            if (buffer.sb) {
                                ret.push({ type_: 'entitySkip' });
                            }
                            if (!buffer.o && !buffer.q && !buffer.d && !buffer.b && !buffer.p && entityFollows !== 2) {
                                buffer.o = buffer.a;
                                buffer.a = undefined;
                            }
                            else if (!buffer.o && !buffer.q && !buffer.d && (buffer.b || buffer.p)) {
                                buffer.o = buffer.a;
                                buffer.d = buffer.b;
                                buffer.q = buffer.p;
                                buffer.a = buffer.b = buffer.p = undefined;
                            }
                            else {
                                if (buffer.o && buffer.dType === 'kv' && _mhchemParser.patterns.match_('d-oxidation$', buffer.d || "")) {
                                    buffer.dType = 'oxidation';
                                }
                                else if (buffer.o && buffer.dType === 'kv' && !buffer.q) {
                                    buffer.dType = undefined;
                                }
                            }
                            ret.push({
                                type_: 'chemfive',
                                a: _mhchemParser.go(buffer.a, 'a'),
                                b: _mhchemParser.go(buffer.b, 'bd'),
                                p: _mhchemParser.go(buffer.p, 'pq'),
                                o: _mhchemParser.go(buffer.o, 'o'),
                                q: _mhchemParser.go(buffer.q, 'pq'),
                                d: _mhchemParser.go(buffer.d, (buffer.dType === 'oxidation' ? 'oxidation' : 'bd')),
                                dType: buffer.dType
                            });
                        }
                    }
                    else {
                        var rd = void 0;
                        if (buffer.rdt === 'M') {
                            rd = _mhchemParser.go(buffer.rd, 'tex-math');
                        }
                        else if (buffer.rdt === 'T') {
                            rd = [{ type_: 'text', p1: buffer.rd || "" }];
                        }
                        else {
                            rd = _mhchemParser.go(buffer.rd, 'ce');
                        }
                        var rq = void 0;
                        if (buffer.rqt === 'M') {
                            rq = _mhchemParser.go(buffer.rq, 'tex-math');
                        }
                        else if (buffer.rqt === 'T') {
                            rq = [{ type_: 'text', p1: buffer.rq || "" }];
                        }
                        else {
                            rq = _mhchemParser.go(buffer.rq, 'ce');
                        }
                        ret = {
                            type_: 'arrow',
                            r: buffer.r,
                            rd: rd,
                            rq: rq
                        };
                    }
                    for (var p in buffer) {
                        if (p !== 'parenthesisLevel' && p !== 'beginsWithBond') {
                            delete buffer[p];
                        }
                    }
                    return ret;
                },
                'oxidation-output': function (_buffer, m) {
                    var ret = ["{"];
                    _mhchemParser.concatArray(ret, _mhchemParser.go(m, 'oxidation'));
                    ret.push("}");
                    return ret;
                },
                'frac-output': function (_buffer, m) {
                    return { type_: 'frac-ce', p1: _mhchemParser.go(m[0], 'ce'), p2: _mhchemParser.go(m[1], 'ce') };
                },
                'overset-output': function (_buffer, m) {
                    return { type_: 'overset', p1: _mhchemParser.go(m[0], 'ce'), p2: _mhchemParser.go(m[1], 'ce') };
                },
                'underset-output': function (_buffer, m) {
                    return { type_: 'underset', p1: _mhchemParser.go(m[0], 'ce'), p2: _mhchemParser.go(m[1], 'ce') };
                },
                'underbrace-output': function (_buffer, m) {
                    return { type_: 'underbrace', p1: _mhchemParser.go(m[0], 'ce'), p2: _mhchemParser.go(m[1], 'ce') };
                },
                'color-output': function (_buffer, m) {
                    return { type_: 'color', color1: m[0], color2: _mhchemParser.go(m[1], 'ce') };
                },
                'r=': function (buffer, m) { buffer.r = m; return undefined; },
                'rdt=': function (buffer, m) { buffer.rdt = m; return undefined; },
                'rd=': function (buffer, m) { buffer.rd = m; return undefined; },
                'rqt=': function (buffer, m) { buffer.rqt = m; return undefined; },
                'rq=': function (buffer, m) { buffer.rq = m; return undefined; },
                'operator': function (_buffer, m, p1) { return { type_: 'operator', kind_: (p1 || m) }; }
            }
        },
        'a': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: [] }
                },
                '1/2$': {
                    '0': { action_: '1/2' }
                },
                'else': {
                    '0': { action_: [], nextState: '1', revisit: true }
                },
                '${(...)}$__$(...)$': {
                    '*': { action_: 'tex-math tight', nextState: '1' }
                },
                ',': {
                    '*': { action_: { type_: 'insert', option: 'commaDecimal' } }
                },
                'else2': {
                    '*': { action_: 'copy' }
                }
            }),
            actions: {}
        },
        'o': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: [] }
                },
                '1/2$': {
                    '0': { action_: '1/2' }
                },
                'else': {
                    '0': { action_: [], nextState: '1', revisit: true }
                },
                'letters': {
                    '*': { action_: 'rm' }
                },
                '\\ca': {
                    '*': { action_: { type_: 'insert', option: 'circa' } }
                },
                '\\pu{(...)}': {
                    '*': { action_: [{ type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                '\\x{}{}|\\x{}|\\x': {
                    '*': { action_: 'copy' }
                },
                '${(...)}$__$(...)$': {
                    '*': { action_: 'tex-math' }
                },
                '{(...)}': {
                    '*': { action_: [{ type_: 'write', option: "{" }, 'text', { type_: 'write', option: "}" }] }
                },
                'else2': {
                    '*': { action_: 'copy' }
                }
            }),
            actions: {}
        },
        'text': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'output' }
                },
                '{...}': {
                    '*': { action_: 'text=' }
                },
                '${(...)}$__$(...)$': {
                    '*': { action_: 'tex-math' }
                },
                '\\greek': {
                    '*': { action_: ['output', 'rm'] }
                },
                '\\pu{(...)}': {
                    '*': { action_: ['output', { type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                '\\,|\\x{}{}|\\x{}|\\x': {
                    '*': { action_: ['output', 'copy'] }
                },
                'else': {
                    '*': { action_: 'text=' }
                }
            }),
            actions: {
                'output': function (buffer) {
                    if (buffer.text_) {
                        var ret = { type_: 'text', p1: buffer.text_ };
                        for (var p in buffer) {
                            delete buffer[p];
                        }
                        return ret;
                    }
                    return undefined;
                }
            }
        },
        'pq': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: [] }
                },
                'state of aggregation $': {
                    '*': { action_: 'state of aggregation' }
                },
                'i$': {
                    '0': { action_: [], nextState: '!f', revisit: true }
                },
                '(KV letters),': {
                    '0': { action_: 'rm', nextState: '0' }
                },
                'formula$': {
                    '0': { action_: [], nextState: 'f', revisit: true }
                },
                '1/2$': {
                    '0': { action_: '1/2' }
                },
                'else': {
                    '0': { action_: [], nextState: '!f', revisit: true }
                },
                '${(...)}$__$(...)$': {
                    '*': { action_: 'tex-math' }
                },
                '{(...)}': {
                    '*': { action_: 'text' }
                },
                'a-z': {
                    'f': { action_: 'tex-math' }
                },
                'letters': {
                    '*': { action_: 'rm' }
                },
                '-9.,9': {
                    '*': { action_: '9,9' }
                },
                ',': {
                    '*': { action_: { type_: 'insert+p1', option: 'comma enumeration S' } }
                },
                '\\color{(...)}{(...)}': {
                    '*': { action_: 'color-output' }
                },
                '\\color{(...)}': {
                    '*': { action_: 'color0-output' }
                },
                '\\ce{(...)}': {
                    '*': { action_: 'ce' }
                },
                '\\pu{(...)}': {
                    '*': { action_: [{ type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                '\\,|\\x{}{}|\\x{}|\\x': {
                    '*': { action_: 'copy' }
                },
                'else2': {
                    '*': { action_: 'copy' }
                }
            }),
            actions: {
                'state of aggregation': function (_buffer, m) {
                    return { type_: 'state of aggregation subscript', p1: _mhchemParser.go(m, 'o') };
                },
                'color-output': function (_buffer, m) {
                    return { type_: 'color', color1: m[0], color2: _mhchemParser.go(m[1], 'pq') };
                }
            }
        },
        'bd': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: [] }
                },
                'x$': {
                    '0': { action_: [], nextState: '!f', revisit: true }
                },
                'formula$': {
                    '0': { action_: [], nextState: 'f', revisit: true }
                },
                'else': {
                    '0': { action_: [], nextState: '!f', revisit: true }
                },
                '-9.,9 no missing 0': {
                    '*': { action_: '9,9' }
                },
                '.': {
                    '*': { action_: { type_: 'insert', option: 'electron dot' } }
                },
                'a-z': {
                    'f': { action_: 'tex-math' }
                },
                'x': {
                    '*': { action_: { type_: 'insert', option: 'KV x' } }
                },
                'letters': {
                    '*': { action_: 'rm' }
                },
                '\'': {
                    '*': { action_: { type_: 'insert', option: 'prime' } }
                },
                '${(...)}$__$(...)$': {
                    '*': { action_: 'tex-math' }
                },
                '{(...)}': {
                    '*': { action_: 'text' }
                },
                '\\color{(...)}{(...)}': {
                    '*': { action_: 'color-output' }
                },
                '\\color{(...)}': {
                    '*': { action_: 'color0-output' }
                },
                '\\ce{(...)}': {
                    '*': { action_: 'ce' }
                },
                '\\pu{(...)}': {
                    '*': { action_: [{ type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                '\\,|\\x{}{}|\\x{}|\\x': {
                    '*': { action_: 'copy' }
                },
                'else2': {
                    '*': { action_: 'copy' }
                }
            }),
            actions: {
                'color-output': function (_buffer, m) {
                    return { type_: 'color', color1: m[0], color2: _mhchemParser.go(m[1], 'bd') };
                }
            }
        },
        'oxidation': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'roman-numeral' }
                },
                'pm-operator': {
                    '*': { action_: { type_: 'o=+p1', option: "\\pm" } }
                },
                'else': {
                    '*': { action_: 'o=' }
                }
            }),
            actions: {
                'roman-numeral': function (buffer) { return { type_: 'roman numeral', p1: buffer.o || "" }; }
            }
        },
        'tex-math': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'output' }
                },
                '\\ce{(...)}': {
                    '*': { action_: ['output', 'ce'] }
                },
                '\\pu{(...)}': {
                    '*': { action_: ['output', { type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                '{...}|\\,|\\x{}{}|\\x{}|\\x': {
                    '*': { action_: 'o=' }
                },
                'else': {
                    '*': { action_: 'o=' }
                }
            }),
            actions: {
                'output': function (buffer) {
                    if (buffer.o) {
                        var ret = { type_: 'tex-math', p1: buffer.o };
                        for (var p in buffer) {
                            delete buffer[p];
                        }
                        return ret;
                    }
                    return undefined;
                }
            }
        },
        'tex-math tight': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'output' }
                },
                '\\ce{(...)}': {
                    '*': { action_: ['output', 'ce'] }
                },
                '\\pu{(...)}': {
                    '*': { action_: ['output', { type_: 'write', option: "{" }, 'pu', { type_: 'write', option: "}" }] }
                },
                '{...}|\\,|\\x{}{}|\\x{}|\\x': {
                    '*': { action_: 'o=' }
                },
                '-|+': {
                    '*': { action_: 'tight operator' }
                },
                'else': {
                    '*': { action_: 'o=' }
                }
            }),
            actions: {
                'tight operator': function (buffer, m) { buffer.o = (buffer.o || "") + "{" + m + "}"; return undefined; },
                'output': function (buffer) {
                    if (buffer.o) {
                        var ret = { type_: 'tex-math', p1: buffer.o };
                        for (var p in buffer) {
                            delete buffer[p];
                        }
                        return ret;
                    }
                    return undefined;
                }
            }
        },
        '9,9': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: [] }
                },
                ',': {
                    '*': { action_: 'comma' }
                },
                'else': {
                    '*': { action_: 'copy' }
                }
            }),
            actions: {
                'comma': function () { return { type_: 'commaDecimal' }; }
            }
        },
        'pu': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'output' }
                },
                'space$': {
                    '*': { action_: ['output', 'space'] }
                },
                '{[(|)]}': {
                    '0|a': { action_: 'copy' }
                },
                '(-)(9)^(-9)': {
                    '0': { action_: 'number^', nextState: 'a' }
                },
                '(-)(9.,9)(e)(99)': {
                    '0': { action_: 'enumber', nextState: 'a' }
                },
                'space': {
                    '0|a': { action_: [] }
                },
                'pm-operator': {
                    '0|a': { action_: { type_: 'operator', option: '\\pm' }, nextState: '0' }
                },
                'operator': {
                    '0|a': { action_: 'copy', nextState: '0' }
                },
                '//': {
                    'd': { action_: 'o=', nextState: '/' }
                },
                '/': {
                    'd': { action_: 'o=', nextState: '/' }
                },
                '{...}|else': {
                    '0|d': { action_: 'd=', nextState: 'd' },
                    'a': { action_: ['space', 'd='], nextState: 'd' },
                    '/|q': { action_: 'q=', nextState: 'q' }
                }
            }),
            actions: {
                'enumber': function (_buffer, m) {
                    var ret = [];
                    if (m[0] === "+-" || m[0] === "+/-") {
                        ret.push("\\pm ");
                    }
                    else if (m[0]) {
                        ret.push(m[0]);
                    }
                    if (m[1]) {
                        _mhchemParser.concatArray(ret, _mhchemParser.go(m[1], 'pu-9,9'));
                        if (m[2]) {
                            if (m[2].match(/[,.]/)) {
                                _mhchemParser.concatArray(ret, _mhchemParser.go(m[2], 'pu-9,9'));
                            }
                            else {
                                ret.push(m[2]);
                            }
                        }
                        if (m[3] || m[4]) {
                            if (m[3] === "e" || m[4] === "*") {
                                ret.push({ type_: 'cdot' });
                            }
                            else {
                                ret.push({ type_: 'times' });
                            }
                        }
                    }
                    if (m[5]) {
                        ret.push("10^{" + m[5] + "}");
                    }
                    return ret;
                },
                'number^': function (_buffer, m) {
                    var ret = [];
                    if (m[0] === "+-" || m[0] === "+/-") {
                        ret.push("\\pm ");
                    }
                    else if (m[0]) {
                        ret.push(m[0]);
                    }
                    _mhchemParser.concatArray(ret, _mhchemParser.go(m[1], 'pu-9,9'));
                    ret.push("^{" + m[2] + "}");
                    return ret;
                },
                'operator': function (_buffer, m, p1) { return { type_: 'operator', kind_: (p1 || m) }; },
                'space': function () { return { type_: 'pu-space-1' }; },
                'output': function (buffer) {
                    var ret;
                    var md = _mhchemParser.patterns.match_('{(...)}', buffer.d || "");
                    if (md && md.remainder === '') {
                        buffer.d = md.match_;
                    }
                    var mq = _mhchemParser.patterns.match_('{(...)}', buffer.q || "");
                    if (mq && mq.remainder === '') {
                        buffer.q = mq.match_;
                    }
                    if (buffer.d) {
                        buffer.d = buffer.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
                        buffer.d = buffer.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
                    }
                    if (buffer.q) {
                        buffer.q = buffer.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
                        buffer.q = buffer.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
                        var b5 = {
                            d: _mhchemParser.go(buffer.d, 'pu'),
                            q: _mhchemParser.go(buffer.q, 'pu')
                        };
                        if (buffer.o === '//') {
                            ret = { type_: 'pu-frac', p1: b5.d, p2: b5.q };
                        }
                        else {
                            ret = b5.d;
                            if (b5.d.length > 1 || b5.q.length > 1) {
                                ret.push({ type_: ' / ' });
                            }
                            else {
                                ret.push({ type_: '/' });
                            }
                            _mhchemParser.concatArray(ret, b5.q);
                        }
                    }
                    else {
                        ret = _mhchemParser.go(buffer.d, 'pu-2');
                    }
                    for (var p in buffer) {
                        delete buffer[p];
                    }
                    return ret;
                }
            }
        },
        'pu-2': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '*': { action_: 'output' }
                },
                '*': {
                    '*': { action_: ['output', 'cdot'], nextState: '0' }
                },
                '\\x': {
                    '*': { action_: 'rm=' }
                },
                'space': {
                    '*': { action_: ['output', 'space'], nextState: '0' }
                },
                '^{(...)}|^(-1)': {
                    '1': { action_: '^(-1)' }
                },
                '-9.,9': {
                    '0': { action_: 'rm=', nextState: '0' },
                    '1': { action_: '^(-1)', nextState: '0' }
                },
                '{...}|else': {
                    '*': { action_: 'rm=', nextState: '1' }
                }
            }),
            actions: {
                'cdot': function () { return { type_: 'tight cdot' }; },
                '^(-1)': function (buffer, m) { buffer.rm += "^{" + m + "}"; return undefined; },
                'space': function () { return { type_: 'pu-space-2' }; },
                'output': function (buffer) {
                    var ret = [];
                    if (buffer.rm) {
                        var mrm = _mhchemParser.patterns.match_('{(...)}', buffer.rm || "");
                        if (mrm && mrm.remainder === '') {
                            ret = _mhchemParser.go(mrm.match_, 'pu');
                        }
                        else {
                            ret = { type_: 'rm', p1: buffer.rm };
                        }
                    }
                    for (var p in buffer) {
                        delete buffer[p];
                    }
                    return ret;
                }
            }
        },
        'pu-9,9': {
            transitions: _mhchemCreateTransitions({
                'empty': {
                    '0': { action_: 'output-0' },
                    'o': { action_: 'output-o' }
                },
                ',': {
                    '0': { action_: ['output-0', 'comma'], nextState: 'o' }
                },
                '.': {
                    '0': { action_: ['output-0', 'copy'], nextState: 'o' }
                },
                'else': {
                    '*': { action_: 'text=' }
                }
            }),
            actions: {
                'comma': function () { return { type_: 'commaDecimal' }; },
                'output-0': function (buffer) {
                    var ret = [];
                    buffer.text_ = buffer.text_ || "";
                    if (buffer.text_.length > 4) {
                        var a = buffer.text_.length % 3;
                        if (a === 0) {
                            a = 3;
                        }
                        for (var i = buffer.text_.length - 3; i > 0; i -= 3) {
                            ret.push(buffer.text_.substr(i, 3));
                            ret.push({ type_: '1000 separator' });
                        }
                        ret.push(buffer.text_.substr(0, a));
                        ret.reverse();
                    }
                    else {
                        ret.push(buffer.text_);
                    }
                    for (var p in buffer) {
                        delete buffer[p];
                    }
                    return ret;
                },
                'output-o': function (buffer) {
                    var ret = [];
                    buffer.text_ = buffer.text_ || "";
                    if (buffer.text_.length > 4) {
                        var a = buffer.text_.length - 3;
                        var i = void 0;
                        for (i = 0; i < a; i += 3) {
                            ret.push(buffer.text_.substr(i, 3));
                            ret.push({ type_: '1000 separator' });
                        }
                        ret.push(buffer.text_.substr(i));
                    }
                    else {
                        ret.push(buffer.text_);
                    }
                    for (var p in buffer) {
                        delete buffer[p];
                    }
                    return ret;
                }
            }
        }
    }
};
var _mhchemTexify = {
    go: function (input, addOuterBraces) {
        if (!input) {
            return "";
        }
        var res = "";
        var cee = false;
        for (var i = 0; i < input.length; i++) {
            var inputi = input[i];
            if (typeof inputi === "string") {
                res += inputi;
            }
            else {
                res += _mhchemTexify._go2(inputi);
                if (inputi.type_ === '1st-level escape') {
                    cee = true;
                }
            }
        }
        if (addOuterBraces && !cee && res) {
            res = "{" + res + "}";
        }
        return res;
    },
    _goInner: function (input) {
        return _mhchemTexify.go(input, false);
    },
    _go2: function (buf) {
        var res;
        switch (buf.type_) {
            case 'chemfive':
                res = "";
                var b5 = {
                    a: _mhchemTexify._goInner(buf.a),
                    b: _mhchemTexify._goInner(buf.b),
                    p: _mhchemTexify._goInner(buf.p),
                    o: _mhchemTexify._goInner(buf.o),
                    q: _mhchemTexify._goInner(buf.q),
                    d: _mhchemTexify._goInner(buf.d)
                };
                if (b5.a) {
                    if (b5.a.match(/^[+\-]/)) {
                        b5.a = "{" + b5.a + "}";
                    }
                    res += b5.a + "\\,";
                }
                if (b5.b || b5.p) {
                    res += "{\\vphantom{A}}";
                    res += "^{\\hphantom{" + (b5.b || "") + "}}_{\\hphantom{" + (b5.p || "") + "}}";
                    res += "\\mkern-1.5mu";
                    res += "{\\vphantom{A}}";
                    res += "^{\\smash[t]{\\vphantom{2}}\\llap{" + (b5.b || "") + "}}";
                    res += "_{\\vphantom{2}\\llap{\\smash[t]{" + (b5.p || "") + "}}}";
                }
                if (b5.o) {
                    if (b5.o.match(/^[+\-]/)) {
                        b5.o = "{" + b5.o + "}";
                    }
                    res += b5.o;
                }
                if (buf.dType === 'kv') {
                    if (b5.d || b5.q) {
                        res += "{\\vphantom{A}}";
                    }
                    if (b5.d) {
                        res += "^{" + b5.d + "}";
                    }
                    if (b5.q) {
                        res += "_{\\smash[t]{" + b5.q + "}}";
                    }
                }
                else if (buf.dType === 'oxidation') {
                    if (b5.d) {
                        res += "{\\vphantom{A}}";
                        res += "^{" + b5.d + "}";
                    }
                    if (b5.q) {
                        res += "{\\vphantom{A}}";
                        res += "_{\\smash[t]{" + b5.q + "}}";
                    }
                }
                else {
                    if (b5.q) {
                        res += "{\\vphantom{A}}";
                        res += "_{\\smash[t]{" + b5.q + "}}";
                    }
                    if (b5.d) {
                        res += "{\\vphantom{A}}";
                        res += "^{" + b5.d + "}";
                    }
                }
                break;
            case 'rm':
                res = "\\mathrm{" + buf.p1 + "}";
                break;
            case 'text':
                if (buf.p1.match(/[\^_]/)) {
                    buf.p1 = buf.p1.replace(" ", "~").replace("-", "\\text{-}");
                    res = "\\mathrm{" + buf.p1 + "}";
                }
                else {
                    res = "\\text{" + buf.p1 + "}";
                }
                break;
            case 'roman numeral':
                res = "\\mathrm{" + buf.p1 + "}";
                break;
            case 'state of aggregation':
                res = "\\mskip2mu " + _mhchemTexify._goInner(buf.p1);
                break;
            case 'state of aggregation subscript':
                res = "\\mskip1mu " + _mhchemTexify._goInner(buf.p1);
                break;
            case 'bond':
                res = _mhchemTexify._getBond(buf.kind_);
                if (!res) {
                    throw ["MhchemErrorBond", "mhchem Error. Unknown bond type (" + buf.kind_ + ")"];
                }
                break;
            case 'frac':
                var c = "\\frac{" + buf.p1 + "}{" + buf.p2 + "}";
                res = "\\mathchoice{\\textstyle" + c + "}{" + c + "}{" + c + "}{" + c + "}";
                break;
            case 'pu-frac':
                var d = "\\frac{" + _mhchemTexify._goInner(buf.p1) + "}{" + _mhchemTexify._goInner(buf.p2) + "}";
                res = "\\mathchoice{\\textstyle" + d + "}{" + d + "}{" + d + "}{" + d + "}";
                break;
            case 'tex-math':
                res = buf.p1 + " ";
                break;
            case 'frac-ce':
                res = "\\frac{" + _mhchemTexify._goInner(buf.p1) + "}{" + _mhchemTexify._goInner(buf.p2) + "}";
                break;
            case 'overset':
                res = "\\overset{" + _mhchemTexify._goInner(buf.p1) + "}{" + _mhchemTexify._goInner(buf.p2) + "}";
                break;
            case 'underset':
                res = "\\underset{" + _mhchemTexify._goInner(buf.p1) + "}{" + _mhchemTexify._goInner(buf.p2) + "}";
                break;
            case 'underbrace':
                res = "\\underbrace{" + _mhchemTexify._goInner(buf.p1) + "}_{" + _mhchemTexify._goInner(buf.p2) + "}";
                break;
            case 'color':
                res = "{\\color{" + buf.color1 + "}{" + _mhchemTexify._goInner(buf.color2) + "}}";
                break;
            case 'color0':
                res = "\\color{" + buf.color + "}";
                break;
            case 'arrow':
                var b6 = {
                    rd: _mhchemTexify._goInner(buf.rd),
                    rq: _mhchemTexify._goInner(buf.rq)
                };
                var arrow = _mhchemTexify._getArrow(buf.r);
                if (b6.rd || b6.rq) {
                    if (buf.r === "<=>" || buf.r === "<=>>" || buf.r === "<<=>" || buf.r === "<-->") {
                        arrow = "\\long" + arrow;
                        if (b6.rd) {
                            arrow = "\\overset{" + b6.rd + "}{" + arrow + "}";
                        }
                        if (b6.rq) {
                            if (buf.r === "<-->") {
                                arrow = "\\underset{\\lower2mu{" + b6.rq + "}}{" + arrow + "}";
                            }
                            else {
                                arrow = "\\underset{\\lower6mu{" + b6.rq + "}}{" + arrow + "}";
                            }
                        }
                        arrow = " {}\\mathrel{" + arrow + "}{} ";
                    }
                    else {
                        if (b6.rq) {
                            arrow += "[{" + b6.rq + "}]";
                        }
                        arrow += "{" + b6.rd + "}";
                        arrow = " {}\\mathrel{\\x" + arrow + "}{} ";
                    }
                }
                else {
                    arrow = " {}\\mathrel{\\long" + arrow + "}{} ";
                }
                res = arrow;
                break;
            case 'operator':
                res = _mhchemTexify._getOperator(buf.kind_);
                break;
            case '1st-level escape':
                res = buf.p1 + " ";
                break;
            case 'space':
                res = " ";
                break;
            case 'tinySkip':
                res = '\\mkern2mu';
                break;
            case 'entitySkip':
                res = "~";
                break;
            case 'pu-space-1':
                res = "~";
                break;
            case 'pu-space-2':
                res = "\\mkern3mu ";
                break;
            case '1000 separator':
                res = "\\mkern2mu ";
                break;
            case 'commaDecimal':
                res = "{,}";
                break;
            case 'comma enumeration L':
                res = "{" + buf.p1 + "}\\mkern6mu ";
                break;
            case 'comma enumeration M':
                res = "{" + buf.p1 + "}\\mkern3mu ";
                break;
            case 'comma enumeration S':
                res = "{" + buf.p1 + "}\\mkern1mu ";
                break;
            case 'hyphen':
                res = "\\text{-}";
                break;
            case 'addition compound':
                res = "\\,{\\cdot}\\,";
                break;
            case 'electron dot':
                res = "\\mkern1mu \\bullet\\mkern1mu ";
                break;
            case 'KV x':
                res = "{\\times}";
                break;
            case 'prime':
                res = "\\prime ";
                break;
            case 'cdot':
                res = "\\cdot ";
                break;
            case 'tight cdot':
                res = "\\mkern1mu{\\cdot}\\mkern1mu ";
                break;
            case 'times':
                res = "\\times ";
                break;
            case 'circa':
                res = "{\\sim}";
                break;
            case '^':
                res = "uparrow";
                break;
            case 'v':
                res = "downarrow";
                break;
            case 'ellipsis':
                res = "\\ldots ";
                break;
            case '/':
                res = "/";
                break;
            case ' / ':
                res = "\\,/\\,";
                break;
            default:
                assertNever(buf);
                throw ["MhchemBugT", "mhchem bug T. Please report."];
        }
        return res;
    },
    _getArrow: function (a) {
        switch (a) {
            case "->": return "rightarrow";
            case "\u2192": return "rightarrow";
            case "\u27F6": return "rightarrow";
            case "<-": return "leftarrow";
            case "<->": return "leftrightarrow";
            case "<-->": return "leftrightarrows";
            case "<=>": return "rightleftharpoons";
            case "\u21CC": return "rightleftharpoons";
            case "<=>>": return "Rightleftharpoons";
            case "<<=>": return "Leftrightharpoons";
            default:
                assertNever(a);
                throw ["MhchemBugT", "mhchem bug T. Please report."];
        }
    },
    _getBond: function (a) {
        switch (a) {
            case "-": return "{-}";
            case "1": return "{-}";
            case "=": return "{=}";
            case "2": return "{=}";
            case "#": return "{\\equiv}";
            case "3": return "{\\equiv}";
            case "~": return "{\\tripledash}";
            case "~-": return "{\\rlap{\\lower.1em{-}}\\raise.1em{\\tripledash}}";
            case "~=": return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}";
            case "~--": return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{\\tripledash}}-}";
            case "-~-": return "{\\rlap{\\lower.2em{-}}\\rlap{\\raise.2em{-}}\\tripledash}";
            case "...": return "{{\\cdot}{\\cdot}{\\cdot}}";
            case "....": return "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}";
            case "->": return "{\\rightarrow}";
            case "<-": return "{\\leftarrow}";
            case "<": return "{<}";
            case ">": return "{>}";
            default:
                assertNever(a);
                throw ["MhchemBugT", "mhchem bug T. Please report."];
        }
    },
    _getOperator: function (a) {
        switch (a) {
            case "+": return " {}+{} ";
            case "-": return " {}-{} ";
            case "=": return " {}={} ";
            case "<": return " {}<{} ";
            case ">": return " {}>{} ";
            case "<<": return " {}\\ll{} ";
            case ">>": return " {}\\gg{} ";
            case "\\pm": return " {}\\pm{} ";
            case "\\approx": return " {}\\approx{} ";
            case "$\\approx$": return " {}\\approx{} ";
            case "v": return " \\downarrow{} ";
            case "(v)": return " \\downarrow{} ";
            case "^": return " \\uparrow{} ";
            case "(^)": return " \\uparrow{} ";
            default:
                assertNever(a);
                throw ["MhchemBugT", "mhchem bug T. Please report."];
        }
    }
};
function assertNever(a) { }

// ---- end of mhchemParser ----

  // ============================================================
  // Utilities
  // ============================================================

  const HTML_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => HTML_ESCAPE[c]);
  }

  const warned = new Set();
  function warnOnce(message) {
    if (warned.has(message)) return;
    warned.add(message);
    console.warn('chem-markdown: ' + message);
  }

  // mhchem throws arrays like ["MhchemErrorBond", "mhchem Error. ..."]
  function toError(e) {
    if (e instanceof Error) return e;
    if (Array.isArray(e)) return new Error(e[1] || e[0]);
    return new Error(String(e));
  }

  function parseMhchem(input, type) {
    try {
      return _mhchemParser.go(String(input ?? ''), type);
    } catch (e) {
      throw toError(e);
    }
  }

  const MAX_DEPTH = 20; // guard for \ce inside $...$ inside \ce ...

  // ============================================================
  // Symbols
  // ============================================================

  const GREEK = {
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ϵ', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
    theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ', varkappa: 'ϰ', lambda: 'λ', mu: 'μ', nu: 'ν',
    xi: 'ξ', omicron: 'ο', pi: 'π', varpi: 'ϖ', rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς',
    tau: 'τ', upsilon: 'υ', phi: 'ϕ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
    Alpha: 'Α', Beta: 'Β', Gamma: 'Γ', Delta: 'Δ', Epsilon: 'Ε', Zeta: 'Ζ', Eta: 'Η', Theta: 'Θ',
    Iota: 'Ι', Kappa: 'Κ', Lambda: 'Λ', Mu: 'Μ', Nu: 'Ν', Xi: 'Ξ', Omicron: 'Ο', Pi: 'Π', Rho: 'Ρ',
    Sigma: 'Σ', Tau: 'Τ', Upsilon: 'Υ', Phi: 'Φ', Chi: 'Χ', Psi: 'Ψ', Omega: 'Ω',
    varGamma: 'Γ', varDelta: 'Δ', varTheta: 'Θ', varLambda: 'Λ', varXi: 'Ξ', varPi: 'Π',
    varSigma: 'Σ', varUpsilon: 'Υ', varPhi: 'Φ', varPsi: 'Ψ', varOmega: 'Ω',
  };

  const SYMBOLS = {
    infty: '∞', pm: '±', mp: '∓', times: '×', cdot: '⋅', cdotp: '⋅', centerdot: '⋅', div: '÷',
    circ: '∘', degree: '°', bullet: '•', ast: '∗', star: '⋆', dagger: '†', ddagger: '‡',
    sim: '∼', approx: '≈', simeq: '≃', cong: '≅', equiv: '≡', propto: '∝', ne: '≠', neq: '≠',
    le: '≤', leq: '≤', ge: '≥', geq: '≥', leqslant: '⩽', geqslant: '⩾', ll: '≪', gg: '≫',
    lt: '<', gt: '>', in: '∈', notin: '∉', ni: '∋', subset: '⊂', supset: '⊃', cup: '∪', cap: '∩',
    to: '→', rightarrow: '→', leftarrow: '←', gets: '←', leftrightarrow: '↔', uparrow: '↑',
    downarrow: '↓', updownarrow: '↕', Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔',
    longrightarrow: '⟶', longleftarrow: '⟵', longleftrightarrow: '⟷', Longrightarrow: '⟹',
    Longleftarrow: '⟸', Longleftrightarrow: '⟺', mapsto: '↦', rightleftharpoons: '⇌',
    leftrightharpoons: '⇋', rightleftarrows: '⇄', leftrightarrows: '⇆', rightharpoonup: '⇀',
    leftharpoondown: '↽', nearrow: '↗', searrow: '↘', swarrow: '↙', nwarrow: '↖',
    ldots: '…', dots: '…', cdots: '⋯', vdots: '⋮', ddots: '⋱', prime: '′', partial: '∂',
    nabla: '∇', hbar: 'ℏ', hslash: 'ℏ', ell: 'ℓ', Re: 'ℜ', Im: 'ℑ', aleph: 'ℵ', emptyset: '∅',
    varnothing: '∅', forall: '∀', exists: '∃', neg: '¬', lnot: '¬', land: '∧', wedge: '∧',
    lor: '∨', vee: '∨', oplus: '⊕', ominus: '⊖', otimes: '⊗', odot: '⊙', perp: '⊥', parallel: '∥',
    mid: '∣', angle: '∠', triangle: '△', square: '□', sum: '∑', prod: '∏', int: '∫', oint: '∮',
    sqrt: '√', surd: '√', AA: 'Å', aa: 'å', S: '§', P: '¶', copyright: '©', pounds: '£',
    langle: '⟨', rangle: '⟩', lbrace: '{', rbrace: '}', lbrack: '[', rbrack: ']', vert: '|',
    Vert: '‖', lvert: '|', rvert: '|', lceil: '⌈', rceil: '⌉', lfloor: '⌊', rfloor: '⌋',
    backslash: '\\', tripledash: '┄', ohm: 'Ω', micro: 'µ', permil: '‰', textdegree: '°',
    circledast: '⊛', blacksquare: '■', checkmark: '✓', iff: '⟺', implies: '⟹',
  };

  // Relations get extra space around them in math mode (K = ..., a \le b)
  const RELATIONS = new Set(['=', '<', '>', '≈', '∼', '≃', '≅', '≡', '∝', '≠', '≤', '≥', '⩽', '⩾', '≪', '≫',
    '→', '←', '↔', '⇒', '⇐', '⇔', '⟶', '⟵', '⟷', '⟹', '⟸', '⟺', '⇌', '⇋', '⇄', '⇆', '∈', '∉', '∋', '⊂', '⊃']);

  // Commands that only affect TeX spacing/layout: their argument is skipped or rendered as-is
  const SPACES = { ',': 'thin', ':': 'medium', '>': 'medium', ';': 'thick', '!': 'none', ' ': 'normal',
    quad: 'quad', qquad: 'qquad', enspace: 'medium', thinspace: 'thin', medspace: 'medium',
    thickspace: 'thick', negthinspace: 'none', space: 'normal', nobreakspace: 'normal' };
  const IGNORED = new Set(['displaystyle', 'textstyle', 'scriptstyle', 'scriptscriptstyle', 'limits',
    'nolimits', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr', 'biggl', 'biggr',
    'Biggl', 'Biggr', 'middle', 'nonumber', 'notag', 'relax', 'strut', 'ca']);
  const PASS_THROUGH = new Set(['mathrel', 'mathbin', 'mathord', 'mathop', 'mathopen', 'mathclose',
    'mathpunct', 'mathinner', 'smash', 'llap', 'rlap', 'clap', 'mathllap', 'mathrlap', 'mathclap',
    'boxed', 'fbox', 'hbox', 'mbox', 'ensuremath', 'lower', 'raise']);
  const UPRIGHT_STYLE = { text: 'text', textrm: 'text', textup: 'text', textnormal: 'text', textsf: 'text',
    texttt: 'text', mathrm: 'rm', mathup: 'rm', mathsf: 'rm', mathtt: 'rm', operatorname: 'rm',
    rm: 'rm', mathbf: 'rm-bold', textbf: 'text-bold', boldsymbol: 'math-bold', bm: 'math-bold',
    mathit: 'it', textit: 'text-it', emph: 'text-it', mathnormal: 'math', mathcal: 'rm',
    mathscr: 'rm', mathfrak: 'rm', mathbb: 'rm' };
  const X_ARROWS = { xrightarrow: '->', xleftarrow: '<-', xleftrightarrow: '<->',
    xrightleftharpoons: '<=>', xleftrightharpoons: '<=>', xrightleftarrows: '<-->',
    xRightleftharpoons: '<=>>', xLeftrightharpoons: '<<=>', xlongrightarrow: '->', xlongleftarrow: '<-' };

  const SUPERSCRIPT = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷',
    '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', 'a': 'ᵃ', 'b': 'ᵇ',
    'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
    'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ',
    'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ', 'I': 'ᴵ', 'V': 'ⱽ', '•': '•', '·': '•', '∗': '*', '*': '*',
    '′': '′', '×': 'ˣ', ' ': ' ', 'δ': 'ᵟ', '.': '·', ',': ',' };
  const SUBSCRIPT = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇',
    '8': '₈', '9': '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ',
    'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ',
    's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ', 'v': 'ᵥ', 'x': 'ₓ', ' ': ' ', '.': '.', ',': ',' };
  const FRACTIONS = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕',
    '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚', '1/8': '⅛', '3/8': '⅜',
    '5/8': '⅝', '7/8': '⅞' };

  // Operators of mhchem (operator.kind_) and bonds (bond.kind_)
  const OPERATORS = { '+': '+', '-': '−', '=': '=', '<': '<', '>': '>', '<<': '≪', '>>': '≫',
    '\\pm': '±', '\\approx': '≈', '$\\approx$': '≈', 'v': '↓', '(v)': '↓', '^': '↑', '(^)': '↑' };
  // Bonds: HTML uses the glyph, or SVG lines for the dashed kinds (y in a 0-10 box whose
  // middle (y=5) sits on the math axis; 'dash' lines are drawn dashed); text output uses `text`
  const BONDS = {
    '-': { glyph: '−', text: '−' }, '1': { glyph: '−', text: '−' },
    '=': { glyph: '=', text: '=' }, '2': { glyph: '=', text: '=' },
    '#': { glyph: '≡', text: '≡' }, '3': { glyph: '≡', text: '≡' },
    '~': { lines: [{ y: 5, dash: true }], text: '┄' },
    '~-': { lines: [{ y: 4, dash: true }, { y: 6 }], text: '≂' },
    '~=': { lines: [{ y: 3, dash: true }, { y: 5 }, { y: 7 }], text: '≅' },
    '~--': { lines: [{ y: 3, dash: true }, { y: 5 }, { y: 7 }], text: '≅' },
    '-~-': { lines: [{ y: 3 }, { y: 5, dash: true }, { y: 7 }], text: '≡' },
    '...': { glyph: '⋅⋅⋅', text: '⋅⋅⋅' },
    '....': { glyph: '⋅⋅⋅⋅', text: '⋅⋅⋅⋅' },
    '->': { glyph: '→', text: '→' }, '<-': { glyph: '←', text: '←' },
    '<': { glyph: '<', text: '<' }, '>': { glyph: '>', text: '>' },
  };
  // Reaction arrows: each row is one line with optional heads ('full' | 'harpoon'), 'short' rows are shorter
  const ARROWS = {
    '->': { text: '→', rows: [{ right: 'full' }] },
    '→': { text: '→', rows: [{ right: 'full' }] },
    '⟶': { text: '→', rows: [{ right: 'full' }] },
    '<-': { text: '←', rows: [{ left: 'full' }] },
    '<->': { text: '↔', rows: [{ left: 'full', right: 'full' }] },
    '<-->': { text: '⇄', rows: [{ right: 'full' }, { left: 'full' }] },
    '<=>': { text: '⇌', rows: [{ right: 'harpoon' }, { left: 'harpoon' }] },
    '⇌': { text: '⇌', rows: [{ right: 'harpoon' }, { left: 'harpoon' }] },
    '<=>>': { text: '⇌', rows: [{ right: 'harpoon' }, { left: 'harpoon', short: true }] },
    '<<=>': { text: '⇌', rows: [{ right: 'harpoon', short: true }, { left: 'harpoon' }] },
  };

  // ============================================================
  // Output backends
  //   The renderers below walk the mhchem AST (and small TeX fragments inside it)
  //   and build output through one of these backends.
  // ============================================================

  function createHtmlBackend(prefix) {
    const p = escapeHtml(prefix);
    const span = (cls, inner) => '<span class="' + p + '-' + cls + '">' + inner + '</span>';
    const headSvg = (side, kind) => {
      // viewBox 0 0 10 10, the line runs at y=5 and the tip is at x=10 (right) or x=0 (left)
      const path = side === 'right'
        ? (kind === 'harpoon' ? 'M0.5 1.5L9.5 5' : 'M0.5 1.5L9.5 5L0.5 8.5')
        : (kind === 'harpoon' ? 'M9.5 8.5L0.5 5' : 'M9.5 1.5L0.5 5L9.5 8.5');
      return '<svg class="' + p + '-head ' + p + '-head-' + side + '" viewBox="0 0 10 10" aria-hidden="true">'
        + '<path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    };
    return {
      html: true,
      seq: parts => parts.join(''),
      text: (s, style) => {
        const e = escapeHtml(s);
        if (!e) return '';
        if (style === 'italic') return span('i', e);
        if (style === 'bold') return span('b', e);
        if (style === 'bold-italic') return span('bi', e);
        return e;
      },
      sub: x => x ? '<sub class="' + p + '-sub">' + x + '</sub>' : '',
      sup: x => x ? '<sup class="' + p + '-sup">' + x + '</sup>' : '',
      // stacked scripts (both sup and sub on the same base), align: 'left' | 'right'
      stack: (sup, sub, align) => span('ss' + (align === 'right' ? ' ' + p + '-ss-r' : ''),
        span('ss-sup', sup || '&#8203;') + span('ss-sub', sub || '&#8203;')),
      frac: (num, den) => span('frac', span('num', num) + span('den', den)),
      sqrt: (x, n) => (n ? '<sup class="' + p + '-root">' + n + '</sup>' : '') + '√' + span('sqrt', x),
      over: (over, base, under) => span('over',
        (over ? span('over-top', over) : '') + span('over-base', base) + (under ? span('over-bottom', under) : '')),
      underbrace: x => span('ubrace', x),
      color: (c, x) => '<span style="color:' + escapeHtml(c) + '">' + x + '</span>',
      space: kind => ({ none: '', hair: '&#8202;', thin: '&#8201;', medium: '&#8197;', thick: '&#8196;',
        normal: ' ', nbsp: '&nbsp;', quad: '&emsp;', qquad: '&emsp;&emsp;' })[kind] ?? ' ',
      op: s => span('op', escapeHtml(s)),
      rel: s => span('rel', escapeHtml(s)),
      bond: kind => {
        const { glyph, lines } = BONDS[kind];
        if (glyph) return span('bond', escapeHtml(glyph));
        const paths = lines.map(l => '<line x1="0.5" x2="9.5" y1="' + l.y + '" y2="' + l.y + '"'
          + (l.dash ? ' stroke-dasharray="2.4 1.2"' : '') + '/>').join('');
        return span('bond', '<svg class="' + p + '-bond-svg" viewBox="0 0 10 10" preserveAspectRatio="none" aria-hidden="true">'
          + '<g stroke="currentColor" stroke-width="0.75">' + paths + '</g></svg>');
      },
      arrow: (r, above, below) => {
        const rows = ARROWS[r].rows.map(row => {
          const cls = 'arow' + (row.short ? ' ' + p + '-arow-short' : '');
          return span(cls, span('shaft', '') + (row.left ? headSvg('left', row.left) : '') + (row.right ? headSvg('right', row.right) : ''));
        }).join('');
        // two rows with full heads (⇄) need more room than harpoons (⇌)
        const wide = ARROWS[r].rows.length > 1 && ARROWS[r].rows.some(row => row.left === 'full' || row.right === 'full');
        return span('arrow' + (above || below ? ' ' + p + '-arrow-labeled' : '') + (wide ? ' ' + p + '-arrow-wide' : ''),
          span('arrow-above', above || '&#8203;') + span('arrow-body', rows) + span('arrow-below', below || '&#8203;'));
      },
      group: (cls, x) => span(cls, x),
      error: (src, message) => '<span class="' + p + '-error" title="' + escapeHtml(message) + '">' + escapeHtml(src) + '</span>',
    };
  }

  function mapChars(str, map) {
    let out = '';
    for (const c of str) {
      if (!(c in map)) return null;
      out += map[c];
    }
    return out;
  }

  function createTextBackend() {
    return {
      html: false,
      seq: parts => parts.join(''),
      text: s => s,
      sub: x => {
        if (!x) return '';
        const m = mapChars(x, SUBSCRIPT);
        if (m) return m;
        return x.length === 1 || /^\(.*\)$/.test(x) ? '_' + x : '_(' + x + ')';
      },
      sup: x => {
        if (!x) return '';
        const m = mapChars(x, SUPERSCRIPT);
        return m ?? (x.length === 1 ? '^' + x : '^(' + x + ')');
      },
      stack(sup, sub) { return this.sup(sup) + this.sub(sub); },
      frac: (num, den) => FRACTIONS[num + '/' + den] ?? (num + '/' + den),
      sqrt: (x, n) => (n ? mapChars(n, SUPERSCRIPT) ?? n : '') + '√' + ([...x].length > 1 ? '(' + x + ')' : x),
      over: (over, base, under) => base + (over ? ' [' + over + ']' : '') + (under ? ' (' + under + ')' : ''),
      underbrace: x => x,
      color: (c, x) => x,
      space: kind => ({ none: '', hair: '', thin: ' ', medium: ' ', thick: ' ', normal: ' ',
        nbsp: ' ', quad: '  ', qquad: '    ' })[kind] ?? ' ',
      op: s => ' ' + s + ' ',
      rel: s => ' ' + s + ' ',
      bond: kind => BONDS[kind].text,
      arrow: (r, above, below) => {
        above = above.trim();
        below = below.trim();
        return ' ' + ARROWS[r].text + (above || below ? '[' + above + ']' + (below ? '[' + below + ']' : '') : '') + ' ';
      },
      group: (cls, x) => x,
      error: src => src,
    };
  }

  // ============================================================
  // TeX subset (for $...$, Greek letters, units, raw fragments in the mhchem AST)
  //   mode: 'math' (italic letters, spaces ignored), 'rm' (upright, spaces ignored),
  //         'text' (upright, spaces kept)
  // ============================================================

  function renderTex(src, B, mode, depth) {
    const s = String(src ?? '');
    let i = 0;
    const items = []; // rendered atoms; scripts attach to the last one

    const skipSpaces = () => { while (i < s.length && /\s/.test(s[i])) i++; };

    // Read a braced group's raw contents, or a single token
    function readArg() {
      skipSpaces();
      if (i >= s.length) return '';
      if (s[i] === '{') {
        let level = 0;
        const start = i + 1;
        for (; i < s.length; i++) {
          if (s[i] === '\\') { i++; continue; }
          if (s[i] === '{') level++;
          else if (s[i] === '}' && --level === 0) break;
        }
        const raw = s.slice(start, i);
        i++;
        return raw;
      }
      if (s[i] === '\\') {
        const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        i += m[0].length;
        return m[0];
      }
      return s[i++];
    }

    function readOptional() {
      skipSpaces();
      if (s[i] !== '[') return null;
      let level = 0;
      const start = i + 1;
      for (; i < s.length; i++) {
        if (s[i] === '{') level++;
        else if (s[i] === '}') level--;
        else if (s[i] === ']' && level === 0) break;
      }
      const raw = s.slice(start, i);
      i++;
      return raw;
    }

    const sub = (raw, m = mode) => renderTex(raw, B, m, depth);

    // Delimiter after \left, \right, \big ...
    function readDelimiter() {
      skipSpaces();
      if (s[i] === '\\') {
        const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        i += m[0].length;
        const name = m[1];
        return SYMBOLS[name] ?? (name.length === 1 ? name : '');
      }
      const c = s[i++] ?? '';
      return c === '.' ? '' : c;
    }

    function charText(c) {
      if (mode === 'text') return B.text(c);
      if (c === '-') return B.text('−');
      if (c === "'") return B.text('′');
      if (mode === 'math') {
        if (c === '*') return B.text('∗');
        if (RELATIONS.has(c)) return B.rel(c);
        if (/[a-zA-Z]/.test(c)) return B.text(c, 'italic');
      }
      return B.text(c);
    }

    function styled(styleName, raw) {
      switch (styleName) {
        case 'text': return sub(raw, 'text');
        case 'rm': return sub(raw, 'rm');
        case 'rm-bold': return B.html ? B.group('b', sub(raw, 'rm')) : sub(raw, 'rm');
        case 'text-bold': return B.html ? B.group('b', sub(raw, 'text')) : sub(raw, 'text');
        case 'math-bold': return B.html ? B.group('b', sub(raw, 'math')) : sub(raw, 'math');
        case 'it': return B.html ? B.group('i', sub(raw, 'rm')) : sub(raw, 'rm');
        case 'text-it': return B.html ? B.group('i', sub(raw, 'text')) : sub(raw, 'text');
        default: return sub(raw, 'math');
      }
    }

    function command(name) {
      if (name in GREEK) {
        const ch = GREEK[name];
        // TeX convention: lowercase Greek is italic in math, uppercase is upright
        const lower = ch !== ch.toUpperCase();
        return B.text(ch, mode === 'math' && lower ? 'italic' : undefined);
      }
      if (name in SYMBOLS) {
        const sym = SYMBOLS[name];
        return mode === 'math' && RELATIONS.has(sym) ? B.rel(sym) : B.text(sym);
      }
      if (name in SPACES) return B.space(SPACES[name]);
      if (name.length === 1 && /[{}%_&#$|]/.test(name)) return B.text(name);
      if (name === '\\') return '';
      if (IGNORED.has(name)) return '';
      if (name in UPRIGHT_STYLE) return styled(UPRIGHT_STYLE[name], readArg());
      if (PASS_THROUGH.has(name)) {
        if (name === 'lower' || name === 'raise') { readArg(); } // dimension
        return sub(readArg());
      }
      switch (name) {
        case 'ce': case 'cf':
          return renderMhchemInto(readArg(), 'ce', B, depth + 1);
        case 'pu':
          return renderMhchemInto(readArg(), 'pu', B, depth + 1);
        case 'frac': case 'dfrac': case 'tfrac': case 'cfrac': {
          const num = readArg();
          const den = readArg();
          return B.frac(sub(num), sub(den));
        }
        case 'sqrt': {
          const n = readOptional();
          return B.sqrt(sub(readArg()), n === null ? '' : sub(n));
        }
        case 'overset': case 'stackrel': {
          const over = readArg();
          return B.over(sub(over), sub(readArg()), '');
        }
        case 'underset': {
          const under = readArg();
          return B.over('', sub(readArg()), sub(under));
        }
        case 'underbrace': {
          const body = B.underbrace(sub(readArg()));
          skipSpaces();
          if (s[i] === '_') { i++; return B.over('', body, sub(readArg())); }
          return body;
        }
        case 'overbrace': case 'overline': case 'underline': case 'hat': case 'bar': case 'vec':
        case 'dot': case 'ddot': case 'tilde': case 'widehat': case 'widetilde': case 'overrightarrow': {
          const marks = { hat: '̂', bar: '̄', vec: '⃗', dot: '̇', ddot: '̈',
            tilde: '̃', widehat: '̂', widetilde: '̃', overrightarrow: '⃗', overline: '̅' };
          const body = readArg();
          const mark = marks[name];
          if (mark && [...body].length === 1) return sub(body) + B.text(mark);
          return sub(body);
        }
        case 'color': {
          const c = readArg();
          skipSpaces();
          // \color{red}{x} (mhchem style) or \color{red} x ... (rest of group)
          if (s[i] === '{') return B.color(c, sub(readArg()));
          const rest = s.slice(i);
          i = s.length;
          return B.color(c, sub(rest));
        }
        case 'textcolor': {
          const c = readArg();
          return B.color(c, sub(readArg()));
        }
        case 'left': case 'right':
          return B.text(readDelimiter());
        case 'vphantom': case 'hphantom': case 'phantom':
          readArg();
          return '';
        case 'mkern': case 'mskip': case 'kern': case 'hspace': case 'hskip': {
          // \mkern2mu, \hspace{1em}
          skipSpaces();
          if (s[i] === '{') readArg();
          else { const m = /^-?[\d.]+\s*(mu|em|ex|pt)?/.exec(s.slice(i)); if (m) i += m[0].length; }
          return B.space('thin');
        }
        case 'mathchoice': {
          const first = readArg();
          readArg(); readArg(); readArg();
          return sub(first);
        }
        case 'not':
          return sub(readArg()) + B.text('̸');
        case 'tripledash':
          return B.text('┄');
        default:
          if (name in X_ARROWS) {
            const below = readOptional();
            const above = readArg();
            return B.arrow(X_ARROWS[name], sub(above), below === null ? '' : sub(below));
          }
          warnOnce('unsupported TeX command \\' + name + ' (rendered as text)');
          return B.text('\\' + name);
      }
    }

    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) {
        i++;
        if (mode === 'text') items.push(B.text(' '));
        continue;
      }
      if (c === '{') {
        items.push(sub(readArg()));
        continue;
      }
      if (c === '}') { i++; continue; }
      if (c === '^' || c === '_') {
        // collect ^ and _ that follow the same base
        let supRaw = null;
        let subRaw = null;
        while (i < s.length && (s[i] === '^' || s[i] === '_')) {
          const kind = s[i++];
          const raw = readArg();
          if (kind === '^') supRaw = raw; else subRaw = raw;
          skipSpaces();
        }
        const base = items.pop() ?? '';
        const supOut = supRaw === null ? '' : sub(supRaw);
        const subOut = subRaw === null ? '' : sub(subRaw);
        items.push(base + (supOut && subOut ? B.stack(supOut, subOut, 'left') : B.sup(supOut) + B.sub(subOut)));
        continue;
      }
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
        if (!m) { i++; continue; }
        i += m[0].length;
        items.push(command(m[1]));
        continue;
      }
      if (c === '~') { i++; items.push(B.space('nbsp')); continue; }
      if (c === '$') { i++; continue; }
      i++;
      items.push(charText(c));
    }
    return B.seq(items);
  }

  // ============================================================
  // mhchem AST renderer
  // ============================================================

  function renderMhchemInto(input, type, B, depth) {
    if (depth > MAX_DEPTH) return B.error(input, 'nesting too deep');
    try {
      return renderNodes(parseMhchem(input, type), B, depth);
    } catch (e) {
      return B.error(input, toError(e).message);
    }
  }

  function renderNodes(list, B, depth) {
    if (!list) return '';
    if (!Array.isArray(list)) list = [list];
    const out = [];
    for (let k = 0; k < list.length; k++) {
      const node = list[k];
      if (typeof node === 'string') {
        // TeX fragments; lone braces are just grouping
        if (node === '{' || node === '}') continue;
        out.push(renderTex(node, B, 'math', depth));
        continue;
      }
      if (node?.type_ === 'color0') {
        // \color{red} without argument: colors the rest of the group
        out.push(B.color(node.color, renderNodes(list.slice(k + 1), B, depth)));
        break;
      }
      out.push(renderNode(node, B, depth));
    }
    return B.seq(out);
  }

  // Top level of an HTML formula: keep each term ("x NH3 ^") on one line and allow
  // line breaks only after operators, arrows and enumeration commas (like TeX)
  const isBreakAfter = node => node?.type_ === 'arrow'
    || (node?.type_ === 'operator' && !['v', '(v)', '^', '(^)'].includes(node.kind_))
    || /^comma enumeration/.test(node?.type_ ?? '');

  function renderTerms(list, B) {
    if (!B.html || !Array.isArray(list) || list.some(n => n?.type_ === 'color0')) return renderNodes(list, B, 0);
    const groups = [];
    let current = [];
    for (const node of list) {
      current.push(node);
      if (isBreakAfter(node)) { groups.push(current); current = []; }
    }
    if (current.length) groups.push(current);
    // a zero-width space between the nowrap groups is the only break opportunity
    return groups.map(g => B.group('term', renderNodes(g, B, 0))).join('&#8203;');
  }

  function renderNode(buf, B, depth) {
    const inner = x => renderNodes(x, B, depth);
    switch (buf.type_) {
      case 'chemfive': {
        const a = inner(buf.a);
        const b = inner(buf.b);
        const p = inner(buf.p);
        const o = inner(buf.o);
        const q = inner(buf.q);
        const d = inner(buf.d);
        let res = '';
        if (a) res += B.group('coef', a) + B.space('thin');
        if (b || p) res += b && p ? B.stack(b, p, 'right') : (b ? B.sup(b) : B.sub(p));
        res += o;
        if (buf.dType === 'kv') res += d && q ? B.stack(d, q, 'left') : B.sup(d) + B.sub(q);
        else if (buf.dType === 'oxidation') res += B.sup(d) + B.sub(q);
        else res += B.sub(q) + B.sup(d);
        return res;
      }
      case 'rm':
        return renderTex(buf.p1, B, 'rm', depth);
      case 'text':
        return /[\^_]/.test(buf.p1) ? renderTex(buf.p1, B, 'rm', depth) : B.text(buf.p1);
      case 'roman numeral':
        return B.text(buf.p1);
      case 'state of aggregation':
        return B.html ? B.space('hair') + B.group('state', inner(buf.p1)) : inner(buf.p1);
      case 'state of aggregation subscript':
        return B.group('state', inner(buf.p1));
      case 'bond':
        if (!BONDS[buf.kind_]) throw new Error('mhchem Error. Unknown bond type (' + buf.kind_ + ')');
        return B.bond(buf.kind_);
      case 'frac':
        return B.frac(renderTex(buf.p1, B, 'math', depth), renderTex(buf.p2, B, 'math', depth));
      case 'pu-frac':
      case 'frac-ce':
        return B.frac(inner(buf.p1), inner(buf.p2));
      case 'tex-math':
      case '1st-level escape':
        return renderTex(buf.p1, B, 'math', depth);
      case 'overset':
        return B.over(inner(buf.p1), inner(buf.p2), '');
      case 'underset':
        return B.over('', inner(buf.p2), inner(buf.p1));
      case 'underbrace':
        return B.over('', B.underbrace(inner(buf.p1)), inner(buf.p2));
      case 'color':
        return B.color(buf.color1, inner(buf.color2));
      case 'arrow': {
        if (!ARROWS[buf.r]) throw new Error('mhchem Error. Unknown arrow type (' + buf.r + ')');
        return B.arrow(buf.r, inner(buf.rd), inner(buf.rq));
      }
      case 'operator':
        return B.op(OPERATORS[buf.kind_] ?? buf.kind_);
      case 'space': return B.space('normal');
      case 'tinySkip': return B.space('hair');
      case 'entitySkip': return B.space('nbsp');
      case 'pu-space-1': return B.space('nbsp');
      case 'pu-space-2': return B.space('thin');
      case '1000 separator': return B.space('thin');
      case 'commaDecimal': return B.text(',');
      case 'comma enumeration L': return renderTex(buf.p1, B, 'math', depth) + B.space('thick');
      case 'comma enumeration M': return renderTex(buf.p1, B, 'math', depth) + B.space('medium');
      case 'comma enumeration S': return renderTex(buf.p1, B, 'math', depth) + B.space('hair');
      case 'hyphen': return B.text('-');
      case 'addition compound': return B.html ? B.op('·') : '·';
      case 'electron dot': return B.text('•');
      case 'KV x': return B.text('×');
      case 'prime': return B.text('′');
      case 'cdot': return B.op('⋅');
      case 'tight cdot': return B.text('⋅');
      case 'times': return B.op('×');
      case 'circa': return B.text('∼');
      case '^': return B.text('↑');
      case 'v': return B.text('↓');
      case 'ellipsis': return B.text('…');
      case '/': return B.text('/');
      case ' / ': return B.space('thin') + B.text('/') + B.space('thin');
      default:
        warnOnce('unknown mhchem node type "' + buf.type_ + '"');
        return B.error(JSON.stringify(buf), 'unknown node type ' + buf.type_);
    }
  }

  // ============================================================
  // Default styles (injected once per prefix)
  // ============================================================

  function stylesFor(prefix) {
    const p = '.' + prefix;
    return [
      p + '-formula,' + p + '-pu{font-style:normal}',
      p + '-term,' + p + '-pu{white-space:nowrap}',
      p + '-i{font-style:italic}',
      p + '-b{font-weight:bold}',
      p + '-bi{font-weight:bold;font-style:italic}',
      p + '-sub,' + p + '-sup{font-size:.7em;line-height:0;position:relative}',
      p + '-sub{vertical-align:-.25em}',
      p + '-sup{vertical-align:.55em}',
      // inline-flex boxes use the first row as baseline, so center them on the text instead (vertical-align:middle)
      p + '-ss{display:inline-flex;flex-direction:column;align-items:flex-start;vertical-align:middle;font-size:.7em;line-height:.95}',
      p + '-ss-r{align-items:flex-end}',
      p + '-coef{}',
      p + '-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-size:.7em;line-height:1.05;margin:0 .08em}',
      p + '-num{border-bottom:.08em solid currentColor;padding:0 .12em}',
      p + '-den{padding:0 .12em}',
      p + '-sqrt{border-top:.07em solid currentColor;padding-left:.05em}',
      p + '-root{font-size:.6em;vertical-align:.6em;margin-right:-.3em}',
      p + '-over{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle}',
      p + '-over-top,' + p + '-over-bottom{font-size:.7em;line-height:1.1}',
      p + '-ubrace{border-bottom:.08em solid currentColor;border-radius:0 0 .4em .4em;padding:0 .1em .1em}',
      p + '-op{margin:0 .22em}',
      p + '-rel{margin:0 .28em}',
      p + '-bond{margin:0 .03em}',
      // 1em tall box from -0.2em to 0.8em, so y=5 is at 0.3em (the math axis, where "−" sits)
      p + '-bond-svg{display:inline-block;width:.75em;height:1em;vertical-align:-.2em;overflow:visible}',
      p + '-state{}',
      p + '-arrow{display:inline-flex;flex-direction:column;align-items:stretch;vertical-align:middle;margin:0 .3em;min-width:2.2em}',
      p + '-arrow-above,' + p + '-arrow-below{font-size:.7em;line-height:1.15;text-align:center;padding:0 .35em;white-space:nowrap}',
      // rows overlap by their head overflow so that double arrows (⇌) sit about .22em apart
      p + '-arrow-body{display:flex;flex-direction:column;padding:.2em 0}',
      p + '-arow{position:relative;display:block;height:.6em;margin:-.19em 0}',
      p + '-arrow-wide ' + p + '-arow{margin:-.06em 0}',
      p + '-arow-short{margin-left:.45em;margin-right:.45em}',
      p + '-shaft{position:absolute;left:.05em;right:.05em;top:50%;border-top:.07em solid currentColor;transform:translateY(-50%)}',
      p + '-head{position:absolute;top:0;width:.5em;height:.6em;overflow:visible}',
      p + '-head-right{right:0}',
      p + '-head-left{left:0}',
      p + '-error{color:#c0392b;font-family:monospace}',
    ].join('\n');
  }

  const injectedPrefixes = new Set();
  function ensureStyles(prefix) {
    if (!config.injectStyles || typeof document === 'undefined' || !document.head) return;
    if (injectedPrefixes.has(prefix)) return;
    injectedPrefixes.add(prefix);
    const id = 'chem-markdown-style-' + prefix;
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = stylesFor(prefix);
    document.head.appendChild(style);
  }

  // ============================================================
  // Public rendering functions
  // ============================================================

  function normalizeType(options) {
    const type = options?.type ?? 'ce';
    if (type !== 'ce' && type !== 'pu') throw new Error('chem-markdown: unknown type "' + type + '" (use "ce" or "pu")');
    return type;
  }

  function parse(input, options) {
    return parseMhchem(input, normalizeType(options));
  }

  function toHtml(input, options) {
    const type = normalizeType(options);
    const prefix = options?.prefix ?? config.prefix;
    ensureStyles(prefix);
    const B = createHtmlBackend(prefix);
    const body = renderTerms(parseMhchem(input, type), B);
    return B.group(type === 'pu' ? 'pu' : 'formula', body);
  }

  function toText(input, options) {
    const type = normalizeType(options);
    return renderNodes(parseMhchem(input, type), createTextBackend(), 0)
      .replace(/[  ]{2,}/g, ' ')
      .trim();
  }

  function toLatex(input, options) {
    const type = normalizeType(options);
    try {
      return mhchemParser.toTex(String(input ?? ''), type);
    } catch (e) {
      throw toError(e);
    }
  }

  // ============================================================
  // Auto rendering (mermaid-style)
  //   Block:  <pre class="chem">, ```chem (<pre><code class="language-chem">)
  //           <pre class="pu">,   ```pu   (<pre><code class="language-pu">)
  //   Inline: <span class="chem">, `chem:...`, <span class="pu">, `pu:...`
  //   Lines starting with "smiles:" are drawn with SmilesDrawer if it is loaded.
  // ============================================================

  const config = {
    startOnLoad: true,
    prefix: 'chem',
    injectStyles: true,
    smiles: {},
  };

  const SMILES_PREFIX = /^smiles:\s*/i;
  const INLINE_CODE_PREFIX = /^(chem|pu):/;
  const DEFAULT_SELECTOR = 'pre.chem, pre > code.language-chem, span.chem, pre.pu, pre > code.language-pu, span.pu, code';

  function renderStructure(smiles) {
    const { width = 200, height = 150, ...drawerOptions } = config.smiles;
    const SD = global.SmilesDrawer;
    if (!SD) {
      console.warn('chem-markdown: SmilesDrawer is not loaded; cannot draw "' + smiles + '"');
      return renderError(smiles);
    }
    const canvas = document.createElement('canvas');
    canvas.className = config.prefix + '-structure';
    canvas.width = width;
    canvas.height = height;
    // Draw after the canvas is attached to the page (see flushDrawQueue)
    drawQueue.push(() => {
      const drawer = new SD.Drawer({ width, height, ...drawerOptions });
      SD.parse(smiles, tree => {
        drawer.draw(tree, canvas, 'light', false);
      }, err => {
        console.warn('chem-markdown: invalid SMILES "' + smiles + '"', err);
        canvas.replaceWith(renderError(smiles));
      });
    });
    return canvas;
  }

  const drawQueue = [];
  function flushDrawQueue() {
    drawQueue.splice(0).forEach(draw => draw());
  }

  function renderError(source, message) {
    const span = document.createElement('span');
    span.className = config.prefix + '-error';
    span.textContent = source;
    if (message) span.title = message;
    return span;
  }

  // Render one source line into a DOM node (formula/equation, units or structure)
  function renderSource(source, type) {
    if (type === 'ce' && SMILES_PREFIX.test(source)) return renderStructure(source.replace(SMILES_PREFIX, '').trim());
    try {
      const span = document.createElement('span');
      span.innerHTML = toHtml(source, { type, prefix: config.prefix });
      return span.firstChild ?? span;
    } catch (e) {
      console.warn('chem-markdown: cannot render "' + source + '": ' + e.message);
      return renderError(source, e.message);
    }
  }

  function renderBlock(target, text, type) {
    const block = document.createElement('div');
    block.className = config.prefix + '-block';
    block.dataset.processed = 'true';
    text.split(/\r?\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
      const row = document.createElement('div');
      row.className = config.prefix + '-line';
      row.appendChild(renderSource(line, type));
      block.appendChild(row);
    });
    target.replaceWith(block);
  }

  function renderInline(target, text, type) {
    const span = document.createElement('span');
    span.className = config.prefix + '-inline';
    span.dataset.processed = 'true';
    span.appendChild(renderSource(text.trim(), type));
    target.replaceWith(span);
  }

  const typeOf = el => (el.classList.contains('pu') || el.classList.contains('language-pu') ? 'pu' : 'ce');

  // Decide how an element should be rendered; returns null if it is not a target
  function classify(el) {
    if (el.dataset?.processed === 'true') return null;
    const tag = el.tagName;
    if (tag === 'CODE') {
      const pre = el.parentElement;
      if (pre?.tagName === 'PRE') {
        const isTarget = el.classList.contains('language-chem') || el.classList.contains('language-pu');
        return isTarget ? { kind: 'block', target: pre, text: el.textContent, type: typeOf(el) } : null;
      }
      const m = INLINE_CODE_PREFIX.exec(el.textContent);
      return m
        ? { kind: 'inline', target: el, text: el.textContent.slice(m[0].length), type: m[1] === 'pu' ? 'pu' : 'ce' }
        : null;
    }
    if (tag === 'PRE' || tag === 'DIV') return { kind: 'block', target: el, text: el.textContent, type: typeOf(el) };
    return { kind: 'inline', target: el, text: el.textContent, type: typeOf(el) };
  }

  function run(options = {}) {
    if (typeof document === 'undefined') return;
    ensureStyles(config.prefix);
    const elements = options.nodes
      ? Array.from(options.nodes)
      : Array.from(document.querySelectorAll(options.querySelector ?? DEFAULT_SELECTOR));
    for (const el of elements) {
      if (!el.isConnected) continue; // already replaced as part of another match
      const item = classify(el);
      if (!item || item.target.dataset?.processed === 'true') continue;
      if (item.kind === 'block') renderBlock(item.target, item.text, item.type);
      else renderInline(item.target, item.text, item.type);
    }
    flushDrawQueue();
  }

  function initialize(userConfig = {}) {
    Object.assign(config, userConfig);
  }

  function startOnLoad() {
    if (typeof document === 'undefined') return;
    const start = () => { if (config.startOnLoad) run(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else setTimeout(start, 0); // let a synchronous initialize() call run first
  }

  // Public API
  var ChemMarkdown = {
    // Parse to the mhchem AST ({ type: 'ce' | 'pu' })
    parse: parse,

    // Render to HTML ({ type: 'ce' | 'pu', prefix })
    toHtml: toHtml,

    // Render to Unicode text ({ type })
    toText: toText,

    // Render to LaTeX, identical to mhchem ({ type })
    toLatex: toLatex,

    // Configure auto rendering (startOnLoad, prefix, injectStyles, smiles)
    initialize: initialize,

    // Render <pre class="chem">, ```chem, <span class="chem">, `chem:...` (and the pu variants) in the page
    run: run,

    // Version
    version: '1.0.0'
  };

  startOnLoad();

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChemMarkdown;
  } else if (typeof define === 'function' && define.amd) {
    define(function() { return ChemMarkdown; });
  } else {
    global.ChemMarkdown = ChemMarkdown;
  }

})(typeof window !== 'undefined' ? window : this);
