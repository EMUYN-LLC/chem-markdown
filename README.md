# chem-markdown

English | [日本語](README.ja.md)

A browser library that renders chemical formulas, equations and units written in **the same syntax as mhchem (`\ce` / `\pu`)** to HTML, Unicode text and LaTeX.

## Features

- ⚗️ Same syntax as [mhchem](https://mhchem.github.io/MathJax-mhchem/) for MathJax and KaTeX — the contents of `\ce{...}` work as-is
- 🔬 Formulas, charges, isotopes, oxidation states, equations (all arrow types, labels above/below arrows), precipitates and gases, bonds, hydrates, states of aggregation and more
- 📏 Physical units with `\pu` (e.g. `123 kJ/mol`, `8.314 J K-1 mol-1`)
- 🎨 Output as HTML, Unicode text or LaTeX. The LaTeX output is identical to mhchem's
- 📦 A single `<script>` tag, no build step, CDN-ready. No MathJax required
- ✨ mermaid-style auto rendering: just write `<pre class="chem">` or ` ```chem `
- 🧬 Structural formulas from SMILES (when SmilesDrawer is loaded)

Parsing is done by the official parser written by the author of mhchem, [mhchemParser](https://github.com/mhchem/mhchemParser) (Apache-2.0), which is bundled. Formulas are therefore interpreted exactly as mhchem interprets them.

## Installation

Load `dist/chem-markdown.js` with a `<script>` tag. It defines the global variable `ChemMarkdown`.

### From the CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/gh/EMUYN-LLC/chem-markdown@v1.0.0/dist/chem-markdown.js"></script>
<script>
  document.body.innerHTML = ChemMarkdown.toHtml('H2O');
</script>
```

`@v1.0.0` is a release tag. Always specify a tag so that the version you use stays fixed.

### Self-hosting

Copy `dist/chem-markdown.js` to your site and load it.

```html
<script src="chem-markdown.js"></script>
```

## Usage

```html
<script src="chem-markdown.js"></script>
<script>
  // HTML
  ChemMarkdown.toHtml('H2O');
  // => <span class="chem-formula"><span class="chem-term">H<sub class="chem-sub">2</sub>O</span></span>

  // Unicode text
  ChemMarkdown.toText('H2O');
  // => H₂O

  // LaTeX (identical to mhchem)
  ChemMarkdown.toLatex('H2O');
  // => {\mathrm{H}{\vphantom{A}}_{\smash[t]{2}}\mathrm{O}}

  // Units (\pu)
  ChemMarkdown.toText('8.314 J K-1 mol-1', { type: 'pu' });
  // => 8.314 J K⁻¹ mol⁻¹
</script>
```

### Options

| Option | Applies to | Description |
|------|------|------|
| `type` | all functions | `'ce'` (formulas and equations, default) or `'pu'` (units) |
| `prefix` | `toHtml` | Prefix of the generated CSS class names (default: `'chem'`) |

```javascript
ChemMarkdown.toHtml('H2O', { prefix: 'my' });
// => <span class="my-formula"><span class="my-term">H<sub class="my-sub">2</sub>O</span></span>
```

### Getting the AST

`parse` returns mhchem's parse result (AST) as-is.

```javascript
ChemMarkdown.parse('H2O');
// [
//   { type_: 'chemfive', a: [], b: [], p: [], o: [{ type_: 'rm', p1: 'H' }], q: ['2'], d: [] },
//   { type_: 'chemfive', a: [], b: [], p: [], o: [{ type_: 'rm', p1: 'O' }], q: [], d: [] }
// ]
```

### Errors

`toHtml`, `toText`, `toLatex` and `parse` throw an `Error` when mhchem cannot parse the input (e.g. `A \bond{?} B`). Auto rendering shows such input as-is with the `.chem-error` class instead.

## Auto rendering (mermaid-style)

On a page that loads chem-markdown, the following markup is rendered automatically when the page loads. Each line is one formula, and lines starting with `smiles:` are drawn as structural formulas. For units, use `pu` instead of `chem`.

### Blocks

```html
<pre class="chem">
2H2 + O2 -> 2H2O
smiles: CCO
</pre>

<pre class="pu">
8.314 J K-1 mol-1
</pre>
```

### Inline

```html
Water <span class="chem">H2O</span> and ethanol <span class="chem">smiles:CCO</span>
Gas constant <span class="pu">8.314 J K-1 mol-1</span>
```

### Markdown

On pages where Markdown is converted to HTML (with marked etc.), ` ```chem ` and ` ```pu ` code blocks and inline code starting with `chem:` or `pu:` are rendered.

````markdown
Water `chem:H2O`, ethanol `chem:smiles:CCO`, heat of formation `pu:-286 kJ/mol`

```chem
2H2 + O2 -> 2H2O
smiles: c1ccccc1
```
````

If the Markdown is converted later, turn off automatic rendering and call `run()` after converting (see [examples/markdown.html](examples/markdown.html)).

```javascript
ChemMarkdown.initialize({ startOnLoad: false });
output.innerHTML = marked.parse(markdownText);
ChemMarkdown.run();
```

### Structural formulas (SMILES)

`smiles:` lines are drawn on a `<canvas>` with [SmilesDrawer](https://github.com/reymond-group/smilesDrawer). Load SmilesDrawer before chem-markdown only if you use structural formulas. If it is not loaded, or the SMILES cannot be parsed, the original text is shown with the `.chem-error` class.

```html
<script src="https://unpkg.com/smiles-drawer@2.0.1/dist/smiles-drawer.min.js"></script>
<script src="chem-markdown.js"></script>
```

### Configuration and manual rendering

```javascript
ChemMarkdown.initialize({
  startOnLoad: true,   // render automatically on page load (default: true)
  prefix: 'chem',      // prefix of the generated CSS class names (default: 'chem')
  injectStyles: true,  // insert the default stylesheet into the page (default: true)
  smiles: {            // options passed to SmilesDrawer.Drawer
    width: 200,        // canvas width (default: 200)
    height: 150,       // canvas height (default: 150)
  },
});

// Render elements added later
ChemMarkdown.run();                                // whole page
ChemMarkdown.run({ querySelector: '.my-chem' });   // by selector
ChemMarkdown.run({ nodes: [element1, element2] }); // given elements
```

Rendered elements get `data-processed="true"`, so calling `run()` repeatedly never renders anything twice. Call `initialize()` right after loading chem-markdown (before the page finishes loading).

Elements passed via `querySelector` or `nodes` are rendered as blocks if they are `<pre>` or `<div>`, and inline otherwise. Elements with the class `pu` (or `language-pu`) are rendered as units.

## Syntax

The syntax is the same as mhchem; see the [mhchem manual](https://mhchem.github.io/MathJax-mhchem/) for details. Commonly used notation:

| Input | Text output | Description |
|------|------|------|
| `H2O` | H₂O | Numbers become subscripts |
| `Na+`, `SO4^2-`, `[AgCl2]-` | Na⁺, SO₄²⁻, [AgCl₂]⁻ | Charges (a trailing `+` / `-` is a charge) |
| `2H2O`, `1/2 O2`, `$n$ H2O` | 2 H₂O, ½ O₂, n H₂O | Stoichiometric numbers |
| `^{14}_{6}C`, `^{227}_{90}Th+` | ¹⁴₆C, ²²⁷₉₀Th⁺ | Isotopes |
| `Fe^{II}Fe^{III}2O4` | FeᴵᴵFeᴵᴵᴵ₂O₄ | Oxidation states |
| `A -> B`, `A <- B` | A → B, A ← B | Reaction arrows |
| `A <=> B`, `A <=>> B`, `A <<=> B` | A ⇌ B | Equilibrium (balanced / biased) |
| `A <-> B`, `A <--> B` | A ↔ B, A ⇄ B | Resonance, both directions |
| `A ->[H2O] B`, `A ->[$\Delta$][-H2O] B` | A →[H₂O] B | Labels above/below arrows |
| `BaSO4 v`, `O2 ^` | BaSO₄ ↓, O₂ ↑ | Precipitate / gas (needs a space before) |
| `H2O(l)`, `NaCl(aq)` | H₂O(l), NaCl(aq) | States of aggregation |
| `CuSO4*5H2O`, `CuSO4.5H2O` | CuSO₄·5 H₂O | Hydrates |
| `CH2=CH2`, `CH#CH`, `C6H5-CHO` | CH₂=CH₂, CH≡CH, C₆H₅−CHO | Bonds |
| `A\bond{~}B`, `A\bond{...}B` | A┄B, A⋅⋅⋅B | Special bonds |
| `[Cu(NH3)4]^2+` | [Cu(NH₃)₄]²⁺ | Complex ions |
| `\alpha`, `\mu-Cl`, `NO_x` | α, μ-Cl, NOₓ | Greek letters, variables |
| `OCO^{.-}`, `CH3^{.}` | OCO•⁻, CH₃• | Radicals |
| `A + B`, `A = B`, `A \pm B` | A + B, A = B, A ± B | Operators (spaces around) |

Units (`type: 'pu'`)

| Input | Text output |
|------|------|
| `123 kJ/mol`, `123 kJ//mol` | 123 kJ/mol (`//` renders as a fraction) |
| `8.314 J K-1 mol-1` | 8.314 J K⁻¹ mol⁻¹ |
| `6.02e23 mol-1` | 6.02 ⋅ 10²³ mol⁻¹ |
| `-273.15 \degree C` | −273.15 °C |

> Note: in mhchem a trailing `-` is a charge. A polymer repeat unit written as `[-CH2-CH2-]_n` shows "CH₂⁻"; to write a bond, use `{-}` as in `[-CH2-CH2{-}]_n`. MathJax's mhchem renders it the same way.

### TeX inside `$...$`

For the HTML and text output, TeX inside `$...$` and commands such as `\alpha` are converted within this range:

- Greek letters and common symbols (`\Delta`, `\infty`, `\pm`, `\times`, `\approx`, `\le`, ...)
- `\frac`, `\sqrt`, `^`, `_`
- `\text`, `\mathrm`, `\underset`, `\overset`, nested `\ce`

Other TeX commands are shown by name with a console warning. To render arbitrary math exactly, display the output of `toLatex` with MathJax or KaTeX.

The text output is an approximation using Unicode superscript and subscript characters. Characters without a Unicode equivalent are written as `_(...)` / `^(...)`, and arrow labels as `→[above][below]`.

## CSS classes of the HTML output

The output of `toHtml` uses the following classes (with the default prefix `chem`). The default stylesheet needed for stacked scripts and arrows is inserted into the page automatically in browsers (`<style id="chem-markdown-style-chem">`). To opt out, use `initialize({ injectStyles: false })`.

| Class | Element |
|------|------|
| `.chem-formula` / `.chem-pu` | Whole formula or equation / whole unit expression |
| `.chem-term` | A term of an equation (no line breaks inside) |
| `.chem-sub` / `.chem-sup` | Subscript / superscript |
| `.chem-ss` | Stacked scripts (isotopes, Kröger-Vink notation) |
| `.chem-coef` | Stoichiometric number |
| `.chem-frac` | Fraction |
| `.chem-arrow` | Reaction arrow (labels: `.chem-arrow-above`, `.chem-arrow-below`) |
| `.chem-op` / `.chem-rel` | Operator / relation |
| `.chem-bond` | Bond |
| `.chem-state` | State of aggregation |
| `.chem-i` / `.chem-b` | Italic / bold |
| `.chem-over` | `\underset` / `\overset` |
| `.chem-error` | Input that could not be rendered |

Auto rendering also adds these classes:

- `.chem-block` - a whole block
- `.chem-line` - one line in a block
- `.chem-inline` - inline element
- `.chem-structure` - `<canvas>` of a structural formula

## API

| Function / property | Description |
|------|------|
| `ChemMarkdown.toHtml(input, options?)` | Render to HTML (`type`, `prefix`) |
| `ChemMarkdown.toText(input, options?)` | Render to Unicode text (`type`) |
| `ChemMarkdown.toLatex(input, options?)` | Render to LaTeX, identical to mhchem (`type`) |
| `ChemMarkdown.parse(input, options?)` | Return mhchem's AST (`type`) |
| `ChemMarkdown.initialize(config)` | Configure auto rendering (see [Configuration and manual rendering](#configuration-and-manual-rendering)) |
| `ChemMarkdown.run(options?)` | Render target elements in the page |
| `ChemMarkdown.version` | Library version string |

## Manual

A detailed manual with live examples of the syntax, API, auto rendering and CSS is in [docs/manual.html](docs/manual.html) (Japanese: [docs/manual.ja.html](docs/manual.ja.html)). It can be opened directly in a browser.

## Demos

- `index.html`: chem-markdown output together with formulas and equations rendered by MathJax (mhchem) and structures drawn by SmilesDrawer.
- `examples/markdown.html`: converting Markdown to HTML with marked, then rendering it.
- `examples/mhchem.html`: the examples of the mhchem manual rendered side by side by chem-markdown and MathJax mhchem.

`examples/mhchem.html` loads the example list (`tests/mhchem-examples.json`), so open it through a local server (e.g. `python -m http.server`).

## Development

`dist/chem-markdown.js` is generated by embedding `vendor/mhchemParser.js` into `src/chem-markdown.js`. After changing the source, run (requires Node.js, no dependencies):

```bash
node tools/build.mjs
```

`tests/mhchem-examples.json` is a collection of the mhchem manual's examples used by `examples/mhchem.html`.

## License

MIT

The bundled mhchemParser (`vendor/mhchemParser.js`) is licensed under the Apache License 2.0 (`vendor/mhchemParser.LICENSE.txt`).
