# Revo MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for looking up words in [Reta Vortaro](https://www.reta-vortaro.de/revo/) — the comprehensive, open-source Esperanto dictionary.

Provides Esperanto definitions, examples, and translations across 174 languages to any MCP-compatible AI assistant (Claude Desktop, `claude` CLI, etc.).

## Features

- **Esperanto headword lookup** — definitions in Esperanto with example sentences
- **Translation lookup** — search in English, German, French, or any of 174 languages
- **Cross-language search** — find words across all available languages at once
- **X-system support** — type `cxirkaux` instead of `ĉirkaŭ`
- **Grammatical form stemming** — `amikojn` (plural accusative) automatically finds `amiko`
- **Cross-references** — related words, synonyms, antonyms

## Prerequisites

- [Bun](https://bun.sh/) 1.0+

## Setup

```bash
cd revo-mcp

# Install dependencies
bun install

# Download the Revo dictionary database (~43 MB download, ~280 MB extracted)
# and create search indexes
bun run setup
```

The setup script downloads the latest daily release of `revo.db` from [revuloj/revo-fonto releases](https://github.com/revuloj/revo-fonto/releases) and augments it with FTS5 full-text search indexes.

## Usage

### With Claude Desktop

Add to your Claude Desktop MCP configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "revo": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/revo-mcp/src/index.ts"]
    }
  }
}
```

### With `claude` CLI

Add to your MCP settings (`.claude/settings.json`):

```json
{
  "mcpServers": {
    "revo": {
      "command": "bun",
      "args": ["run", "/absolute/path/to/revo-mcp/src/index.ts"]
    }
  }
}
```

### Direct start

```bash
bun run start
```

The server communicates via stdio using the MCP protocol.

## MCP Tools

### `lookup`

Search the Esperanto dictionary.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | (required) | Word to look up |
| `lang` | string | `"eo"` | `"eo"` for Esperanto, `"en"`/`"de"`/`"fr"`/etc. for translations, `"all"` for any language |
| `show_languages` | string[] | `["en","de","fr","es","ru","zh","ja"]` | Which translation languages to display |
| `limit` | number | `5` | Max results (1-20) |

**Examples:**

- Look up an Esperanto word: `lookup({ query: "amiko" })`
- Find English translation: `lookup({ query: "friend", lang: "en" })`
- Search German: `lookup({ query: "Hund", lang: "de" })`
- X-system input: `lookup({ query: "cxirkaux" })`
- Inflected form: `lookup({ query: "amikojn" })`
- Cross-language: `lookup({ query: "друг", lang: "all" })`

### `languages`

Lists all 174 available languages with translation counts. Takes no parameters.

## Testing

```bash
# Run all tests (requires revo.db — run `bun run setup` first)
bun test
```

The test suite includes:
- Unit tests for the Esperanto stemmer and HTML extraction
- Integration tests for the database query layer
- 100 real-world usage scenarios covering beginner learners, advanced users, x-system input, stemming, multi-language search, and edge cases

## Architecture

```
revo-mcp/
├── src/
│   ├── index.ts           # MCP server entry point (stdio transport)
│   ├── db.ts              # SQLite queries (headword, translation, FTS search)
│   ├── setup.ts           # Database download and FTS index creation
│   ├── stemmer.ts         # Esperanto stemmer, x-system, normalization
│   ├── html-extract.ts    # Extract definitions/examples from article HTML
│   ├── formatter.ts       # Format results as Markdown
│   └── tools/
│       ├── lookup.ts      # lookup tool handler
│       └── languages.ts   # languages tool handler
├── test/
│   ├── stemmer.test.ts
│   ├── html-extract.test.ts
│   ├── lookup.test.ts
│   └── scenarios.test.ts  # 100 usage scenarios
└── data/
    └── revo.db            # Downloaded database (gitignored)
```

The server uses the pre-built SQLite database from the Revo daily releases, which contains:
- 48,000+ headword entries
- 801,000+ translations across 174 languages
- 13,000+ full article definitions as HTML
- Cross-references, usage domains, and variant spellings

## License

The Reta Vortaro dictionary content is licensed under the [GNU General Public License](https://www.gnu.org/licenses/gpl-3.0.html).
