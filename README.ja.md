# chem-markdown

[English](README.md) | 日本語

化学式・反応式・単位を **mhchem (`\ce` / `\pu`) と同じ記法** で書き、HTML・テキスト (Unicode)・LaTeX に変換するブラウザ向けライブラリ

## 特徴

- ⚗️ 記法は MathJax・KaTeX の [mhchem](https://mhchem.github.io/MathJax-mhchem/) と同じ。`\ce{...}` の中身がそのまま使える
- 🔬 化学式、電荷、同位体、酸化数、反応式 (全種類の矢印・矢印の上下の条件)、沈殿・気体、結合、水和物、状態記号などに対応
- 📏 単位の `\pu` (例: `123 kJ/mol`、`8.314 J K-1 mol-1`) にも対応
- 🎨 HTML、テキスト (Unicode)、LaTeX 形式への出力。LaTeX 出力は mhchem と完全に同じ
- 📦 `<script>` タグ 1 つで使える (ビルド不要・CDN 配信向け)。MathJax は不要
- ✨ mermaid のように `<pre class="chem">` や ` ```chem ` を書くだけで自動変換
- 🧬 構造式 (SMILES) の描画 (SmilesDrawer を読み込んだ場合)

解析には mhchem 作者による公式パーサ [mhchemParser](https://github.com/mhchem/mhchemParser) (Apache-2.0) を同梱しているので、式の解釈は mhchem と同じです。

## 導入

`dist/chem-markdown.js` を `<script>` タグで読み込むと、グローバル変数 `ChemMarkdown` が使えるようになります。

### CDN (jsDelivr) から読み込む

```html
<script src="https://cdn.jsdelivr.net/gh/EMUYN-LLC/chem-markdown@v1.0.0/dist/chem-markdown.js"></script>
<script>
  document.body.innerHTML = ChemMarkdown.toHtml('H2O');
</script>
```

URL の `@v1.0.0` はリリースのタグです。使うバージョンを固定するため、タグを指定してください。

### ファイルを直接置く

`dist/chem-markdown.js` を自分のサイトにコピーして読み込みます。

```html
<script src="chem-markdown.js"></script>
```

## 使い方

```html
<script src="chem-markdown.js"></script>
<script>
  // HTML 出力
  ChemMarkdown.toHtml('H2O');
  // => <span class="chem-formula"><span class="chem-term">H<sub class="chem-sub">2</sub>O</span></span>

  // テキスト出力 (Unicode)
  ChemMarkdown.toText('H2O');
  // => H₂O

  // LaTeX 出力 (mhchem と同じ)
  ChemMarkdown.toLatex('H2O');
  // => {\mathrm{H}{\vphantom{A}}_{\smash[t]{2}}\mathrm{O}}

  // 単位 (\pu)
  ChemMarkdown.toText('8.314 J K-1 mol-1', { type: 'pu' });
  // => 8.314 J K⁻¹ mol⁻¹
</script>
```

### オプション

| オプション | 対象 | 説明 |
|------|------|------|
| `type` | すべての関数 | `'ce'` (化学式・反応式、デフォルト) または `'pu'` (単位) |
| `prefix` | `toHtml` | 出力する CSS クラス名のプレフィックス (デフォルト: `'chem'`) |

```javascript
ChemMarkdown.toHtml('H2O', { prefix: 'my' });
// => <span class="my-formula"><span class="my-term">H<sub class="my-sub">2</sub>O</span></span>
```

### AST の取得

`parse` は mhchem の解析結果 (AST) をそのまま返します。

```javascript
ChemMarkdown.parse('H2O');
// [
//   { type_: 'chemfive', a: [], b: [], p: [], o: [{ type_: 'rm', p1: 'H' }], q: ['2'], d: [] },
//   { type_: 'chemfive', a: [], b: [], p: [], o: [{ type_: 'rm', p1: 'O' }], q: [], d: [] }
// ]
```

### エラー

`toHtml`・`toText`・`toLatex`・`parse` は、mhchem が解析できない式 (例: `A \bond{?} B`) のとき `Error` を投げます。自動変換では、そうした式を元の文字列のまま `.chem-error` 付きで表示します。

## 自動変換 (mermaid 風)

chem-markdown を読み込んだページでは、次のように書いた部分がページ読み込み時に自動で変換されます。1 行が 1 つの式で、`smiles:` で始まる行は構造式として描きます。単位は `chem` の代わりに `pu` を使います。

### ブロック

```html
<pre class="chem">
2H2 + O2 -> 2H2O
smiles: CCO
</pre>

<pre class="pu">
8.314 J K-1 mol-1
</pre>
```

### インライン

```html
水 <span class="chem">H2O</span> とエタノール <span class="chem">smiles:CCO</span>
気体定数 <span class="pu">8.314 J K-1 mol-1</span>
```

### Markdown

Markdown を HTML に変換したページ (marked など) では、` ```chem `・` ```pu ` のコードブロックと、`chem:`・`pu:` で始まるインラインコードが変換されます。

````markdown
水 `chem:H2O` とエタノール `chem:smiles:CCO`、生成熱 `pu:-286 kJ/mol`

```chem
2H2 + O2 -> 2H2O
smiles: c1ccccc1
```
````

Markdown をあとから HTML にする場合は、自動実行を止めて、変換後に `run()` を呼びます (例: [examples/markdown.html](examples/markdown.html))。

```javascript
ChemMarkdown.initialize({ startOnLoad: false });
output.innerHTML = marked.parse(markdownText);
ChemMarkdown.run();
```

### 構造式 (SMILES)

`smiles:` の行は [SmilesDrawer](https://github.com/reymond-group/smilesDrawer) で `<canvas>` に描きます。構造式を使うときだけ、chem-markdown より前に SmilesDrawer を読み込んでください。読み込まれていない場合や SMILES が解析できない場合は、元の文字列を `.chem-error` 付きで表示します。

```html
<script src="https://unpkg.com/smiles-drawer@2.0.1/dist/smiles-drawer.min.js"></script>
<script src="chem-markdown.js"></script>
```

### 設定と手動実行

```javascript
ChemMarkdown.initialize({
  startOnLoad: true,   // ページ読み込み時に自動変換する (デフォルト: true)
  prefix: 'chem',      // 出力する CSS クラス名のプレフィックス (デフォルト: 'chem')
  injectStyles: true,  // 標準 CSS をページに入れる (デフォルト: true)
  smiles: {            // SmilesDrawer.Drawer に渡すオプション
    width: 200,        // canvas の幅 (デフォルト: 200)
    height: 150,       // canvas の高さ (デフォルト: 150)
  },
});

// 後から追加した要素を変換する
ChemMarkdown.run();                                // ページ全体
ChemMarkdown.run({ querySelector: '.my-chem' });   // セレクタで指定
ChemMarkdown.run({ nodes: [element1, element2] }); // 要素を直接指定
```

一度変換した要素には `data-processed="true"` が付き、`run()` を繰り返し呼んでも二重には変換されません。`initialize()` は、chem-markdown を読み込んだ直後 (ページ読み込みが終わる前) に呼んでください。

`querySelector` や `nodes` で指定した要素は、`<pre>`・`<div>` ならブロックとして、それ以外はインラインとして変換します。クラス `pu` (または `language-pu`) が付いた要素は単位として変換します。

## 記法

記法は mhchem と同じです。詳しくは [mhchem マニュアル](https://mhchem.github.io/MathJax-mhchem/) を参照してください。よく使うものを抜粋します。

| 記法 | テキスト出力 | 説明 |
|------|------|------|
| `H2O` | H₂O | 数字は自動で下付き |
| `Na+`、`SO4^2-`、`[AgCl2]-` | Na⁺、SO₄²⁻、[AgCl₂]⁻ | 電荷 (末尾の `+`・`-` は電荷になる) |
| `2H2O`、`1/2 O2`、`$n$ H2O` | 2 H₂O、½ O₂、n H₂O | 係数 |
| `^{14}_{6}C`、`^{227}_{90}Th+` | ¹⁴₆C、²²⁷₉₀Th⁺ | 同位体 |
| `Fe^{II}Fe^{III}2O4` | FeᴵᴵFeᴵᴵᴵ₂O₄ | 酸化数 |
| `A -> B`、`A <- B` | A → B、A ← B | 反応矢印 |
| `A <=> B`、`A <=>> B`、`A <<=> B` | A ⇌ B | 平衡 (偏りあり・なし) |
| `A <-> B`、`A <--> B` | A ↔ B、A ⇄ B | 共鳴、両方向 |
| `A ->[H2O] B`、`A ->[$\Delta$][-H2O] B` | A →[H₂O] B | 矢印の上下の条件 |
| `BaSO4 v`、`O2 ^` | BaSO₄ ↓、O₂ ↑ | 沈殿・気体 (前に空白が必要) |
| `H2O(l)`、`NaCl(aq)` | H₂O(l)、NaCl(aq) | 状態記号 |
| `CuSO4*5H2O`、`CuSO4.5H2O` | CuSO₄·5 H₂O | 水和物 |
| `CH2=CH2`、`CH#CH`、`C6H5-CHO` | CH₂=CH₂、CH≡CH、C₆H₅−CHO | 結合 |
| `A\bond{~}B`、`A\bond{...}B` | A┄B、A⋅⋅⋅B | 特殊な結合 |
| `[Cu(NH3)4]^2+` | [Cu(NH₃)₄]²⁺ | 錯イオン |
| `\alpha`、`\mu-Cl`、`NO_x` | α、μ-Cl、NOₓ | ギリシャ文字・変数 |
| `OCO^{.-}`、`CH3^{.}` | OCO•⁻、CH₃• | ラジカル |
| `A + B`、`A = B`、`A \pm B` | A + B、A = B、A ± B | 演算子 (前後に空白) |

単位 (`type: 'pu'`)

| 記法 | テキスト出力 |
|------|------|
| `123 kJ/mol`、`123 kJ//mol` | 123 kJ/mol (`//` は分数表示) |
| `8.314 J K-1 mol-1` | 8.314 J K⁻¹ mol⁻¹ |
| `6.02e23 mol-1` | 6.02 ⋅ 10²³ mol⁻¹ |
| `-273.15 \degree C` | −273.15 °C |

> 注意: mhchem では、末尾の `-` は電荷になります。高分子の繰り返し単位 `[-CH2-CH2-]_n` は「CH₂⁻」と表示されるので、結合として書くときは `[-CH2-CH2{-}]_n` のように `{-}` を使います。MathJax の mhchem でも同じ表示になります。

### `$...$` の数式について

`$...$` の中や `\alpha` などの TeX は、HTML・テキスト出力では次の範囲を変換します。

- ギリシャ文字、よく使う記号 (`\Delta`・`\infty`・`\pm`・`\times`・`\approx`・`\le` など)
- `\frac`・`\sqrt`、`^`・`_`
- `\text`・`\mathrm`・`\underset`・`\overset`、`\ce` の入れ子

これ以外の TeX コマンドはコマンド名をそのまま表示し、コンソールに警告を出します。任意の数式を正確に描くには、`toLatex` の出力を MathJax・KaTeX で表示してください。

テキスト出力は Unicode の上付き・下付き文字を使った近似です。対応する文字がないものは `_(...)`・`^(...)` で表します。矢印の条件は `→[上][下]` の形になります。

## HTML 出力の CSS クラス

`toHtml` の出力には、次のクラスが付きます (プレフィックスがデフォルトの `chem` の場合)。上下積みや矢印のレイアウトに必要な標準 CSS は、ブラウザでは自動でページに入ります (`<style id="chem-markdown-style-chem">`)。入れたくない場合は `initialize({ injectStyles: false })` を指定してください。

| クラス | 内容 |
|------|------|
| `.chem-formula` / `.chem-pu` | 化学式・反応式全体 / 単位全体 |
| `.chem-term` | 反応式の項 (この中では改行しない) |
| `.chem-sub` / `.chem-sup` | 下付き / 上付き |
| `.chem-ss` | 上下に積んだ添字 (同位体・Kröger-Vink 記法) |
| `.chem-coef` | 係数 |
| `.chem-frac` | 分数 |
| `.chem-arrow` | 反応矢印 (`.chem-arrow-above`・`.chem-arrow-below` が条件) |
| `.chem-op` / `.chem-rel` | 演算子 / 関係記号 |
| `.chem-bond` | 結合 |
| `.chem-state` | 状態記号 |
| `.chem-i` / `.chem-b` | 斜体 / 太字 |
| `.chem-over` | `\underset`・`\overset` |
| `.chem-error` | 変換できなかった式 |

自動変換の出力には、さらに次のクラスが付きます。

- `.chem-block` - ブロック全体
- `.chem-line` - ブロック内の 1 行
- `.chem-inline` - インライン
- `.chem-structure` - 構造式の `<canvas>`

## API

| 関数・プロパティ | 説明 |
|------|------|
| `ChemMarkdown.toHtml(input, options?)` | HTML 形式でレンダリング (`type`・`prefix`) |
| `ChemMarkdown.toText(input, options?)` | Unicode テキスト形式でレンダリング (`type`) |
| `ChemMarkdown.toLatex(input, options?)` | LaTeX 形式でレンダリング。mhchem と同じ出力 (`type`) |
| `ChemMarkdown.parse(input, options?)` | mhchem の AST を返す (`type`) |
| `ChemMarkdown.initialize(config)` | 自動変換の設定 ([設定と手動実行](#設定と手動実行) を参照) |
| `ChemMarkdown.run(options?)` | ページ内の対象要素を変換 |
| `ChemMarkdown.version` | ライブラリのバージョン文字列 |

## マニュアル

記法・API・自動変換・CSS の詳しい説明と表示例は [docs/manual.ja.html](docs/manual.ja.html) にあります (英語版: [docs/manual.html](docs/manual.html))。ブラウザでそのまま開けます。

## デモ

- `index.html`: chem-markdown の出力に加え、MathJax (mhchem) による化学式・反応式と SmilesDrawer による構造式の表示例をまとめたデモページです。
- `examples/markdown.html`: Markdown を marked で HTML にしてから自動変換する例です。
- `examples/mhchem.html`: mhchem マニュアルの例文について、chem-markdown と MathJax mhchem の表示を並べて比べるページです。

`examples/mhchem.html` は例文集 (`tests/mhchem-examples.json`) を読み込むため、ローカルサーバー経由で開いてください (例: `python -m http.server`)。

## 開発

`dist/chem-markdown.js` は、`src/chem-markdown.js` に `vendor/mhchemParser.js` を埋め込んで生成します。ソースを変更したら次を実行してください (Node.js が必要。依存パッケージはありません)。

```bash
node tools/build.mjs
```

`tests/mhchem-examples.json` は mhchem マニュアルの例文集で、`examples/mhchem.html` の比較表示に使います。

## ライセンス

MIT

同梱している mhchemParser (`vendor/mhchemParser.js`) は Apache License 2.0 です (`vendor/mhchemParser.LICENSE.txt`)。
