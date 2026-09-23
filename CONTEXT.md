# Learn Me a Threat

A Markdown-authored blog explaining quantum threats to cryptocurrencies, post by post, with LaTeX-familiar authoring primitives (math, citations, callouts, figures) layered on top of plain Markdown.

## Language

**Label**:
A LaTeX-style `\label{key}` written immediately after a labelable element (an equation, definition, figure, algorithm, or heading) that gives it a referenceable key. Proximity-based: it binds to whichever labelable element came directly before it, the same convention as LaTeX's own `\label`.
_Avoid_: Anchor, id, tag (this codebase's `h-N` heading ids and KaTeX's own `\tag{}` are different, unrelated mechanisms).

**Ref**:
A `\ref{key}` written anywhere in a post's prose that resolves to a link pointing at the element a matching `\label{key}` marked. Renders as a number for equations/figures/algorithms ("Equation 3", "Figure 2", "Algorithm 1") or as the element's own name for definitions/headings (its bolded term, or its heading text).
_Avoid_: Cross-reference, citation (citations are `\cite{key}` against `references.bib` — a separate, pre-existing mechanism).

**Label registry**:
The build-time map of every `\label{key}` on the whole site to its resolved location (post, anchor, type, display text), built in a first pass over all posts before any `\ref` is resolved. One flat namespace: every label key must be unique across the entire site, regardless of type.

**Per-post label**:
A label (equation, figure, or algorithm) that can only be `\ref`'d from within the same post that defines it. Referencing it from a different post fails the build.

**Site-wide label**:
A label (definition or heading) that can be `\ref`'d from any post on the site, not just the one that defines it.
