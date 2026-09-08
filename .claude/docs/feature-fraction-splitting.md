# Feature: Fraction-Based Pagination Splitting

## Overview
The document pagination system uses two measurement approaches:
1. **Real measurement** (measure-document.tsx): Renders blocks off-screen and measures their actual pixel height via getBoundingClientRect().
2. **Heuristic estimation** (document-builder.ts): Calculates approximate height using character count and line height constants.

## The Problem
When a block doesn't fit on the current page, splitBlock() must decide WHERE to cut the text. Previously, it used the heuristic system to determine the cut point, but the available space came from the real measurement system. These two systems disagreed, causing text to be cut too early and leaving large whitespace at the bottom of pages.

## The Solution: Fraction-Based Splitting
Instead of converting between measurement systems, we now compute what fraction of the content fits:
textFraction = realAvailableForText / realTotalTextHeight
Then split the text at that fraction of paragraphs/sentences/words, using the heuristic only for relative proportions between paragraphs (which is accurate even when absolute values are off).

### Key Functions
- splitTextByFraction(text, fraction): Splits text at the given fraction (0-1), trying paragraphs, sentences, words.
- splitBlock(block, rawAvailableMM, measuredTotalHeightMM?): When measuredTotalHeightMM is provided, uses the fraction approach. Otherwise falls back to heuristic-only.

### Supported Block Types
- section-heading (with introTexto)
- number-entry
- cycles-intro
- multi-number-entry, timeline-entry, dia-pessoal-entry, triangulo-piramide, triangulo-arcanos-lista (item-level splitting)

## Files
- src/lib/document-builder.ts: splitBlock(), splitTextByFraction(), splitTextAtHeight()
- src/lib/measure-document.tsx: splitIntoPagesReal() passes bh (real height) to splitBlock()
