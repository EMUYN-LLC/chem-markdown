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

  /* @@MHCHEM_PARSER@@ */

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
